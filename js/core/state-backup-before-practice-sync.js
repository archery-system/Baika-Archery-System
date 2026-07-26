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
        arrows: [],
        photoMode: false
    },

    lastPractice: {
    date: "2026-07-20",
    distance: "70m",
    totalScore: 652,
    averageScore: 9.06,
    arrowCount: 72,
    memo:
        "今日はリリースで右肩が痛かった。押し手を意識する。"
},

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

    if (typeof BAS_CONFIG !== "undefined" && BAS_CONFIG.debug) {
        console.log(`[Baika State] ${key} を更新しました`, value);
    }
}

/**
 * 練習状態を初期化する
 */
function resetPracticeState() {
    BAS_STATE.practice = {
        date: null,
        distance: null,
        arrows: [],
        photoMode: false
    };

    if (typeof BAS_CONFIG !== "undefined" && BAS_CONFIG.debug) {
        console.log("[Baika State] 練習状態を初期化しました");
    }
}