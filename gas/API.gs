/**
 * Baika Archery System
 * Project Zero v2
 * GAS Web API
 */

/**
 * GETリクエストを処理する。
 *
 * 現在の既存仕様:
 * practice・match・metadataをまとめて返す。
 *
 * 今後、actionごとの取得処理へ段階的に移行する。
 */
function handleGet(e) {
  try {
    const action =
      e && e.parameter
        ? String(e.parameter.action || "").trim()
        : "";

    /*
     * 現時点ではaction未指定時に
     * 既存の一括取得処理を維持する。
     */
    if (!action) {
  const data = {
    practice: readSheetData(SHEET_NAMES.PRACTICE),
    match: readSheetData(SHEET_NAMES.MATCH),
    metadata: readSheetData(SHEET_NAMES.METADATA)
  };

  return createJsonResponse(data);
}

/*
 * 大会記録一覧用。
 *
 * practice・metadataを含めず、
 * matchシートだけを返す。
 */
if (action === "getMatchRecords") {
  return createJsonResponse({
    success: true,
    match:
      readSheetData(
        SHEET_NAMES.MATCH
      )
  });
}

/*
 * 部員管理画面用。
 *
 * getMemberMaster()を通すことで、
 * metadataにmemberMasterが存在しない場合も
 * DEFAULT_DATA.MEMBERSを返す。
 *
 * また、旧形式の文字列配列も
 * memberId・name・displayName・role・activeを持つ
 * 新形式へ統一して返す。
 */

if (action === "getMembers") {
  return createJsonResponse({
    success: true,
    members: getMemberMaster()
  });
}

/*
 * 部員編集画面用。
 */
if (action === "getMemberDetails") {
  const memberId =
    e && e.parameter
      ? String(
          e.parameter.memberId || ""
        ).trim()
      : "";

  return handleGetMemberDetailsAction_(
    memberId
  );
}

/*
 * 本人用プロフィール設定画面。
 *
 * 管理者用のgetMemberDetailsとは異なり、
 * パスワードをレスポンスへ含めない。
 */
if (action === "getMyProfile") {
  const memberId =
    e && e.parameter
      ? String(
          e.parameter.memberId || ""
        ).trim()
      : "";

  return handleGetMyProfileAction_(
    memberId
  );
}

/*
 * 未対応の取得処理。
 */
return createJsonResponse({
  success: false,
  message: "指定された取得処理は存在しません。",
  action: action
});

    } catch (error) {
    console.error(
      "GET APIエラー:",
      error
    );

    return createJsonResponse({
      success: false,

      message:
        error && error.message
          ? error.message
          : String(error),

      stack:
        error && error.stack
          ? error.stack
          : ""
    });
  }
}

/**
 * 部員編集画面へ部員詳細を返す。
 */
function handleGetMemberDetailsAction_(
  memberId
) {
  const normalizedMemberId =
    String(memberId || "").trim();

  if (!normalizedMemberId) {
    return createJsonResponse({
      success: false,
      message: "部員IDが指定されていません。"
    });
  }

  const member =
    findMember(normalizedMemberId);

  if (!member) {
    return createJsonResponse({
      success: false,
      message: "指定された部員が見つかりません。"
    });
  }

  const passwords =
    getMemberPasswords();

  const currentPassword =
    passwords[member.memberId] ||
    passwords[member.name] ||
    passwords[member.displayName] ||
    DEFAULT_DATA.DEFAULT_PASSWORD;

  return createJsonResponse({
    success: true,

    member: {
      memberId:
        String(member.memberId || ""),

      name:
        String(member.name || ""),

      displayName:
        String(
          member.displayName ||
          member.name ||
          ""
        ),

      nickname:
        String(
          member.nickname || ""
        ),

      role:
  member.role === ROLE_NAMES.ADMIN
    ? ROLE_NAMES.ADMIN
    : (
        member.role === ROLE_NAMES.COACH
          ? ROLE_NAMES.COACH
          : ROLE_NAMES.MEMBER
      ),

      active:
        member.active !== false,

      password:
        String(currentPassword || "")
    }
  });
}


