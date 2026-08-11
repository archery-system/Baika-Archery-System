/**
 * Baika Archery System
 * Project Zero
 * Record Center Page
 */

(function () {
    "use strict";

    const PRACTICE_RECORDS_CACHE_PREFIX =
        "baika-practice-records-cache-";

    const MATCH_RECORDS_CACHE_KEY =
        "baika-match-records-cache";

    /**
     * 記録トップを初期化する
     */
    function initialize() {
        if (
            window.V4Session &&
            typeof window.V4Session.requireLogin ===
            "function"
        ) {
            if (!window.V4Session.requireLogin()) {
                return;
            }
        }

        console.log(
            "[Baika Record Center] 初期化しました。"
        );

        /*
         * 画面表示は待たず、
         * 記録データを裏で先読みする。
         */
        preloadRecords();
    }


    /**
     * 練習記録・大会記録を先読みする
     */
    function preloadRecords() {
        if (!window.BAS_CLOUD) {
            console.warn(
                "[記録先読み] BAS_CLOUDを利用できません。"
            );

            return;
        }

        const memberId =
            getLoggedInMemberId();

        const tasks = [];

        if (
            memberId &&
            typeof window.BAS_CLOUD
                .loadPracticeRecords ===
            "function"
        ) {
            tasks.push(
                preloadPracticeRecords(
                    memberId
                )
            );
        }

        if (
            typeof window.BAS_CLOUD
                .loadMatchRecords ===
            "function"
        ) {
            tasks.push(
                preloadMatchRecords()
            );
        }

        /*
         * 先読み完了を画面側では待たない。
         */
        Promise.allSettled(tasks)
            .then(function (results) {
                console.log(
                    "[記録先読み] 完了",
                    results
                );
            });
    }


    /**
     * ログイン中の部員IDを取得する
     */
    function getLoggedInMemberId() {
        if (
            !window.V4Session ||
            typeof window.V4Session
                .getLoggedInMemberId !==
            "function"
        ) {
            return "";
        }

        return String(
            window.V4Session
                .getLoggedInMemberId() ||
            ""
        ).trim();
    }


    /**
     * 練習記録を先読みして
     * sessionStorageへ保存する
     */
    async function preloadPracticeRecords(
        memberId
    ) {
        try {
            const records =
                await window.BAS_CLOUD
                    .loadPracticeRecords();

            if (!Array.isArray(records)) {
                return;
            }

            const cacheData = {
                savedAt: Date.now(),
                records: records
            };

            window.sessionStorage.setItem(
                PRACTICE_RECORDS_CACHE_PREFIX +
                memberId,
                JSON.stringify(cacheData)
            );

            console.log(
                "[記録先読み] 練習記録を保存しました。",
                records.length
            );
        } catch (error) {
            console.warn(
                "[記録先読み] 練習記録の先読みに失敗しました。",
                error
            );
        }
    }


    /**
     * 大会記録を先読みして
     * sessionStorageへ保存する
     */
    async function preloadMatchRecords() {
        try {
            const records =
                await window.BAS_CLOUD
                    .loadMatchRecords();

            if (!Array.isArray(records)) {
                return;
            }

            const cacheData = {
                savedAt: Date.now(),
                records: records
            };

            window.sessionStorage.setItem(
                MATCH_RECORDS_CACHE_KEY,
                JSON.stringify(cacheData)
            );

            console.log(
                "[記録先読み] 大会記録を保存しました。",
                records.length
            );
        } catch (error) {
            console.warn(
                "[記録先読み] 大会記録の先読みに失敗しました。",
                error
            );
        }
    }


    window.BAS_RECORD_CENTER = {
        initialize: initialize
    };
})();