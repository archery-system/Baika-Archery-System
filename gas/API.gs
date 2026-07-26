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
     * 将来のAPI拡張用。
     */
    return createJsonResponse({
      success: false,
      message: "指定された取得処理は存在しません。",
      action: action
    });

  } catch (error) {
    console.error("GET APIエラー:", error);

    return createJsonResponse({
      success: false,
      message: "データの取得中にエラーが発生しました。"
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
    console.error("POST APIエラー:", error);

    return createJsonResponse({
      success: false,
      message: "送信データの処理中にエラーが発生しました。"
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