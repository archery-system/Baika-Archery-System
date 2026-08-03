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

    window.BAS_CLOUD = {
    loadAllData: loadAllData,
    loadPracticeRecords: loadPracticeRecords,
    overwritePracticeRecords:
        overwritePracticeRecords
};
})();