/**
 * Baika Archery System
 * Project Zero
 * Core State Management
 */

const BAS_STATE = {
    currentUser: {
        id: "test-user",
        name: "テスト部員",
        role: "member"
    },

    currentPage: "home",

    practice: {
        date: null,
        distance: null,

        goalScore: 660,

        missions: [
            "リリースを丁寧にする",
            "クリッカー後も伸び続ける",
            "平均9.2点以上を目指す"
        ],

        arrows: [],
        photoMode: false
    },

    currentPracticeSession: {
        active: false,
        startedAt: null,
        endedAt: null,

        distance: "",
        weather: "",
        windDirection: "",
        windSpeed: "",
        condition: "",

        reflectionMemo: ""
    },

    photoSessions: [],

    lastPractice: null,

    practiceHistory: [],

    analysis: {
        isRunning: false,
        result: null
    },

    camera: {
        isActive: false,
        selectedDistance: null
    }
};

/**
 * 状態を取得する
 *
 * @param {string} key
 * @returns {*}
 */
function getState(key) {
    return BAS_STATE[key];
}

/**
 * 状態を更新する
 *
 * @param {string} key
 * @param {*} value
 */
function setState(key, value) {
    if (!(key in BAS_STATE)) {
        console.warn(`[Baika State] 未登録の状態です: ${key}`);
        return;
    }

    BAS_STATE[key] = value;

    saveStateToStorage();

    if (typeof BAS_CONFIG !== "undefined" && BAS_CONFIG.debug) {
        console.log(`[Baika State] ${key} を更新しました`, value);
    }
}

/**
 * Ver4のログイン情報をProject Zeroへ取り込む
 *
 * ログイン情報の管理元は
 * localStorageのbaikaArcheryVer4Loginとする。
 *
 * @returns {boolean}
 */
function restoreCurrentUserFromVer4Login() {
    try {
        const savedLoginData =
            localStorage.getItem(
                "baikaArcheryVer4Login"
            );

        if (!savedLoginData) {
            BAS_STATE.currentUser = null;
            saveStateToStorage();

            console.warn(
                "[Baika State] ログイン情報がありません。"
            );

            return false;
        }

        const loginData =
            JSON.parse(savedLoginData);

        if (
            !loginData ||
            typeof loginData.member !== "string" ||
            loginData.member.trim() === ""
        ) {
            BAS_STATE.currentUser = null;

            localStorage.removeItem(
                "baikaArcheryVer4Login"
            );

            saveStateToStorage();

            console.warn(
                "[Baika State] ログイン情報が不正です。"
            );

            return false;
        }

        BAS_STATE.currentUser = {
            id:
                typeof loginData.id === "string" &&
                    loginData.id.trim()
                    ? loginData.id.trim()
                    : loginData.member.trim(),

            name: loginData.member.trim(),

            role:
                typeof loginData.role === "string" &&
                    loginData.role.trim()
                    ? loginData.role.trim()
                    : "member"
        };

        saveStateToStorage();

        if (
            typeof BAS_CONFIG !== "undefined" &&
            BAS_CONFIG.debug
        ) {
            console.log(
                "[Baika State] ログイン部員を復元しました。",
                BAS_STATE.currentUser
            );
        }

        return true;
    } catch (error) {
        BAS_STATE.currentUser = null;

        localStorage.removeItem(
            "baikaArcheryVer4Login"
        );

        saveStateToStorage();

        console.error(
            "[Baika State] ログイン情報を復元できませんでした。",
            error
        );

        return false;
    }
}

/**
 * 練習状態を初期化する
 */
function resetPracticeState() {
    BAS_STATE.practice = {
        date: null,
        distance: null,

        goalScore: 660,

        missions: [
            "リリースを丁寧にする",
            "クリッカー後も伸び続ける",
            "平均9.2点以上を目指す"
        ],

        arrows: [],
        photoMode: false
    };

    saveStateToStorage();

    if (typeof BAS_CONFIG !== "undefined" && BAS_CONFIG.debug) {
        console.log("[Baika State] 練習状態を初期化しました");
    }
}

/**
 * 練習セッション用の一意なIDを作成する
 *
 * @returns {string}
 */
function createPracticeSessionId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return `practice-${crypto.randomUUID()}`;
    }

    return [
        "practice",
        Date.now(),
        Math.random()
            .toString(36)
            .slice(2, 10)
    ].join("-");
}

/**
 * 練習セッションを開始する
 *
 * @param {Object} settings
 */