/**
 * 本人用プロフィール設定画面へ
 * パスワードを含まない部員情報を返す。
 *
 * @param {string} memberId
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function handleGetMyProfileAction_(
  memberId
) {
  const normalizedMemberId =
    String(memberId || "").trim();

  if (!normalizedMemberId) {
    return createJsonResponse({
      success: false,
      message: "部員IDが指定されていません。"
    });
  }

  const member =
    findMember(normalizedMemberId);

  if (!member) {
    return createJsonResponse({
      success: false,
      message: "指定された部員が見つかりません。"
    });
  }

  if (member.active === false) {
    return createJsonResponse({
      success: false,
      message:
        "このアカウントは現在利用できません。"
    });
  }

  return createJsonResponse({
    success: true,

    member: {
      memberId:
        String(member.memberId || ""),

      memberName:
        String(member.name || ""),

      displayName:
        String(
          member.displayName ||
          member.name ||
          ""
        ),

      nickname:
        String(
          member.nickname || ""
        ),

      role:
        member.role === ROLE_NAMES.ADMIN
          ? ROLE_NAMES.ADMIN
          : (
              member.role === ROLE_NAMES.COACH
                ? ROLE_NAMES.COACH
                : ROLE_NAMES.MEMBER
            )
    }
  });
}

/**
 * POSTリクエストを処理する。
 */
