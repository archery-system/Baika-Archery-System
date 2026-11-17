/**
 * Baika Archery System
 * Project Zero
 *
 * 認証セッション管理
 *
 * ログイン後の本人確認に使用する。
 * 既存の部員認証処理とは分離して管理する。
 */

const BAS_SESSION_CONFIG = {
  SHEET_NAME: "authSessions",
  EXPIRATION_DAYS: 7,

  HEADERS: [
    "sessionId",
    "memberId",
    "tokenHash",
    "createdAt",
    "expiresAt",
    "revokedAt"
  ]
};

/**
 * 推測困難な認証トークンを生成する。
 *
 * トークンは複数のUUIDを組み合わせて生成する。
 * GAS側にはトークンそのものではなく、
 * SHA-256のハッシュ値を保存する。
 *
 * @returns {string}
 */
function generateAuthSessionToken_() {
  return [
    Utilities.getUuid(),
    Utilities.getUuid(),
    Utilities.getUuid()
  ].join("");
}

/**
 * 認証トークンをSHA-256でハッシュ化する。
 *
 * @param {string} token
 * @returns {string}
 */
function hashAuthSessionToken_(token) {
  const bytes =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      String(token),
      Utilities.Charset.UTF_8
    );

  return bytes
    .map(function(byte) {
      return (
        ("0" + (byte & 0xff).toString(16))
          .slice(-2)
      );
    })
    .join("");
}

/**
 * 認証セッションを新規発行して保存する。
 *
 * @param {string} memberId
 * @returns {Object}
 */
function createAuthSession_(memberId) {
  const authenticatedMemberId =
    String(memberId || "").trim();

  if (!authenticatedMemberId) {
    throw new Error(
      "認証セッションを発行する部員IDがありません。"
    );
  }

  const token =
    generateAuthSessionToken_();

  const now = new Date();

  const expiresAt = new Date(
    now.getTime() +
    BAS_SESSION_CONFIG.EXPIRATION_DAYS *
      24 * 60 * 60 * 1000
  );

  const sessionId =
    Utilities.getUuid();

  const tokenHash =
    hashAuthSessionToken_(token);

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const sheet =
      getOrCreateSheet(
        BAS_SESSION_CONFIG.SHEET_NAME
      );

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(
        BAS_SESSION_CONFIG.HEADERS
      );
    }

    sheet.appendRow([
      sessionId,
      authenticatedMemberId,
      tokenHash,
      now.toISOString(),
      expiresAt.toISOString(),
      ""
    ]);

    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return {
    token: token,
    expiresAt: expiresAt.toISOString()
  };
}

/**
 * 認証トークンを検証する。
 *
 * 有効な場合は認証済みの部員IDを返す。
 * 無効・期限切れ・失効済みの場合はエラーにする。
 *
 * @param {string} token
 * @returns {string}
 */
function verifyAuthSession_(token) {
  const sessionToken =
    String(token || "").trim();

  if (!sessionToken) {
    throw new Error(
      "認証セッションがありません。再ログインしてください。"
    );
  }

  const tokenHash =
    hashAuthSessionToken_(sessionToken);

  const sheet =
    getOrCreateSheet(
      BAS_SESSION_CONFIG.SHEET_NAME
    );

  const values =
    sheet.getDataRange().getValues();

  if (values.length <= 1) {
    throw new Error(
      "認証セッションが見つかりません。再ログインしてください。"
    );
  }

  const headers =
    values[0].map(function(value) {
      return String(value).trim();
    });

  const hashIndex =
    headers.indexOf("tokenHash");

  const memberIndex =
    headers.indexOf("memberId");

  const expiresIndex =
    headers.indexOf("expiresAt");

  const revokedIndex =
    headers.indexOf("revokedAt");

  if (
    hashIndex < 0 ||
    memberIndex < 0 ||
    expiresIndex < 0 ||
    revokedIndex < 0
  ) {
    throw new Error(
      "認証セッションの管理情報が正しくありません。"
    );
  }

  const now = Date.now();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    if (
      String(row[hashIndex] || "") !==
      tokenHash
    ) {
      continue;
    }

    if (String(row[revokedIndex] || "").trim()) {
      throw new Error(
        "認証セッションは無効です。再ログインしてください。"
      );
    }

    const expiresAt =
      new Date(row[expiresIndex]).getTime();

    if (
      !Number.isFinite(expiresAt) ||
      expiresAt <= now
    ) {
      throw new Error(
        "認証セッションの有効期限が切れました。再ログインしてください。"
      );
    }

    const memberId =
      String(row[memberIndex] || "").trim();

    if (!memberId) {
      throw new Error(
        "認証セッションの部員情報がありません。"
      );
    }

    const member = findMember(memberId);

    if (
      !member ||
      String(member.memberId || "").trim() !== memberId ||
      member.active === false
    ) {
      throw new Error(
        "このアカウントは現在利用できません。再ログインしてください。"
      );
    }

    return memberId;
  }

  throw new Error(
    "認証セッションが見つかりません。再ログインしてください。"
  );
}

