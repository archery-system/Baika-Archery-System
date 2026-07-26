/**
 * Baika Archery System
 * Project Zero
 * AI Coach Engine
 */

(function () {
    "use strict";

    function normalizeLastPractice(lastPractice) {
        const practice =
            lastPractice &&
            typeof lastPractice === "object"
                ? lastPractice
                : {};

        return {
            totalScore:
                Number(practice.totalScore),

            averageScore:
                Number(practice.averageScore),

            arrowCount:
                Number(practice.arrowCount),

            distance:
                typeof practice.distance === "string"
                    ? practice.distance.trim()
                    : "",

            memo:
                typeof practice.memo === "string"
                    ? practice.memo.trim()
                    : ""
        };
    }

    function analyzeScore(practice) {
        const result = {
            heading:
                "前回の練習を振り返りましょう",

            message:
                "前回の記録を確認し、同じ動作を安定して繰り返すことを意識しましょう。",

            confidence: 55,

            missions: []
        };

        if (
            Number.isFinite(practice.averageScore) &&
            practice.averageScore >= 9
        ) {
            result.heading =
                "高い得点水準を維持できています";

            result.message =
                "前回は平均9点以上を記録しています。大きくフォームを変えず、同じセットアップとリリースを再現することを意識しましょう。";

            result.confidence = 85;

            result.missions.push(
                "前回と同じセットアップを再現する"
            );

            result.missions.push(
                "平均9.2点以上を目指す"
            );
        } else if (
            Number.isFinite(practice.averageScore) &&
            practice.averageScore >= 8
        ) {
            result.heading =
                "安定した射を増やしましょう";

            result.message =
                "前回は良い射が積み重なっています。得点を追い過ぎず、肩の位置とリリースまでの流れを一定にすることが次の安定につながります。";

            result.confidence = 75;

            result.missions.push(
                "肩の位置を一定にする"
            );

            result.missions.push(
                "リリースまで同じ流れを保つ"
            );
        } else if (
            Number.isFinite(practice.averageScore) &&
            practice.averageScore > 0
        ) {
            result.heading =
                "フォームの再現性を優先しましょう";

            result.message =
                "前回は得点のばらつきがあった可能性があります。まずは狙い続けることより、セットアップからリリースまでを同じリズムで行うことを優先しましょう。";

            result.confidence = 65;

            result.missions.push(
                "セットアップを毎回同じにする"
            );

            result.missions.push(
                "リリースを急がない"
            );
        }

        return result;
    }

    function analyzeMemo(practice) {
        const result = {
            messages: [],
            confidenceBonus: 0,
            missions: []
        };

        if (practice.memo.includes("クリッカー")) {
            result.messages.push(
                "メモにクリッカーへの意識が記録されています。音に反応して離すのではなく、伸び合いの結果としてクリッカーが落ちる流れを確認しましょう。"
            );

            result.confidenceBonus += 5;

            result.missions.push(
                "クリッカー後も伸び続ける"
            );
        }

        if (practice.memo.includes("肩")) {
            result.messages.push(
                "肩に関する記録があります。痛みや力みがある場合は無理に射数を増やさず、肩の位置と押し手の方向を丁寧に確認しましょう。"
            );

            result.confidenceBonus += 5;

            result.missions.push(
                "肩の力みを減らす"
            );
        }

        if (practice.memo.includes("グルーピング")) {
            result.messages.push(
                "グルーピングに関する記録があります。得点だけでなく、矢のまとまりと外れた方向も確認しましょう。"
            );

            result.confidenceBonus += 5;

            result.missions.push(
                "グルーピングの方向を確認する"
            );
        }

        if (practice.memo.includes("押し手")) {
            result.messages.push(
                "押し手への意識が記録されています。リリース後まで的方向へ押し続ける感覚を確認しましょう。"
            );

            result.confidenceBonus += 5;

            result.missions.push(
                "押し手を最後まで伸ばす"
            );
        }

        return result;
    }

    function createSources(practice) {
        const sources = [];

        if (
            Number.isFinite(practice.totalScore) &&
            practice.totalScore > 0
        ) {
            sources.push(
                `前回の総得点：${practice.totalScore}点`
            );
        }

        if (
            Number.isFinite(practice.averageScore) &&
            practice.averageScore > 0
        ) {
            sources.push(
                `前回の平均：${practice.averageScore.toFixed(2)}点`
            );
        }

        if (
            Number.isFinite(practice.arrowCount) &&
            practice.arrowCount > 0
        ) {
            sources.push(
                `前回の射数：${practice.arrowCount}射`
            );
        }

        if (practice.distance !== "") {
            sources.push(
                `前回の距離：${practice.distance}`
            );
        }

        if (practice.memo !== "") {
            sources.push(
                "前回の練習メモ"
            );
        }

        return sources;
    }

    function removeDuplicateMissions(missions) {
        return missions.filter(function (
            mission,
            index,
            values
        ) {
            return (
                typeof mission === "string" &&
                mission.trim() !== "" &&
                values.indexOf(mission) === index
            );
        });
    }

    function analyze(lastPractice) {
        if (!lastPractice) {
            return {
                heading:
                    "前回の練習記録がありません",

                message:
                    "練習記録を保存すると、次回の練習に向けたアドバイスを表示します。",

                sources: [],

                confidence: 0,

                missions: [
                    "基本姿勢を丁寧に確認する",
                    "リリースまで同じリズムを保つ",
                    "1射ずつ落ち着いて射つ"
                ]
            };
        }

        const practice =
            normalizeLastPractice(lastPractice);

        const scoreAnalysis =
            analyzeScore(practice);

        const memoAnalysis =
            analyzeMemo(practice);

        const additionalMessage =
            memoAnalysis.messages.length > 0
                ? ` ${memoAnalysis.messages.join(" ")}`
                : "";

        const missions =
            removeDuplicateMissions(
                scoreAnalysis.missions.concat(
                    memoAnalysis.missions
                )
            ).slice(0, 3);

        if (missions.length === 0) {
            missions.push(
                "リリースを丁寧にする",
                "クリッカー後も伸び続ける",
                "平均9.2点以上を目指す"
            );
        }

        return {
            heading:
                scoreAnalysis.heading,

            message:
                scoreAnalysis.message +
                additionalMessage,

            sources:
                createSources(practice),

            confidence:
                Math.min(
                    95,
                    scoreAnalysis.confidence +
                    memoAnalysis.confidenceBonus
                ),

            missions:
                missions
        };
    }

    window.BAS_AI_ENGINE = {
        analyze: analyze,
        analyzeScore: analyzeScore,
        analyzeMemo: analyzeMemo
    };
})();