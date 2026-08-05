/**
 * Baika Archery System
 * Project Zero v2
 * 認証・部員情報処理
 */

/**
 * metadataシートから部員マスターを取得する。
 *
 * 旧形式:
 * ["部員A", "部員B"]
 *
 * 新形式:
 * [
 *   {
 *     memberId: "mem_001",
 *     name: "部員A",
 *     displayName: "部員A",
 *     role: "member",
 *     active: true
 *   }
 * ]
 *
 * どちらの形式でも、normalizeMemberMaster() によって
 * 新形式へ統一して返す。
 */
function getMemberMaster() {
  /*
   * 1. membersシートを優先して読み込む。
   */
  const memberRows =
    readSheetData(
      SHEET_NAMES.MEMBERS
    );

  const membersFromSheet =
    memberRows
      .filter(function(row) {
        if (
          !row ||
          typeof row !== "object"
        ) {
          return false;
        }

        const memberId =
          String(
            row.memberId || ""
          ).trim();

        const memberName =
          String(
            row.memberName ||
            row.name ||
            row.displayName ||
            ""
          ).trim();

        return Boolean(
          memberId &&
          memberName
        );
      })
      .map(function(row) {
        const memberName =
          String(
            row.memberName ||
            row.name ||
            row.displayName ||
            ""
          ).trim();

        return {
          memberId:
            String(
              row.memberId || ""
            ).trim(),

          name:
            memberName,

          displayName:
            String(
              row.displayName ||
              memberName
            ).trim(),

          role:
  normalizeRole_(
    String(row.role || "").trim()
  ),

          active:
            normalizeBooleanValue_(
              row.active,
              true
            ),

          updatedAt:
            String(
              row.updatedAt || ""
            ).trim(),

          updatedBy:
            String(
              row.updatedBy || ""
            ).trim()
        };
      });

  if (membersFromSheet.length > 0) {
    return normalizeMemberMaster(
      membersFromSheet
    );
  }

  /*
   * 2. membersシートに有効なデータがない場合は、
   *    既存のmetadataへ戻る。
   */
  const metadata =
    readSheetData(
      SHEET_NAMES.METADATA
    );

  const memberRow =
    metadata.find(function(row) {
      return (
        row &&
        row.key === "memberMaster"
      );
    });

  if (
    memberRow &&
    memberRow.json
  ) {
    const memberMaster =
      parseMetadataJson_(
        memberRow.json
      );

    return normalizeMemberMaster(
      memberMaster
    );
  }

  /*
   * 3. どちらにもデータがない場合は既定値を使う。
   */
  return normalizeMemberMaster(
    DEFAULT_DATA.MEMBERS
  );
}

/**
 * スプレッドシート由来の値を真偽値へ変換する。
 */
function normalizeBooleanValue_(
  value,
  defaultValue
) {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  const normalizedValue =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    normalizedValue === "true" ||
    normalizedValue === "1" ||
    normalizedValue === "yes"
  ) {
    return true;
  }

  if (
    normalizedValue === "false" ||
    normalizedValue === "0" ||
    normalizedValue === "no"
  ) {
    return false;
  }

  return defaultValue;
}

/**
 * 部員IDまたは部員名から部員を検索する。
 */
function findMember(memberIdentifier) {
  const identifier = String(memberIdentifier || "").trim();

  if (!identifier) {
    return null;
  }

  const members = getMemberMaster();

  const member = members.find(function(item) {
    return (
      item.memberId === identifier ||
      item.name === identifier ||
      item.displayName === identifier
    );
  });

  return member || null;
}


/**
 * パスワード一覧をmetadataシートから取得する。
 *
 * 現在は既存仕様との互換性を保つため、
 * 部員名をキーとする形式にも対応する。
 */