function handlePost(e) {
  try {
    if (
      !e ||
      !e.postData ||
      !e.postData.contents
    ) {
      return createJsonResponse({
        success: false,
        message: "送信データがありません。"
      });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = String(payload.action || "").trim();

    /*
     * Project Zero v2 ログインAPI
     *
     * 送信例:
     * {
     *   action: "login",
     *   memberIdentifier: "部員A",
     *   password: "baika"
     * }
     */
    if (action === "login") {
  return handleLoginAction_(payload);
}

/**
 * 大会記録1件の追加・更新要求を処理する。
 */
function handleSaveMatchRecordAction_(
  payload
) {
  const record =
    payload &&
    payload.record &&
    typeof payload.record === "object"
      ? payload.record
      : null;

  if (!record) {
    return createJsonResponse({
      success: false,
      message:
        "保存する大会記録が指定されていません。"
    });
  }

  const recordId =
    String(
      record.recordId || ""
    ).trim();

  if (!recordId) {
    return createJsonResponse({
      success: false,
      message:
        "大会記録IDが指定されていません。"
    });
  }

  const result =
    upsertMatchRecord(
      record
    );

  return createJsonResponse({
    success: true,
    message:
      result.operation === "updated"
        ? "大会記録を更新しました。"
        : "大会記録を追加しました。",

    recordId:
      result.recordId,

    operation:
      result.operation,

    rowNumber:
      result.rowNumber
  });
}

if (action === "addMember") {
  return handleAddMemberAction_(payload);
}

if (action === "updateMemberName") {
  return handleUpdateMemberNameAction_(payload);
}

/*
 * 本人用プロフィール更新。
 */
if (action === "updateMyProfile") {
  return handleUpdateMyProfileAction_(
    payload
  );
}

/*
 * 本人用パスワード変更。
 */
if (action === "changeMyPassword") {
  return handleChangeMyPasswordAction_(
    payload
  );
}

/*
 * 大会記録1件を追加または更新する。
 */
if (action === "saveMatchRecord") {
  return handleSaveMatchRecordAction_(
    payload
  );
}

/*
 * 練習記録1件を高速保存する。
 *
 * practiceシート全体を書き直さず、
 * 新しい1件だけを末尾へ追加する。
 */
if (action === "appendPracticeRecord") {
  const record =
    payload &&
    payload.record &&
    typeof payload.record === "object"
      ? payload.record
      : null;

  if (!record) {
    return createJsonResponse({
      success: false,
      message:
        "保存する練習記録が指定されていません。"
    });
  }

  const result =
    appendPracticeRecord(
      record
    );

  return createJsonResponse({
    success: true,
    message:
      "練習記録を追加しました。",
    operation:
      result.operation,
    rowNumber:
      result.rowNumber
  });
}

/*
 * ここから下は既存互換処理。
 *
 * 現在のcloud.jsは、
 * {
 *   mode: "practice",
 *   data: [...]
 * }
 *
 * の形式で送信しているため、
 * 既存機能を壊さないよう残す。
 */
    const mode = String(payload.mode || "").trim();
    const data = Array.isArray(payload.data)
      ? payload.data
      : [];

    if (mode === "practice") {
      overwriteSheet(
        SHEET_NAMES.PRACTICE,
        data
      );

      return createJsonResponse({
        success: true,
        mode: mode
      });
    }

    if (mode === "match") {
      overwriteSheet(
        SHEET_NAMES.MATCH,
        data
      );

      return createJsonResponse({
        success: true,
        mode: mode
      });
    }

    if (mode === "metadata") {
      overwriteSheet(
        SHEET_NAMES.METADATA,
        data
      );

      return createJsonResponse({
        success: true,
        mode: mode
      });
    }

    return createJsonResponse({
  success: false,
  message: "処理方法が指定されていません。"
});

  } catch (error) {
    console.error(
      "POST APIエラー:",
      error
    );

    return createJsonResponse({
      success: false,
      message:
        error && error.message
          ? error.message
          : String(error),

      stack:
        error && error.stack
          ? error.stack
          : ""
    });
  }
}


/**
 * ログイン要求を処理する。
 */
function handleLoginAction_(payload) {
  const memberIdentifier = String(
    payload.memberIdentifier ||
    payload.memberName ||
    payload.member ||
    ""
  ).trim();

  const password = String(
    payload.password || ""
  );

  if (!memberIdentifier) {
    return createJsonResponse({
      success: false,
      message: "部員を選択してください。"
    });
  }

  if (!password) {
    return createJsonResponse({
      success: false,
      message: "パスワードを入力してください。"
    });
  }

  const result = authenticateMember(
    memberIdentifier,
    password
  );

  return createJsonResponse(result);
}

/**
 * 部員追加要求を処理する。
 */
function handleAddMemberAction_(payload) {
  const name = String(
    payload.memberName ||
    payload.name ||
    ""
  ).trim();

  const requestedRole =
  String(payload.role || "");

const role =
  requestedRole === ROLE_NAMES.ADMIN
    ? ROLE_NAMES.ADMIN
    : (
        requestedRole === ROLE_NAMES.COACH
          ? ROLE_NAMES.COACH
          : ROLE_NAMES.MEMBER
      );

  const sortOrderRaw =
  payload.sortOrder;

const sortOrder =
  sortOrderRaw === null ||
  sortOrderRaw === undefined ||
  String(sortOrderRaw).trim() === ""
    ? ""
    : Number(sortOrderRaw);

  if (!name) {
    return createJsonResponse({
      success: false,
      message: "氏名を入力してください。"
    });
  }

  if (!password) {
    return createJsonResponse({
      success: false,
      message: "初期パスワードを入力してください。"
    });
  }

  const members = getMemberMaster();

  const duplicateMember =
    members.find(function(member) {
      return (
        String(member.name || "").trim() === name ||
        String(member.displayName || "").trim() === name
      );
    });

  if (duplicateMember) {
    return createJsonResponse({
      success: false,
      message: "同じ氏名の部員が既に登録されています。"
    });
  }

  const memberId =
    createNextMemberId_(members);

  const newMember = {
  memberId: memberId,
  name: name,
  displayName: name,
  role: role,
  active: true,
  sortOrder: sortOrder
};

  const updatedMembers =
    members.concat(newMember);

  const passwords =
    getMemberPasswords();

  passwords[memberId] = password;

  upsertMetadataValue(
  "memberMaster",
  updatedMembers
);

upsertMetadataValue(
  "memberPasswords",
  passwords
);

console.log(
  "membersシート同期開始:",
  JSON.stringify(updatedMembers)
);

const syncedMembers =
  syncMembersSheet(
    updatedMembers,
    passwords
  );

console.log(
  "membersシート同期完了:",
  JSON.stringify(syncedMembers)
);

return createJsonResponse({

    success: true,
    message: "部員を登録しました。",
    member: newMember,
    members: updatedMembers
  });
}

/**
 * 部員氏名の更新要求を処理する。
 */
function handleUpdateMemberNameAction_(payload) {
  const memberId =
    String(
      payload.memberId || ""
    ).trim();

  const newName =
    String(
      payload.memberName ||
      payload.name ||
      ""
    ).trim();

  const updatedBy =
String(
payload.updatedBy || ""
).trim();

const sortOrderRaw =
payload.sortOrder;

const sortOrder =
sortOrderRaw === null ||
sortOrderRaw === undefined ||
String(sortOrderRaw).trim() === ""
? ""
: Number(sortOrderRaw);

const requestedRole =
String(
payload.role || ""
).trim();

const newRole =
  requestedRole === ROLE_NAMES.ADMIN
    ? ROLE_NAMES.ADMIN
    : (
        requestedRole === ROLE_NAMES.COACH
          ? ROLE_NAMES.COACH
          : ROLE_NAMES.MEMBER
      );

  if (!memberId) {
    return createJsonResponse({
      success: false,
      message: "部員IDが指定されていません。"
    });
  }

  if (!newName) {
    return createJsonResponse({
      success: false,
      message: "氏名を入力してください。"
    });
  }

if (
sortOrder !== "" &&
(
!Number.isInteger(sortOrder) ||
sortOrder < 1
)
) {
return createJsonResponse({
success: false,
message:
"ログイン表示順は1以上の整数で入力してください。"
});
}

  const members =
    getMemberMaster();

  const targetIndex =
    members.findIndex(function(member) {
      return (
        String(member.memberId || "") ===
        memberId
      );
    });

  if (targetIndex < 0) {
    return createJsonResponse({
      success: false,
      message: "指定された部員が見つかりません。"
    });
  }

  const duplicateMember =
    members.find(function(member) {
      return (
        String(member.memberId || "") !== memberId &&
        (
          String(member.name || "").trim() === newName ||
          String(member.displayName || "").trim() === newName
        )
      );
    });

  if (duplicateMember) {
    return createJsonResponse({
      success: false,
      message: "同じ氏名の部員が既に登録されています。"
    });
  }

  const previousMember =
    members[targetIndex];

  const updatedAt =
    Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "yyyy-MM-dd HH:mm:ss"
    );

  const updatedMember = {
...previousMember,

name:
newName,

displayName:
newName,

role:
newRole,

sortOrder:
sortOrder,

updatedAt:
updatedAt,

updatedBy:
updatedBy
};

  const updatedMembers =
    members.map(function(member, index) {
      return index === targetIndex
        ? updatedMember
        : member;
    });

  const passwords =
    getMemberPasswords();

  upsertMetadataValue(
    "memberMaster",
    updatedMembers
  );

  syncMembersSheet(
    updatedMembers,
    passwords
  );

  return createJsonResponse({
    success: true,
    message: "氏名を更新しました。",
    member: updatedMember,
    members: updatedMembers
  });
}