/**
 * 認証セッションを無効化する。
 *
 * ログアウト時に使用する。
 *
 * @param {string} token
 * @returns {boolean}
 */
function revokeAuthSession_(token) {
  const sessionToken =
    String(token || "").trim();

  if (!sessionToken) {
    return false;
  }

  const tokenHash =
    hashAuthSessionToken_(sessionToken);

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const sheet =
      getOrCreateSheet(
        BAS_SESSION_CONFIG.SHEET_NAME
      );

    const values =
      sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return false;
    }

    const headers =
      values[0].map(function(value) {
        return String(value).trim();
      });

    const hashIndex =
      headers.indexOf("tokenHash");

    const revokedIndex =
      headers.indexOf("revokedAt");

    if (
      hashIndex < 0 ||
      revokedIndex < 0
    ) {
      throw new Error(
        "認証セッションの管理情報が正しくありません。"
      );
    }

    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      if (
        String(row[hashIndex] || "") !==
        tokenHash
      ) {
        continue;
      }

      if (String(row[revokedIndex] || "").trim()) {
        return true;
      }

      sheet.getRange(
        i + 1,
        revokedIndex + 1
      ).setValue(
        new Date().toISOString()
      );

      SpreadsheetApp.flush();

      return true;
    }

    return false;
  } finally {
    lock.releaseLock();
  }
}

/**
 * 指定した部員の認証セッションをすべて無効化する。
 *
 * パスワード変更や部員の無効化時に使用する。
 *
 * @param {string} memberId
 * @returns {number} 無効化したセッション数
 */
function revokeMemberAuthSessions_(memberId) {
  const targetMemberId =
    String(memberId || "").trim();

  if (!targetMemberId) {
    throw new Error(
      "認証セッションを無効化する部員IDがありません。"
    );
  }

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const sheet =
      getOrCreateSheet(
        BAS_SESSION_CONFIG.SHEET_NAME
      );

    const values =
      sheet.getDataRange().getValues();

    if (values.length <= 1) {
      return 0;
    }

    const headers =
      values[0].map(function(value) {
        return String(value).trim();
      });

    const memberIndex =
      headers.indexOf("memberId");

    const revokedIndex =
      headers.indexOf("revokedAt");

    if (
      memberIndex < 0 ||
      revokedIndex < 0
    ) {
      throw new Error(
        "認証セッションの管理情報が正しくありません。"
      );
    }

    const revokedAt =
      new Date().toISOString();

    let revokedCount = 0;

    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      if (
        String(row[memberIndex] || "").trim() !==
        targetMemberId
      ) {
        continue;
      }

      if (
        String(row[revokedIndex] || "").trim()
      ) {
        continue;
      }

      sheet.getRange(
        i + 1,
        revokedIndex + 1
      ).setValue(revokedAt);

      revokedCount++;
    }

    if (revokedCount > 0) {
      SpreadsheetApp.flush();
    }

    return revokedCount;
  } finally {
    lock.releaseLock();
  }
}