function getMemberPasswords() {
  /*
   * 既存metadataのパスワードを
   * フォールバック用として先に取得する。
   */
  const metadata =
    readSheetData(
      SHEET_NAMES.METADATA
    );

  const passwordRow =
    metadata.find(function(row) {
      return (
        row &&
        row.key === "memberPasswords"
      );
    });

  let passwords = {};

  if (
    passwordRow &&
    passwordRow.json
  ) {
    const metadataPasswords =
      parseMetadataJson_(
        passwordRow.json
      );

    if (
      metadataPasswords &&
      typeof metadataPasswords === "object" &&
      !Array.isArray(metadataPasswords)
    ) {
      passwords = {
        ...metadataPasswords
      };
    }
  }

  /*
   * membersシートに保存されている
   * パスワードを優先して反映する。
   */
  const memberRows =
    readSheetData(
      SHEET_NAMES.MEMBERS
    );

  memberRows.forEach(function(row) {
    if (
      !row ||
      typeof row !== "object"
    ) {
      return;
    }

    const memberId =
      String(
        row.memberId || ""
      ).trim();

    const memberName =
      String(
        row.memberName ||
        row.name ||
        ""
      ).trim();

    const displayName =
      String(
        row.displayName ||
        memberName
      ).trim();

    const password =
      String(
        row.password ||
        row.initialPassword ||
        ""
      );

    if (
      !memberId ||
      !password
    ) {
      return;
    }

    /*
     * memberIdを正式なキーとして保存する。
     */
    passwords[memberId] =
      password;

    /*
     * 旧形式との互換性を保つため、
     * 氏名でも検索できる状態を残す。
     */
    if (memberName) {
      passwords[memberName] =
        password;
    }

    if (displayName) {
      passwords[displayName] =
        password;
    }
  });

  return passwords;
}


/**
 * ログイン認証を行う。
 *
 * 成功時:
 * {
 *   success: true,
 *   member: {
 *     memberId,
 *     memberName,
 *     displayName,
 *     role
 *   }
 * }
 *
 * 失敗時:
 * {
 *   success: false,
 *   message: "..."
 * }
 */
function authenticateMember(memberIdentifier, password) {
  const member = findMember(memberIdentifier);

  if (!member) {
    return {
      success: false,
      message: "部員情報が見つかりません。"
    };
  }

  if (member.active === false) {
    return {
      success: false,
      message: "このアカウントは現在利用できません。"
    };
  }

  const passwords = getMemberPasswords();

  /*
   * 移行期間中は、次の順番でパスワードを探す。
   *
   * 1. memberId
   * 2. name
   * 3. displayName
   * 4. 共通初期パスワード
   */
  const correctPassword =
    passwords[member.memberId] ||
    passwords[member.name] ||
    passwords[member.displayName] ||
    DEFAULT_DATA.DEFAULT_PASSWORD;

  if (String(password || "") !== String(correctPassword || "")) {
    return {
      success: false,
      message: "パスワードが正しくありません。"
    };
  }

  return {
    success: true,

    member: {
      memberId: member.memberId,
      memberName: member.name,
      displayName: member.displayName,
      role: member.role
    }
  };
}


/**
 * 既存コードとの互換用関数。
 *
 * 以前と同じように true / false を返すため、
 * 現在のログイン処理を壊さない。
 */
function checkPassword(memberName, password) {
  const result = authenticateMember(memberName, password);

  return result.success === true;
}


/**
 * 管理者かどうかを確認する。
 */
function isAdminMember(memberIdentifier) {
  const member = findMember(memberIdentifier);

  return Boolean(
    member &&
    member.active !== false &&
    member.role === ROLE_NAMES.ADMIN
  );
}


/**
 * metadataシートから取得したJSON値を安全に変換する。
 *
 * readSheetData()ですでにオブジェクトになっている場合は
 * そのまま返す。
 */
function parseMetadataJson_(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(
      "metadataのJSON変換に失敗しました:",
      error
    );

    return null;
  }
}


/**
 * 認証処理の確認用テスト。
 *
 * この関数はデータを書き換えない。
 */
function testAuthenticateMember() {
  const members = getMemberMaster();

  console.log(
    "変換後の部員マスター:"
  );

  console.log(
    JSON.stringify(members, null, 2)
  );

  if (members.length === 0) {
    console.log("部員が登録されていません。");
    return;
  }

  const firstMember = members[0];

  const result = authenticateMember(
    firstMember.memberId,
    DEFAULT_DATA.DEFAULT_PASSWORD
  );

  console.log(
    "認証テスト結果:"
  );

  console.log(
    JSON.stringify(result, null, 2)
  );
}