/**
 * 本人用プロフィール更新要求を処理する。
 *
 * 更新できる項目:
 * - displayName
 * - nickname
 *
 * 更新できない項目:
 * - memberId
 * - name
 * - role
 * - active
 *
 * @param {Object} payload
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function handleUpdateMyProfileAction_(
  payload
) {
  const memberId =
    String(
      payload.memberId || ""
    ).trim();

  const displayName =
    String(
      payload.displayName || ""
    ).trim();

  const nickname =
    String(
      payload.nickname || ""
    ).trim();

  const currentPassword =
    String(
      payload.currentPassword || ""
    );

  if (!memberId) {
    return createJsonResponse({
      success: false,
      message:
        "部員IDを確認できませんでした。"
    });
  }

  if (!displayName) {
    return createJsonResponse({
      success: false,
      message:
        "表示名を入力してください。"
    });
  }

  if (!currentPassword) {
    return createJsonResponse({
      success: false,
      message:
        "現在のパスワードを入力してください。"
    });
  }

  /*
   * 現在のパスワードで本人確認する。
   */
  const authenticationResult =
    authenticateMember(
      memberId,
      currentPassword
    );

  if (
    !authenticationResult ||
    authenticationResult.success !== true
  ) {
    return createJsonResponse({
      success: false,
      message:
        authenticationResult &&
        authenticationResult.message
          ? authenticationResult.message
          : "本人確認に失敗しました。"
    });
  }

  const members =
    getMemberMaster();

  const targetIndex =
    members.findIndex(
      function(member) {
        return (
          String(
            member.memberId || ""
          ).trim() === memberId
        );
      }
    );

  if (targetIndex < 0) {
    return createJsonResponse({
      success: false,
      message:
        "指定された部員が見つかりません。"
    });
  }

  /*
   * 他の部員と表示名が重複しないか確認する。
   *
   * ログイン検索でもdisplayNameを使用するため、
   * 重複を許可しない。
   */
  const duplicateMember =
    members.find(
      function(member) {
        return (
          String(
            member.memberId || ""
          ).trim() !== memberId &&
          String(
            member.displayName ||
            ""
          ).trim() === displayName
        );
      }
    );

  if (duplicateMember) {
    return createJsonResponse({
      success: false,
      message:
        "同じ表示名の部員が既に登録されています。"
    });
  }

  const previousMember =
    members[targetIndex];

  const updatedAt =
    Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "yyyy-MM-dd HH:mm:ss"
    );

  const updatedMember = {
    ...previousMember,

    displayName:
      displayName,

    nickname:
      nickname,

    updatedAt:
      updatedAt,

    updatedBy:
      memberId
  };

  const updatedMembers =
    members.map(
      function(member, index) {
        return index === targetIndex
          ? updatedMember
          : member;
      }
    );

  const passwords =
    getMemberPasswords();

  upsertMetadataValue(
    "memberMaster",
    updatedMembers
  );

  syncMembersSheet(
    updatedMembers,
    passwords
  );

  return createJsonResponse({
    success: true,

    message:
      "プロフィールを更新しました。",

    member: {
      memberId:
        String(
          updatedMember.memberId || ""
        ),

      memberName:
        String(
          updatedMember.name || ""
        ),

      displayName:
        String(
          updatedMember.displayName ||
          updatedMember.name ||
          ""
        ),

      nickname:
        String(
          updatedMember.nickname || ""
        ),

      role:
        String(
          updatedMember.role ||
          ROLE_NAMES.MEMBER
        )
    }
  });
}

