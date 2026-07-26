(function () {
    "use strict";

    const ELEMENT_ID = "home-today-practice";

    const DEFAULT_DATA = {
        date: "2026年7月24日",
        distance: "70m",
        goalScore: 660,
        missions: [
            "リリースを丁寧にする",
            "クリッカー後も伸び続ける",
            "平均9.2点以上を目指す"
        ]
    };

    function render(data = DEFAULT_DATA) {
        const container = document.getElementById(ELEMENT_ID);

        if (!container) {
            console.warn(
                `[BAS_TODAY_PRACTICE] #${ELEMENT_ID} が見つかりません。`
            );
            return;
        }

        const missions = Array.isArray(data.missions)
            ? data.missions
            : [];

        container.innerHTML = `
            <h3 class="bas-home__dashboard-title">
                🎯 今日の練習
            </h3>

            <p class="bas-home__dashboard-text">
                ${escapeHtml(data.date)}
            </p>

            <div class="bas-home__stats">
                <div class="bas-home__stat">
                    <span class="bas-home__stat-label">
                        距離
                    </span>

                    <strong class="bas-home__stat-value">
                        ${escapeHtml(data.distance)}
                    </strong>
                </div>

                <div class="bas-home__stat">
                    <span class="bas-home__stat-label">
                        目標
                    </span>

                    <strong class="bas-home__stat-value">
                        ${escapeHtml(String(data.goalScore))}
                    </strong>

                    <span class="bas-home__stat-unit">
                        点
                    </span>
                </div>
            </div>

            <h4 class="bas-home__dashboard-title">
                今日のミッション
            </h4>

            <ul class="bas-home__goal-list">
                ${missions
                    .map(
                        (mission) => `
                            <li>
                                □ ${escapeHtml(mission)}
                            </li>
                        `
                    )
                    .join("")}
            </ul>

            <button
                type="button"
                class="bas-button bas-button--primary"
                id="homeStartPracticeButton"
            >
                練習を開始
            </button>
        `;
    }

    function initialize() {
    render(getTodayPracticeData());

    console.log("[BAS_TODAY_PRACTICE] initialized");
    }

    function getTodayPracticeData() {
    const practice =
        typeof BAS_STATE !== "undefined" &&
        BAS_STATE.practice
            ? BAS_STATE.practice
            : {};

    return {
        date:
            practice.date ??
            DEFAULT_DATA.date,

        distance:
            practice.distance ??
            DEFAULT_DATA.distance,

        goalScore:
            practice.goalScore ??
            DEFAULT_DATA.goalScore,

        missions:
            practice.missions ??
            DEFAULT_DATA.missions
    };
}

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    window.BAS_TODAY_PRACTICE = {
        render,
        initialize
    };
})();