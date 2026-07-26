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
  const metadata = readSheetData(SHEET_NAMES.METADATA);

  const memberRow = metadata.find(function(row) {
    return row.key === "memberMaster";
  });

  let memberMaster = DEFAULT_DATA.MEMBERS;

  if (memberRow && memberRow.json) {
    memberMaster = parseMetadataJson_(memberRow.json);
  }

  return normalizeMemberMaster(memberMaster);
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
  const metadata = readSheetData(SHEET_NAMES.METADATA);

  const passwordRow = metadata.find(function(row) {
    return row.key === "memberPasswords";
  });

  if (!passwordRow || !passwordRow.json) {
    return {};
  }

  const passwords = parseMetadataJson_(passwordRow.json);

  if (!passwords || typeof passwords !== "object" || Array.isArray(passwords)) {
    return {};
  }

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