/**
 * 本人用パスワード変更要求を処理する。
 *
 * @param {Object} payload
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function handleChangeMyPasswordAction_(
  payload
) {
  const memberId =
    String(
      payload.memberId || ""
    ).trim();

  const currentPassword =
    String(
      payload.currentPassword || ""
    );

  const newPassword =
    String(
      payload.newPassword || ""
    );

  const confirmPassword =
    String(
      payload.confirmPassword || ""
    );

  if (!memberId) {
    return createJsonResponse({
      success: false,
      message:
        "部員IDを確認できませんでした。"
    });
  }

  if (!currentPassword) {
    return createJsonResponse({
      success: false,
      message:
        "現在のパスワードを入力してください。"
    });
  }

  if (!newPassword) {
    return createJsonResponse({
      success: false,
      message:
        "新しいパスワードを入力してください。"
    });
  }

  if (!confirmPassword) {
    return createJsonResponse({
      success: false,
      message:
        "確認用パスワードを入力してください。"
    });
  }

  if (newPassword !== confirmPassword) {
    return createJsonResponse({
      success: false,
      message:
        "新しいパスワードと確認用パスワードが一致しません。"
    });
  }

  if (newPassword === currentPassword) {
    return createJsonResponse({
      success: false,
      message:
        "新しいパスワードは現在のパスワードと異なるものを設定してください。"
    });
  }

  const authenticationResult =
    authenticateMember(
      memberId,
      currentPassword
    );

  if (
    !authenticationResult ||
    authenticationResult.success !== true
  ) {
    return createJsonResponse({
      success: false,
      message:
        authenticationResult &&
        authenticationResult.message
          ? authenticationResult.message
          : "本人確認に失敗しました。"
    });
  }

  const members =
    getMemberMaster();

  const targetMember =
    members.find(function(member) {
      return (
        String(
          member.memberId || ""
        ).trim() === memberId
      );
    });

  if (!targetMember) {
    return createJsonResponse({
      success: false,
      message:
        "指定された部員が見つかりません。"
    });
  }

  const passwords =
    getMemberPasswords();

  /*
   * memberIdを正式なキーとして更新する。
   */
  passwords[memberId] =
    newPassword;

  /*
   * 旧形式との互換性維持のため、
   * 正式氏名・表示名のキーも同じ値へ更新する。
   */
  if (targetMember.name) {
    passwords[
      String(targetMember.name)
    ] = newPassword;
  }

  if (targetMember.displayName) {
    passwords[
      String(targetMember.displayName)
    ] = newPassword;
  }

  upsertMetadataValue(
    "memberPasswords",
    passwords
  );

  syncMembersSheet(
    members,
    passwords
  );

  return createJsonResponse({
    success: true,
    message:
      "パスワードを変更しました。"
  });
}

