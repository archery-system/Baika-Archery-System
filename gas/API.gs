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

if (action === "addMember") {
  return handleAddMemberAction_(payload);
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

  const role =
    payload.role === ROLE_NAMES.ADMIN
      ? ROLE_NAMES.ADMIN
      : ROLE_NAMES.MEMBER;

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