function startPracticeSession(settings = {}) {
    const now = new Date().toISOString();

    BAS_STATE.currentPracticeSession = {
        id: createPracticeSessionId(),
        active: true,
        startedAt: now,
        endedAt: null,

        distance: String(settings.distance || "").trim(),
        weather: String(settings.weather || "").trim(),
        windDirection: String(
            settings.windDirection || ""
        ).trim(),
        windSpeed: String(settings.windSpeed || "").trim(),
        condition: String(settings.condition || "").trim(),

        reflectionMemo: ""
    };

    saveStateToStorage();

    return BAS_STATE.currentPracticeSession;
}

/**
 * 現在の練習条件を更新する
 *
 * @param {Object} updates
 */
function updatePracticeSession(updates = {}) {
    const session = BAS_STATE.currentPracticeSession;

    if (!session || !session.active) {
        console.warn(
            "[Baika State] 開始中の練習セッションがありません"
        );

        return null;
    }

    const allowedKeys = [
        "distance",
        "weather",
        "windDirection",
        "windSpeed",
        "condition"
    ];

    allowedKeys.forEach((key) => {
        if (key in updates) {
            session[key] =
                String(updates[key] ?? "").trim();
        }
    });

    saveStateToStorage();

    return session;
}

/**
 * 練習セッションを終了する
 *
 * @param {string} reflectionMemo
 */
function finishPracticeSession(reflectionMemo = "") {
    const session = BAS_STATE.currentPracticeSession;

    if (!session || !session.active) {
        console.warn(
            "[Baika State] 開始中の練習セッションがありません"
        );

        return null;
    }

    session.active = false;
    session.endedAt = new Date().toISOString();
    session.reflectionMemo =
        String(reflectionMemo || "").trim();

    saveStateToStorage();

    return session;
}

/**
 * 撮影記録を追加する
 *
 * @param {Object} photoData
 * @returns {Object|null}
 */
function addPhotoSession(photoData = {}) {
    const session =
        BAS_STATE.currentPracticeSession;

    if (!session || !session.active) {
        console.warn(
            "[Baika State] 練習中ではないため撮影記録を追加できません"
        );

        return null;
    }

    if (!Array.isArray(BAS_STATE.photoSessions)) {
        BAS_STATE.photoSessions = [];
    }

    const now =
        new Date().toISOString();

    const photoSession = {
        id:
            createPhotoSessionId(),

        capturedAt:
            now,

        practiceSessionId:
            session.id || null,

        localPhotoId:
            photoData.localPhotoId ?? null,

        practiceStartedAt:
            session.startedAt || null,

        distance:
            String(
                photoData.distance ??
                session.distance ??
                ""
            ).trim(),

        weather:
            String(
                photoData.weather ??
                session.weather ??
                ""
            ).trim(),

        windDirection:
            String(
                photoData.windDirection ??
                session.windDirection ??
                ""
            ).trim(),

        windSpeed:
            String(
                photoData.windSpeed ??
                session.windSpeed ??
                ""
            ).trim(),

        condition:
            String(
                photoData.condition ??
                session.condition ??
                ""
            ).trim(),

        status:
            "unprocessed"
    };

    BAS_STATE.photoSessions.push(
        photoSession
    );

    saveStateToStorage();

    return photoSession;
}

/**
 * 撮影記録用の一意なIDを作成する
 *
 * @returns {string}
 */
function createPhotoSessionId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return [
        "photo",
        Date.now(),
        Math.random()
            .toString(36)
            .slice(2, 10)
    ].join("-");
}

/**
 * Project Zeroの状態をブラウザへ保存する
 */
function saveStateToStorage() {
    try {
        localStorage.setItem(
            "baikaProjectZeroState",
            JSON.stringify(BAS_STATE)
        );
    } catch (error) {
        console.error(
            "[Baika State] 状態を保存できませんでした。",
            error
        );
    }
}

/**
 * ブラウザに保存された状態を復元する
 */
function loadStateFromStorage() {
    try {
        const savedState =
            localStorage.getItem(
                "baikaProjectZeroState"
            );

        if (!savedState) {
            return;
        }

        const parsedState =
            JSON.parse(savedState);

        if (
            parsedState &&
            typeof parsedState === "object"
        ) {
            Object.assign(
                BAS_STATE,
                parsedState
            );

            BAS_STATE.currentPracticeSession = {
                id: null,
                active: false,
                startedAt: null,
                endedAt: null,

                distance: "",
                weather: "",
                windDirection: "",
                windSpeed: "",
                condition: "",

                reflectionMemo: "",

                ...(
                    parsedState.currentPracticeSession &&
                        typeof parsedState.currentPracticeSession === "object"
                        ? parsedState.currentPracticeSession
                        : {}
                )
            };

            BAS_STATE.photoSessions =
                Array.isArray(parsedState.photoSessions)
                    ? parsedState.photoSessions
                    : [];

        }
    } catch (error) {
        console.error(
            "[Baika State] 状態を復元できませんでした。",
            error
        );
    }
}

loadStateFromStorage();
restoreCurrentUserFromVer4Login();