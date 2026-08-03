"use strict";

/**
 * Baika Archery System
 * Project Zero v2
 * 各画面共通のログインセッション管理
 */

(function () {
    const STORAGE_KEY = "baikaArcheryVer4Login";


    /**
     * 保存されたログイン情報を読み込む
     */
    function readLoginData() {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return null;
        }

        try {
            const loginData = JSON.parse(savedData);

            if (!loginData || typeof loginData !== "object") {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }

            const member =
                String(
                    loginData.member ||
                    loginData.displayName ||
                    loginData.memberName ||
                    ""
                ).trim();

            if (!member) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }

            return {
                member,
                memberId: String(loginData.memberId || "").trim(),
                memberName: String(
                    loginData.memberName ||
                    loginData.displayName ||
                    member
                ).trim(),
                displayName: String(
                    loginData.displayName ||
                    loginData.memberName ||
                    member
                ).trim(),
                role: String(loginData.role || "member").trim(),
                savedAt: String(loginData.savedAt || "").trim()
            };
        } catch (error) {
            console.warn(
                "ログイン情報を読み込めませんでした:",
                error
            );

            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    }


    /**
     * ログイン中の部員名を取得
     *
     * 既存画面との互換性のため、
     * 従来どおり文字列を返す
     */
    function getLoggedInMember() {
        const loginData = readLoginData();

        return loginData
            ? loginData.displayName || loginData.member
            : "";
    }


    /**
     * ログイン中の部員IDを取得
     */
    function getLoggedInMemberId() {
        const loginData = readLoginData();

        return loginData
            ? loginData.memberId
            : "";
    }


    /**
     * ログイン中の部員情報を取得
     */
    function getLoggedInMemberData() {
        return readLoginData();
    }


    /**
     * ログイン中の権限を取得
     */
    function getLoggedInRole() {
        const loginData = readLoginData();

        return loginData
            ? loginData.role || "member"
            : "";
    }


    /**
     * 管理者か確認
     */
    function isAdmin() {
        return getLoggedInRole() === "admin";
    }


    /**
     * ログイン状態か確認
     */
    function isLoggedIn() {
        return Boolean(readLoginData());
    }


    /**
     * ログイン情報を削除
     */
    function clearSession() {
        localStorage.removeItem(STORAGE_KEY);
    }


    /**
     * 未ログインならオープニング画面へ戻す
     */
    function requireLogin() {
        if (isLoggedIn()) {
            return true;
        }

        window.location.replace("index.html");
        return false;
    }


    /**
     * 外部公開
     */
    window.V4Session = {
        readLoginData,
        getLoggedInMember,
        getLoggedInMemberId,
        getLoggedInMemberData,
        getLoggedInRole,
        isAdmin,
        isLoggedIn,
        clearSession,
        requireLogin
    };


    /*
     * Project Zero統合中は自動転送を停止。
     *
     * 各ページ側で必要な時点に
     * V4Session.requireLogin()
     * を呼び出す。
     */
})();