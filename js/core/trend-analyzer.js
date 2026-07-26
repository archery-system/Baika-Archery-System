/**
 * Baika Archery System
 * Project Zero
 * Trend Analyzer
 */

(function () {
    "use strict";

    function normalizeHistory(history) {
        if (!Array.isArray(history)) {
            return [];
        }

        return history
            .filter(function (practice) {
                return (
                    practice &&
                    typeof practice === "object" &&
                    Number.isFinite(
                        Number(practice.totalScore)
                    )
                );
            })
            .map(function (practice) {
                return {
                    date:
                        typeof practice.date === "string"
                            ? practice.date
                            : "",

                    distance:
                        typeof practice.distance === "string"
                            ? practice.distance
                            : "",

                    totalScore:
                        Number(practice.totalScore),

                    averageScore:
                        Number(practice.averageScore),

                    arrowCount:
                        Number(practice.arrowCount)
                };
            });
    }

    function calculateAverage(values) {
        if (!Array.isArray(values) || values.length === 0) {
            return null;
        }

        const total =
            values.reduce(function (sum, value) {
                return sum + value;
            }, 0);

        return total / values.length;
    }

    function determineTrend(scores) {
        if (scores.length < 2) {
            return {
                direction: "insufficient",
                label: "データ不足",
                difference: 0
            };
        }

        const firstScore =
            scores[0];

        const latestScore =
            scores[scores.length - 1];

        const difference =
            latestScore - firstScore;

        if (difference >= 8) {
            return {
                direction: "up",
                label: "上昇傾向",
                difference: difference
            };
        }

        if (difference <= -8) {
            return {
                direction: "down",
                label: "下降傾向",
                difference: difference
            };
        }

        return {
            direction: "stable",
            label: "安定傾向",
            difference: difference
        };
    }

    function createMessage(result) {
        if (result.direction === "up") {
            return (
                `最近${result.count}回の総得点は上昇傾向です。` +
                `最初の記録から${result.difference}点伸びています。` +
                "現在のフォームを大きく変えず、再現性を高めていきましょう。"
            );
        }

        if (result.direction === "down") {
            return (
                `最近${result.count}回の総得点は下降傾向です。` +
                `最初の記録から${Math.abs(result.difference)}点下がっています。` +
                "得点を追い過ぎず、基本動作と体調を確認しましょう。"
            );
        }

        if (result.direction === "stable") {
            return (
                `最近${result.count}回の総得点は安定しています。` +
                `平均は${result.averageScore.toFixed(1)}点です。` +
                "次は安定した射を維持しながら、少しずつ目標点を上げましょう。"
            );
        }

        return "傾向を分析するには、2回以上の練習記録が必要です。";
    }

    function analyze(history) {
        const normalizedHistory =
            normalizeHistory(history);

        if (normalizedHistory.length < 2) {
            return {
                direction: "insufficient",
                label: "データ不足",
                count: normalizedHistory.length,
                difference: 0,
                averageScore: null,
                latestScore:
                    normalizedHistory.length === 1
                        ? normalizedHistory[0].totalScore
                        : null,
                message:
                    "傾向を分析するには、2回以上の練習記録が必要です。"
            };
        }

        const recentHistory =
            normalizedHistory.slice(-5);

        const scores =
            recentHistory.map(function (practice) {
                return practice.totalScore;
            });

        const trend =
            determineTrend(scores);

        const result = {
            direction:
                trend.direction,

            label:
                trend.label,

            count:
                recentHistory.length,

            difference:
                trend.difference,

            averageScore:
                calculateAverage(scores),

            latestScore:
                scores[scores.length - 1],

            highestScore:
                Math.max.apply(null, scores),

            lowestScore:
                Math.min.apply(null, scores)
        };

        result.message =
            createMessage(result);

        return result;
    }

    window.BAS_TREND_ANALYZER = {
        analyze: analyze
    };
})();