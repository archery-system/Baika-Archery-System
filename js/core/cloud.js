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

    window.BAS_CLOUD = {
        loadAllData: loadAllData,
        loadPracticeRecords: loadPracticeRecords
    };
})();