"use strict";

/**
 * Baika Archery System
 * Project Zero v2
 * 認証API通信
 */

(function () {
    /**
     * GAS_API_URLが利用可能か確認する。
     */
    function getApiUrl() {
        if (
            typeof GAS_API_URL === "undefined" ||
            !GAS_API_URL ||
            GAS_API_URL.includes("ここに新しい")
        ) {
            throw new Error("GAS_API_URLが設定されていません。");
        }

        return GAS_API_URL;
    }


    /**
     * GASへJSON形式でPOST送信する。
     */
    async function postJson(payload) {
        const apiUrl = getApiUrl();

        const response = await fetch(apiUrl, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(
                `認証APIとの通信に失敗しました。HTTP ${response.status}`
            );
        }

        const responseText = await response.text();

        if (!responseText) {
            throw new Error("認証APIから応答がありません。");
        }

        try {
            return JSON.parse(responseText);
        } catch (error) {
            console.error(
                "認証APIの応答をJSONへ変換できませんでした:",
                responseText
            );

            throw new Error("認証APIの応答形式が正しくありません。");
        }
    }


    /**
     * ログイン認証を行う。
     *
     * memberIdentifierには、現段階では部員名を渡す。
     * 将来はmemberIdでもログイン可能。
     */
    async function login(memberIdentifier, password) {
        const memberValue = String(
            memberIdentifier || ""
        ).trim();

        const passwordValue = String(
            password || ""
        );

        if (!memberValue) {
            return {
                success: false,
                message: "部員を選択してください。"
            };
        }

        if (!passwordValue) {
            return {
                success: false,
                message: "パスワードを入力してください。"
            };
        }

        return postJson({
            action: "login",
            memberIdentifier: memberValue,
            password: passwordValue
        });
    }


    /**
     * 外部公開
     */
    window.V4AuthApi = {
        login
    };
})();