/**
 * Baika Archery System
 * Project Zero
 * 得点分析
 */

(function () {
    "use strict";

    document.addEventListener(
        "DOMContentLoaded",
        initializeScoreAnalysis
    );

    function initializeScoreAnalysis() {
        const area =
            document.getElementById(
                "scoreAnalysisArea"
            );

        const status =
            document.getElementById(
                "scoreAnalysisStatus"
            );

        if (!area || !status) {
            console.error(
                "[得点分析] 表示領域が見つかりません。"
            );

            return;
        }

        status.textContent =
            "得点分析の画面を読み込みました。";

        console.log(
            "[得点分析] 初期化完了"
        );

        loadScoreAnalysisRecords();
    }

    async function loadScoreAnalysisRecords() {
        const status =
            document.getElementById(
                "scoreAnalysisStatus"
            );

        if (
            !window.V4Session ||
            !window.V4Session.requireLogin()
        ) {
            return;
        }

        const memberData =
            window.V4Session.getLoggedInMemberData();

        const memberId =
            String(
                memberData?.memberId || ""
            ).trim();

        if (!memberId) {
            status.textContent =
                "ログイン中の部員IDを確認できませんでした。";
            return;
        }

        if (
            !window.BAS_CLOUD ||
            typeof window.BAS_CLOUD.loadPracticeRecords !==
                "function"
        ) {
            status.textContent =
                "練習記録の読込機能が見つかりません。";
            return;
        }

        status.textContent =
            "練習記録を読み込んでいます…";

        try {
            const records =
                await window.BAS_CLOUD
                    .loadPracticeRecords();

            const memberRecords =
                records.filter(function (record) {
                    return (
                        String(
                            record.memberId || ""
                        ).trim() === memberId
                    );
                });

            status.textContent =
                `練習記録を${memberRecords.length}件読み込みました。`;

            console.log(
                "[得点分析] 練習記録取得完了",
                memberRecords.length
            );
        } catch (error) {
            console.error(
                "[得点分析] 練習記録の取得に失敗しました。",
                error
            );

            status.textContent =
                "練習記録を読み込めませんでした。";
        }
    }
})();