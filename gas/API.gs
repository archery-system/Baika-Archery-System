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
 * 大会記録1件を追加または更新する。
 */
if (action === "saveMatchRecord") {
  return handleSaveMatchRecordAction_(
    payload
  );
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

  const password = String(
    payload.password || ""
  );

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
    active: true
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