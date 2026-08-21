/**
 * Baika Archery System
 * Project Zero
 * Cloud Data Service
 */

(function () {
    "use strict";

    /**
     * GASから全データを取得する
     *
     * @returns {Promise<object>}
     */
    async function loadAllData() {
        if (
            typeof V4_GAS_API_URL !== "string" ||
            V4_GAS_API_URL.trim() === ""
        ) {
            throw new Error(
                "GAS API URLが設定されていません。"
            );
        }

        const response = await fetch(
            V4_GAS_API_URL,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                "クラウドデータの取得に失敗しました。"
            );
        }

        const result = await response.json();

        if (!result || typeof result !== "object") {
            throw new Error(
                "クラウドから不正なデータが返されました。"
            );
        }

        return result;
    }

    /**
     * GASから練習記録一覧を取得する
     *
     * @returns {Promise<Array>}
     */
    async function loadPracticeRecords() {
        const result = await loadAllData();

        if (!Array.isArray(result.practice)) {
            return [];
        }

        return result.practice;
    }

    /**
     * GASからグルーピング記録一覧を取得する
     *
     * @returns {Promise<Array>}
     */
    async function loadGroupingRecords() {
        const result = await loadAllData();

        if (!Array.isArray(result.grouping)) {
            return [];
        }

        return result.grouping.map(
            function (record) {
                if (
                    !record ||
                    typeof record !== "object"
                ) {
                    return record;
                }

                let arrows = record.arrows;

                if (typeof arrows === "string") {
                    try {
                        arrows =
                            JSON.parse(arrows);
                    } catch (error) {
                        console.warn(
                            "[グルーピング記録] arrowsを解析できませんでした。",
                            error
                        );

                        arrows = [];
                    }
                }

                return {
                    ...record,
                    arrows:
                        Array.isArray(arrows)
                            ? arrows
                            : []
                };
            }
        );
    }

    /**
     * GASから大会記録一覧だけを取得する
     *
     * practice・metadataは取得しない。
     *
     * @returns {Promise<Array>}
     */
    async function loadMatchRecords() {
        if (
            typeof V4_GAS_API_URL !==
            "string" ||
            V4_GAS_API_URL.trim() === ""
        ) {
            throw new Error(
                "GAS API URLが設定されていません。"
            );
        }

        const separator =
            V4_GAS_API_URL.includes("?")
                ? "&"
                : "?";

        const requestUrl =
            `${V4_GAS_API_URL}` +
            `${separator}` +
            "action=getMatchRecords";

        const response =
            await fetch(
                requestUrl,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                "大会記録の取得に失敗しました。"
            );
        }

        const result =
            await response.json();

        if (
            !result ||
            typeof result !== "object"
        ) {
            throw new Error(
                "大会記録APIから不正なデータが返されました。"
            );
        }

        if (result.success === false) {
            throw new Error(
                result.message ||
                "大会記録を取得できませんでした。"
            );
        }

        if (!Array.isArray(result.match)) {
            return [];
        }

        return result.match;
    }

    /**
 * 練習記録をクラウドへ全件保存する
 *
 * 管理画面だけで使う一時的な項目
 * __sourceIndex は送信しない。
 *
 * @param {Array} records
 * @returns {Promise<Object>}
 */
    async function overwritePracticeRecords(records) {
        if (!Array.isArray(records)) {
            throw new TypeError(
                "保存する練習記録が配列ではありません。"
            );
        }

        const cleanRecords =
            records.map(function (record) {
                if (
                    !record ||
                    typeof record !== "object"
                ) {
                    return record;
                }

                const {
                    __sourceIndex,
                    ...cleanRecord
                } = record;

                return cleanRecord;
            });

        const payload = {
            mode: "practice",
            data: cleanRecords
        };

        const response =
            await fetch(
                V4_GAS_API_URL,
                {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            );

        if (!response.ok) {
            throw new Error(
                "練習記録をクラウドへ保存できませんでした。"
            );
        }

        const responseText =
            await response.text();

        if (!responseText) {
            return {
                success: true
            };
        }

        try {
            const result =
                JSON.parse(responseText);

            if (result.success === false) {
                throw new Error(
                    result.message ||
                    "練習記録の保存に失敗しました。"
                );
            }

            return result;
        } catch (error) {
            if (
                error instanceof SyntaxError
            ) {
                return {
                    success: true,
                    responseText
                };
            }

            throw error;
        }
    }

    async function deletePracticeRecord(
        recordId,
        requesterMemberId,
        password
    ) {
        const normalizedRecordId =
            String(recordId || "").trim();

        const normalizedRequesterMemberId =
            String(
                requesterMemberId || ""
            ).trim();

        if (!normalizedRecordId) {
            throw new Error(
                "削除する練習記録IDが指定されていません。"
            );
        }

        if (!normalizedRequesterMemberId) {
            throw new Error(
                "削除する部員を確認できません。"
            );
        }

        if (!password) {
            throw new Error(
                "本人確認のためパスワードを入力してください。"
            );
        }

        const response =
            await fetch(
                V4_GAS_API_URL,
                {
                    method: "POST",

                    body: JSON.stringify({
                        action:
                            "deletePracticeRecord",

                        recordId:
                            normalizedRecordId,

                        requesterMemberId:
                            normalizedRequesterMemberId,

                        password:
                            password
                    })
                }
            );

        if (!response.ok) {
            throw new Error(
                "練習記録を削除できませんでした。"
            );
        }

        const result =
            await response.json();

        if (
            !result ||
            result.success !== true
        ) {
            throw new Error(
                result &&
                    result.message
                    ? result.message
                    : "練習記録を削除できませんでした。"
            );
        }

        return result;
    }

    /**
     * 大会記録をクラウドへ全件保存する
     *
     * @param {Array} records
     * @returns {Promise<Object>}
     */
    async function overwriteMatchRecords(records) {
        if (!Array.isArray(records)) {
            throw new TypeError(
                "保存する大会記録が配列ではありません。"
            );
        }

        if (!V4_GAS_API_URL) {
            throw new Error(
                "GAS API URLが設定されていません。"
            );
        }

        const cleanRecords =
            records.map(function (record) {
                if (
                    !record ||
                    typeof record !== "object"
                ) {
                    return {};
                }

                return {
                    ...record
                };
            });

        const payload = {
            mode: "match",
            data: cleanRecords
        };

        const response =
            await fetch(
                V4_GAS_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify(payload)
                }
            );

        if (!response.ok) {
            throw new Error(
                "大会記録をクラウドへ保存できませんでした。"
            );
        }

        const responseText =
            await response.text();

        if (!responseText) {
            return {
                success: true
            };
        }

        let result;

        try {
            result =
                JSON.parse(responseText);
        } catch (error) {
            throw new Error(
                "大会記録保存APIの応答を解析できませんでした。"
            );
        }

        if (
            result &&
            result.success === false
        ) {
            throw new Error(
                result.message ||
                "大会記録を保存できませんでした。"
            );
        }

        return result;
    }

    /**
     * 大会記録1件をクラウドへ追加または更新する。
     *
     * @param {Object} record
     * @returns {Promise<Object>}
     */
    async function saveMatchRecord(record) {
        if (
            !record ||
            typeof record !== "object"
        ) {
            throw new TypeError(
                "保存する大会記録が指定されていません。"
            );
        }

        if (
            typeof V4_GAS_API_URL !==
            "string" ||
            V4_GAS_API_URL.trim() === ""
        ) {
            throw new Error(
                "GAS API URLが設定されていません。"
            );
        }

        const response =
            await fetch(
                V4_GAS_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({
                            action:
                                "saveMatchRecord",

                            record:
                                record
                        })
                }
            );

        if (!response.ok) {
            throw new Error(
                "大会記録の保存通信に失敗しました。"
            );
        }

        const result =
            await response.json();

        if (
            !result ||
            typeof result !== "object"
        ) {
            throw new Error(
                "大会記録保存APIから不正な応答が返されました。"
            );
        }

        if (result.success === false) {
            throw new Error(
                result.message ||
                "大会記録を保存できませんでした。"
            );
        }

        return result;
    }

    window.BAS_CLOUD = {
        loadAllData:
            loadAllData,

        loadPracticeRecords:
            loadPracticeRecords,

        loadGroupingRecords:
            loadGroupingRecords,

        loadMatchRecords:
            loadMatchRecords,

        overwritePracticeRecords:
            overwritePracticeRecords,

        deletePracticeRecord:
            deletePracticeRecord,

        overwriteMatchRecords:
            overwriteMatchRecords,

        saveMatchRecord:
            saveMatchRecord
    };
})();