/**
 * 次に使用する部員IDを作成する。
 */
function createNextMemberId_(members) {
  let maxNumber = 0;

  members.forEach(function(member) {
    const memberId =
      String(member.memberId || "");

    const match =
      memberId.match(/^mem_(\d+)$/);

    if (!match) {
      return;
    }

    const number =
      Number(match[1]);

    if (
      Number.isFinite(number) &&
      number > maxNumber
    ) {
      maxNumber = number;
    }
  });

  const nextNumber =
    String(maxNumber + 1).padStart(
      3,
      "0"
    );

  return `mem_${nextNumber}`;
}

/**
 * JSONレスポンスを作成する。
 */
function createJsonResponse(obj) {
  return ContentService
    .createTextOutput(
      JSON.stringify(obj)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/**
 * login APIの動作確認用テスト。
 *
 * シートのデータは変更しない。
 */
function testLoginApi() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: "login",
        memberIdentifier: "部員A",
        password: DEFAULT_DATA.DEFAULT_PASSWORD
      })
    }
  };

  const response = handlePost(mockEvent);

  console.log(
    response.getContent()
  );
}

/**
 * 部員一覧取得APIの動作確認用テスト。
 *
 * シートのデータは変更しない。
 */
function testGetMembersApi() {
  const mockEvent = {
    parameter: {
      action: "getMembers"
    }
  };

  const response =
    handleGet(mockEvent);

  console.log(
    response.getContent()
  );
}

/**
 * 部員詳細取得APIの動作確認用テスト。
 *
 * シートのデータは変更しない。
 */
function testGetMemberDetailsApi() {
  const mockEvent = {
    parameter: {
      action: "getMemberDetails",
      memberId: "mem_003"
    }
  };

  const response =
    handleGet(mockEvent);

  console.log(
    response.getContent()
  );
}