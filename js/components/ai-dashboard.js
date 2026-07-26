/**
 * Baika Archery System
 * Project Zero
 * AI Dashboard Component
 */

(function () {
    "use strict";

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getTrendIcon(direction) {
        if (direction === "up") {
            return "📈";
        }

        if (direction === "down") {
            return "📉";
        }

        if (direction === "stable") {
            return "➡️";
        }

        return "📊";
    }

    function formatScore(value) {
        const score = Number(value);

        if (!Number.isFinite(score)) {
            return "-";
        }

        return score.toFixed(1);
    }

    function createMarkup(result) {
        const trend = result || {};

        const icon =
            getTrendIcon(trend.direction);

        const label =
            typeof trend.label === "string"
                ? trend.label
                : "データ不足";

        const message =
            typeof trend.message === "string"
                ? trend.message
                : "練習記録を追加すると、最近の傾向を分析します。";

        return `
    <section
        class="
            bas-card
            bas-card--highlight
            bas-ai-dashboard
        "
    >
        <header
            class="
                bas-card__header
                bas-ai-dashboard__header
            "
        >
            <div class="bas-card__heading">
                <div
                    class="
                        bas-card__icon
                        bas-ai-dashboard__icon
                    "
                    aria-hidden="true"
                >
                    ${icon}
                </div>

                <div class="bas-card__heading-text">
                    <p class="bas-ai-dashboard__eyebrow">
                        AI分析
                    </p>

                    <h2
                        class="
                            bas-card__title
                            bas-ai-dashboard__title
                        "
                    >
                        最近の調子
                    </h2>
                </div>
            </div>

            <span
                class="
                    bas-card__status
                    bas-ai-dashboard__status
                "
            >
                ${escapeHtml(label)}
            </span>
        </header>

        <div
            class="
                bas-card__body
                bas-ai-dashboard__body
            "
        >
            <div
                class="
                    bas-card__metrics
                    bas-ai-dashboard__metrics
                "
            >
                <div
                    class="
                        bas-card__metric
                        bas-ai-dashboard__metric
                    "
                >
                    <span
                        class="
                            bas-card__metric-label
                            bas-ai-dashboard__metric-label
                        "
                    >
                        最近${trend.count || 0}回平均
                    </span>

                    <strong
                        class="
                            bas-card__metric-value
                            bas-ai-dashboard__metric-value
                        "
                    >
                        ${formatScore(trend.averageScore)}点
                    </strong>
                </div>

                <div
                    class="
                        bas-card__metric
                        bas-ai-dashboard__metric
                    "
                >
                    <span
                        class="
                            bas-card__metric-label
                            bas-ai-dashboard__metric-label
                        "
                    >
                        最新
                    </span>

                    <strong
                        class="
                            bas-card__metric-value
                            bas-ai-dashboard__metric-value
                        "
                    >
                        ${
                            Number.isFinite(
                                Number(trend.latestScore)
                            )
                                ? `${Number(trend.latestScore)}点`
                                : "-"
                        }
                    </strong>
                </div>

                <div
                    class="
                        bas-card__metric
                        bas-ai-dashboard__metric
                    "
                >
                    <span
                        class="
                            bas-card__metric-label
                            bas-ai-dashboard__metric-label
                        "
                    >
                        最高
                    </span>

                    <strong
                        class="
                            bas-card__metric-value
                            bas-ai-dashboard__metric-value
                        "
                    >
                        ${
                            Number.isFinite(
                                Number(trend.highestScore)
                            )
                                ? `${Number(trend.highestScore)}点`
                                : "-"
                        }
                    </strong>
                </div>
            </div>

            <div
                class="
                    bas-card__section
                    bas-ai-dashboard__message-area
                "
            >
                <div
                    class="
                        bas-card__message
                        bas-ai-dashboard__message
                    "
                >
                    <p>
                        ${escapeHtml(message)}
                    </p>
                </div>
            </div>
        </div>
    </section>
`;
    }
    
    function render(options) {
        const settings = options || {};

        const targetId =
            typeof settings.targetId === "string" &&
            settings.targetId.trim() !== ""
                ? settings.targetId.trim()
                : "home-ai-dashboard";

        const target =
            document.getElementById(targetId);

        if (!target) {
            console.error(
                "[Baika AI Dashboard] 表示先が見つかりません:",
                targetId
            );

            return false;
        }

        target.innerHTML =
            createMarkup(settings.result);

        return true;
    }

    function initialize(options) {
        const settings = options || {};

        const history =
            typeof BAS_STATE !== "undefined" &&
            Array.isArray(BAS_STATE.practiceHistory)
                ? BAS_STATE.practiceHistory
                : [];

        const result =
            typeof BAS_TREND_ANALYZER !== "undefined" &&
            typeof BAS_TREND_ANALYZER.analyze === "function"
                ? BAS_TREND_ANALYZER.analyze(history)
                : {
                    direction: "insufficient",
                    label: "データ不足",
                    count: history.length,
                    averageScore: null,
                    latestScore: null,
                    highestScore: null,
                    message:
                        "傾向分析エンジンを読み込めませんでした。"
                };

        const rendered =
            render({
                targetId:
                    settings.targetId ||
                    "home-ai-dashboard",

                result:
                    result
            });

        if (rendered) {
            console.log(
                "[Baika AI Dashboard] AIダッシュボードを初期化しました。"
            );
        }

        return rendered;
    }

    window.BAS_AI_DASHBOARD = {
        render: render,
        initialize: initialize
    };
})();