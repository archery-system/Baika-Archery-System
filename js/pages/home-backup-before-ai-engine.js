/**
 * Baika Archery System
 * Project Zero
 * Home Page
 */

(function () {
    "use strict";

    function createAiCoachAdvice(lastPractice) {
        if (!lastPractice) {
            return {
                heading:
                    "前回の練習記録がありません",
                message:
                    "練習記録を保存すると、次回の練習に向けたアドバイスを表示します。",
                sources: [],
                confidence: 0
            };
        }

        const totalScore =
            Number(lastPractice.totalScore);

        const averageScore =
            Number(lastPractice.averageScore);

        const arrowCount =
            Number(lastPractice.arrowCount);

        const memo =
            typeof lastPractice.memo === "string"
                ? lastPractice.memo.trim()
                : "";

        let heading =
            "前回の練習を振り返りましょう";

        let message =
            "前回の記録を確認し、同じ動作を安定して繰り返すことを意識しましょう。";

        let confidence = 55;

        if (
            Number.isFinite(averageScore) &&
            averageScore >= 9
        ) {
            heading =
                "高い得点水準を維持できています";

            message =
                "前回は平均9点以上を記録しています。大きくフォームを変えず、同じセットアップとリリースを再現することを意識しましょう。";

            confidence = 85;
        } else if (
            Number.isFinite(averageScore) &&
            averageScore >= 8
        ) {
            heading =
                "安定した射を増やしましょう";

            message =
                "前回は良い射が積み重なっています。得点を追い過ぎず、肩の位置とリリースまでの流れを一定にすることが次の安定につながります。";

            confidence = 75;
        } else if (
            Number.isFinite(averageScore) &&
            averageScore > 0
        ) {
            heading =
                "フォームの再現性を優先しましょう";

            message =
                "前回は得点のばらつきがあった可能性があります。まずは狙い続けることより、セットアップからリリースまでを同じリズムで行うことを優先しましょう。";

            confidence = 65;
        }

        if (memo.includes("クリッカー")) {
            message +=
                " メモにクリッカーへの意識が記録されています。音に反応して離すのではなく、伸び合いの結果としてクリッカーが落ちる流れを確認しましょう。";

            confidence =
                Math.min(95, confidence + 5);
        }

        if (
            memo.includes("肩") ||
            memo.includes("グルーピング")
        ) {
            message +=
                " 肩の位置を意識したことでグルーピングが改善しているため、今日も同じ感覚を再現することが重点課題です。";

            confidence =
                Math.min(95, confidence + 5);
        }

        const sources = [];

        if (
            Number.isFinite(totalScore) &&
            totalScore > 0
        ) {
            sources.push(
                `前回の総得点：${totalScore}点`
            );
        }

        if (
            Number.isFinite(averageScore) &&
            averageScore > 0
        ) {
            sources.push(
                `前回の平均：${averageScore.toFixed(2)}点`
            );
        }

        if (
            Number.isFinite(arrowCount) &&
            arrowCount > 0
        ) {
            sources.push(
                `前回の射数：${arrowCount}射`
            );
        }

        if (memo !== "") {
            sources.push(
                "前回の練習メモ"
            );
        }

        return {
            heading: heading,
            message: message,
            sources: sources,
            confidence: confidence
        };
    }

    function renderAiCoach() {
        if (
            !window.BAS_AI_COACH ||
            typeof window.BAS_AI_COACH.render !==
                "function"
        ) {
            console.error(
                "[Baika Home] AIコーチコンポーネントを読み込めません。"
            );

            return;
        }

        const lastPractice =
            typeof BAS_STATE !== "undefined"
                ? BAS_STATE.lastPractice
                : null;

        const advice =
            createAiCoachAdvice(lastPractice);

        window.BAS_AI_COACH.render({
            targetId: "home-ai-coach",
            title: "AIコーチ",
            heading: advice.heading,
            message: advice.message,
            status: "試作版",
            sources: advice.sources,
            confidence: advice.confidence
        });
    }

    function initializeHome() {
        if (
            window.BAS_DASHBOARD &&
            typeof window.BAS_DASHBOARD.initialize ===
                "function"
        ) {
            window.BAS_DASHBOARD.initialize();
        } else {
            console.error(
                "[Baika Home] Dashboardコンポーネントを読み込めません。"
            );
        }

        renderAiCoach();

        console.log(
            "[Baika Home] ホーム画面を初期化しました。"
        );
    }

    window.BAS_HOME = {
        initialize: initializeHome
    };
})();