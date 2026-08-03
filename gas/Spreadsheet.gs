function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  return sheet;
}

function readSheetData(sheetName) {
  const sheet = getOrCreateSheet(sheetName);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) return [];

  const headers = values[0];

  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      let value = row[index];

      if (header === "json" && typeof value === "string") {
        try {
          value = JSON.parse(value);
        } catch (e) {}
      }

      if (
        (header === "date" || header === "matchDate") &&
        value instanceof Date
      ) {
        value = Utilities.formatDate(
          value,
          "Asia/Tokyo",
          "yyyy-MM-dd"
        );
      }

      obj[header] = value;
    });

    return obj;
  });
}

/**
 * metadataシートの指定項目だけを追加・更新する。
 *
 * 他のmetadata項目は残したまま、
 * 同じkeyがあればjsonを更新し、
 * なければ新しい行として追加する。
 */
function upsertMetadataValue(key, value) {
  const metadata =
    readSheetData(SHEET_NAMES.METADATA);

  const normalizedKey =
    String(key || "").trim();

  if (!normalizedKey) {
    throw new Error(
      "metadataのkeyが指定されていません。"
    );
  }

  const updatedMetadata = [];
  let isUpdated = false;

  metadata.forEach(function(row) {
    if (!row || typeof row !== "object") {
      return;
    }

    if (String(row.key || "") === normalizedKey) {
      updatedMetadata.push({
        key: normalizedKey,
        json: value
      });

      isUpdated = true;
      return;
    }

    updatedMetadata.push(row);
  });

  if (!isUpdated) {
    updatedMetadata.push({
      key: normalizedKey,
      json: value
    });
  }

  overwriteSheet(
    SHEET_NAMES.METADATA,
    updatedMetadata
  );

  return value;
}

/**
 * 部員マスターを確認用membersシートへ同期する。
 *
 * metadataシートはシステム処理用として維持し、
 * membersシートには人が確認しやすい形式で
 * 1部員につき1行を書き出す。
 *
 * 管理者が部員のパスワードを確認できるよう、
 * 現在有効なパスワードもinitialPassword列へ出力する。
 */
function syncMembersSheet(
  members,
  memberPasswords
) {
  const normalizedMembers =
    normalizeMemberMaster(members);

  const passwords =
    memberPasswords &&
    typeof memberPasswords === "object" &&
    !Array.isArray(memberPasswords)
      ? memberPasswords
      : {};

  const rows =
    normalizedMembers.map(function(member) {
      const memberId =
        String(member.memberId || "");

      const memberName =
        String(member.name || "");

      const displayName =
        String(
          member.displayName ||
          member.name ||
          ""
        );

      const effectivePassword =
        passwords[memberId] ||
        passwords[memberName] ||
        passwords[displayName] ||
        DEFAULT_DATA.DEFAULT_PASSWORD;

      return {
        memberId: memberId,

        memberName: memberName,

        displayName: displayName,

        role:
          member.role === ROLE_NAMES.ADMIN
            ? ROLE_NAMES.ADMIN
            : ROLE_NAMES.MEMBER,

        active:
          member.active !== false,

        initialPassword:
          String(effectivePassword || "")
      };
    });

  overwriteSheet(
    SHEET_NAMES.MEMBERS,
    rows
  );

  return rows;
}

function overwriteSheet(sheetName, data) {
  const sheet = getOrCreateSheet(sheetName);
  sheet.clearContents();

  if (!data || data.length === 0) return;

    const headers = [];

  data.forEach(item => {
    if (!item || typeof item !== "object") {
      return;
    }

    Object.keys(item).forEach(key => {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    });
  });

    const preferredHeaderOrder = [
    "date",
    "memberId",
    "memberName",
    "distance",
    "a1",
    "a2",
    "a3",
    "a4",
    "a5",
    "a6",
    "total",
    "pins"
  ];

  headers.sort((a, b) => {
    const aIndex = preferredHeaderOrder.indexOf(a);
    const bIndex = preferredHeaderOrder.indexOf(b);

    if (aIndex === -1 && bIndex === -1) {
      return 0;
    }

    if (aIndex === -1) {
      return 1;
    }

    if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });

  const rows = data.map(item => {
    return headers.map(header => {
      let value = item[header];

      if (
        header === "date" ||
        header === "matchDate"
      ) {
        value = normalizeDateText(value);
      }

      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
      }

      return value;
    });
  });

  const allValues = [headers, ...rows];

  const range = sheet.getRange(
    1,
    1,
    allValues.length,
    headers.length
  );

  range.setValues(allValues);

  headers.forEach((header, index) => {
    if (
      header === "date" ||
      header === "matchDate"
    ) {
      sheet
        .getRange(
          2,
          index + 1,
          rows.length,
          1
        )
        .setNumberFormat("@");
    }
  });
}

function normalizeDateText(value) {
  if (!value) return "";

  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      "Asia/Tokyo",
      "yyyy-MM-dd"
    );
  }

  const text = String(value).trim();

  const dateOnlyMatch =
    text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    return text;
  }

  const isoMatch =
    text.match(/^(\d{4})-(\d{2})-(\d{2})T/);

  if (isoMatch) {
    const date = new Date(text);

    if (!isNaN(date.getTime())) {
      return Utilities.formatDate(
        date,
        "Asia/Tokyo",
        "yyyy-MM-dd"
      );
    }
  }

  return text.replace(/\//g, "-");
}

