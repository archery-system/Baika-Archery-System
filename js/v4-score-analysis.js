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
    }
})();