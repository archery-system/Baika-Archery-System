/**
 * Baika Archery System
 * Project Zero
 * Records Page
 */

(function () {
    "use strict";

        /**
     * 比較対象として選択されたグルーピング記録
     *
     * @type {Object[]}
     */
    const selectedGroupingRecords = [];

    /**
 * 比較対象の選択状態を画面へ反映する
 */
function updateGroupingComparisonBar() {
    const comparisonBar =
        document.getElementById(
            "groupingComparisonBar"
        );

    const status =
        document.getElementById(
            "groupingComparisonStatus"
        );

    const startButton =
        document.getElementById(
            "groupingComparisonStartButton"
        );

    if (
        !comparisonBar ||
        !status ||
        !startButton
    ) {
        return;
    }

    const selectedCount =
        selectedGroupingRecords.length;

    comparisonBar.hidden =
        selectedCount === 0;

    if (selectedCount === 0) {
        status.textContent =
            "比較する記録を2件選択してください";
    } else if (selectedCount === 1) {
        status.textContent =
            "1件選択中です。もう1件選択してください";
    } else {
        status.textContent =
            "2件選択しました。比較を開始できます";
    }

    startButton.disabled =
        selectedCount !== 2;
}

/**
 * 比較開始ボタンを準備する
 */
function initializeGroupingComparison() {
    const startButton =
        document.getElementById(
            "groupingComparisonStartButton"
        );

    if (!startButton) {
        return;
    }

    startButton.addEventListener(
        "click",
        function () {
            if (
                selectedGroupingRecords.length !== 2
            ) {
                return;
            }

            try {
                sessionStorage.setItem(
                    "basGroupingComparisonRecords",
                    JSON.stringify(
                        selectedGroupingRecords
                    )
                );

                console.log(
                    "[グルーピング比較] 比較データを保存しました",
                    selectedGroupingRecords
                );

                window.location.href =
                "comparison.html";
            } catch (error) {
                console.error(
                    "[グルーピング比較] 比較データを保存できませんでした。",
                    error
                );

                alert(
                    "比較データを準備できませんでした。"
                );
            }
        }
    );

    updateGroupingComparisonBar();
}

    /**
     * 部員別練習記録画面を初期化する
     */
    async function initialize() {
        if (
            !window.V4Session ||
            typeof window.V4Session.requireLogin !== "function"
        ) {
            console.error(
                "[練習記録] V4Sessionを読み込めません。"
            );

            showError(
                "ログイン情報を確認できませんでした。"
            );

            return;
        }

        if (!window.V4Session.requireLogin()) {
            return;
        }

        const memberData =
            getLoggedInMemberData();

        if (!memberData.memberId) {
            console.error(
                "[練習記録] ログイン中のmemberIdがありません。",
                memberData
            );

            showUserName(memberData.memberName);

            showError(
                "部員IDを確認できませんでした。いったんログアウトして、もう一度ログインしてください。"
            );

            return;
        }

        showUserName(memberData.memberName);

        initializeTabs();

        initializeGroupingComparison();

        await loadAndRenderRecords(memberData);

        loadGroupingRecords();
    }


    /**
     * ログイン中の部員情報を取得する
     */
    function getLoggedInMemberData() {
        const sessionData =
            typeof window.V4Session.getLoggedInMemberData ===
            "function"
                ? window.V4Session.getLoggedInMemberData()
                : null;

        const memberId =
            sessionData &&
            sessionData.memberId != null
                ? String(sessionData.memberId).trim()
                : "";

        const memberName =
            sessionData
                ? String(
                    sessionData.displayName ||
                    sessionData.memberName ||
                    sessionData.member ||
                    ""
                ).trim()
                : "";

        return {
            memberId: memberId,
            memberName:
                memberName || "ログインユーザー"
        };
    }


    /**
     * GASから記録を取得して表示する
     */
    async function loadAndRenderRecords(memberData) {
        showLoading();

        if (
            !window.BAS_CLOUD ||
            typeof window.BAS_CLOUD.loadPracticeRecords !==
            "function"
        ) {
            console.error(
                "[練習記録] BAS_CLOUD.loadPracticeRecordsを読み込めません。"
            );

            showError(
                "練習記録の読込機能を確認できませんでした。"
            );

            return;
        }

        try {
            const allRecords =
                await window.BAS_CLOUD.loadPracticeRecords();

            const memberRecords =
                filterMemberRecords(
                    allRecords,
                    memberData
                );

            const sortedRecords =
                sortRecordsByDate(memberRecords);

            renderRecords(sortedRecords);
        } catch (error) {
            console.error(
                "[練習記録] 記録の取得に失敗しました。",
                error
            );

            showError(
                "練習記録を読み込めませんでした。通信環境またはGAS設定を確認してください。"
            );
        }
    }


    /**
     * ログイン中の部員の記録だけを抽出する
     *
     * 新しいProject Zero記録はmemberIdで判定する。
     * memberIdが保存されていない旧記録のみ、
     * 同じ部員名で補完して表示する。
     */
    function filterMemberRecords(
        records,
        memberData
    ) {
        if (!Array.isArray(records)) {
            return [];
        }

        const loginMemberId =
            normalizeText(memberData.memberId);

        const loginMemberName =
            normalizeText(memberData.memberName);

        return records.filter(function (record) {
            if (
                !record ||
                typeof record !== "object"
            ) {
                return false;
            }

            const recordMemberId =
                normalizeText(record.memberId);

            if (recordMemberId) {
                return recordMemberId === loginMemberId;
            }

            /*
             * Project Zero移行前の旧記録には
             * memberIdがないため、部員名で補完する。
             */
            const recordMemberName =
                normalizeText(record.memberName);

            return (
                loginMemberName !== "" &&
                recordMemberName === loginMemberName
            );
        });
    }


    /**
     * 日付の新しい順に並べ替える
     */
    function sortRecordsByDate(records) {
        return records
            .map(function (record, index) {
                return {
                    record: record,
                    originalIndex: index,
                    timestamp: getDateTimestamp(
                        record.date
                    )
                };
            })
            .sort(function (a, b) {
                if (b.timestamp !== a.timestamp) {
                    return b.timestamp - a.timestamp;
                }

                /*
                 * 同じ日付の場合は、
                 * 保存一覧の後ろにある記録を先に表示する。
                 */
                return (
                    b.originalIndex -
                    a.originalIndex
                );
            })
            .map(function (item) {
                return item.record;
            });
    }


    /**
     * 日付を並べ替え用の数値へ変換する
     */
    function getDateTimestamp(dateValue) {
        if (!dateValue) {
            return 0;
        }

        const normalizedDate =
            normalizeDateValue(dateValue);

        if (!normalizedDate) {
            return 0;
        }

        const timestamp =
            new Date(
                normalizedDate + "T00:00:00"
            ).getTime();

        return Number.isFinite(timestamp)
            ? timestamp
            : 0;
    }


    /**
     * 日付をYYYY-MM-DD形式へ整える
     */
    function normalizeDateValue(dateValue) {
        const text =
            String(dateValue || "").trim();

        if (!text) {
            return "";
        }

        const simpleDateMatch =
            text.match(
                /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
            );

        if (simpleDateMatch) {
            return [
                simpleDateMatch[1],
                String(
                    Number(simpleDateMatch[2])
                ).padStart(2, "0"),
                String(
                    Number(simpleDateMatch[3])
                ).padStart(2, "0")
            ].join("-");
        }

        const parsedDate =
            new Date(text);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "";
        }

        const year =
            parsedDate.getFullYear();

        const month =
            String(
                parsedDate.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                parsedDate.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    /**
     * 記録一覧を表示する
     */
    function renderRecords(records) {
        const recordsList =
            document.getElementById(
                "recordsList"
            );

        if (!recordsList) {
            console.error(
                "[練習記録] recordsListが見つかりません。"
            );

            return;
        }

        recordsList.replaceChildren();

        updateRecordCount(records.length);

        if (records.length === 0) {
            showEmpty();
            return;
        }

        const fragment =
            document.createDocumentFragment();

        records.forEach(function (
            record,
            index
        ) {
            fragment.appendChild(
                createRecordCard(
                    record,
                    index
                )
            );
        });

        recordsList.appendChild(fragment);

        showList();
    }


    /**
     * 記録カードを作成する
     */
    function createRecordCard(
        record,
        index
    ) {
        const article =
            document.createElement("article");

        article.className =
            "bas-records__item";

        article.dataset.recordIndex =
            String(index);

        const header =
            document.createElement("div");

        header.className =
            "bas-records__item-header";

        const date =
            document.createElement("h3");

        date.className =
            "bas-records__date";

        date.textContent =
            formatDisplayDate(record.date);

        const distance =
            document.createElement("span");

        distance.className =
            "bas-records__distance";

        distance.textContent =
            formatDistance(record.distance);

        header.appendChild(date);
        header.appendChild(distance);

        const arrows =
            document.createElement("div");

        arrows.className =
            "bas-records__arrows";

        arrows.setAttribute(
            "aria-label",
            "6射の得点"
        );

        getArrowValues(record).forEach(
            function (arrowValue, arrowIndex) {
                arrows.appendChild(
                    createArrowElement(
                        arrowValue,
                        arrowIndex
                    )
                );
            }
        );

        const total =
            createTotalElement(record);

        article.appendChild(header);
        article.appendChild(arrows);
        article.appendChild(total);

        return article;
    }


    /**
     * 6射を配列として取得する
     */
    function getArrowValues(record) {
        return [
            record.a1,
            record.a2,
            record.a3,
            record.a4,
            record.a5,
            record.a6
        ].map(function (value) {
            const normalized =
                normalizeScoreLabel(value);

            return normalized || "－";
        });
    }


    /**
     * 1射分の表示を作成する
     */
    function createArrowElement(
        arrowValue,
        arrowIndex
    ) {
        const arrow =
            document.createElement("span");

        arrow.className =
            "bas-records__arrow";

        arrow.textContent =
            arrowValue;

        arrow.setAttribute(
            "aria-label",
            `${arrowIndex + 1}射目 ${arrowValue}`
        );

        return arrow;
    }


    /**
     * 合計点表示を作成する
     */
    function createTotalElement(record) {
        const totalWrapper =
            document.createElement("div");

        totalWrapper.className =
            "bas-records__total";

        const label =
            document.createElement("span");

        label.className =
            "bas-records__total-label";

        label.textContent =
            "合計";

        const value =
            document.createElement("strong");

        value.className =
            "bas-records__total-value";

        value.textContent =
            String(
                getRecordTotal(record)
            );

        const unit =
            document.createElement("span");

        unit.className =
            "bas-records__total-unit";

        unit.textContent =
            "点";

        totalWrapper.appendChild(label);
        totalWrapper.appendChild(value);
        totalWrapper.appendChild(unit);

        return totalWrapper;
    }


    /**
     * 記録の合計点を取得する
     */
    function getRecordTotal(record) {
        const savedTotal =
            Number(record.total);

        if (Number.isFinite(savedTotal)) {
            return savedTotal;
        }

        return [
            record.a1,
            record.a2,
            record.a3,
            record.a4,
            record.a5,
            record.a6
        ].reduce(function (sum, value) {
            return (
                sum +
                convertScoreToNumber(value)
            );
        }, 0);
    }


    /**
     * 得点表示を数値へ変換する
     */
    function convertScoreToNumber(value) {
        const score =
            normalizeScoreLabel(value);

        if (score === "X") {
            return 10;
        }

        if (
            score === "M" ||
            score === ""
        ) {
            return 0;
        }

        const numericScore =
            Number(score);

        return Number.isFinite(numericScore)
            ? numericScore
            : 0;
    }


    /**
     * 得点表示を整える
     */
    function normalizeScoreLabel(value) {
        if (value == null) {
            return "";
        }

        return String(value)
            .trim()
            .toUpperCase();
    }


    /**
     * 日付を日本語表示へ変換する
     */
    function formatDisplayDate(dateValue) {
        const normalizedDate =
            normalizeDateValue(dateValue);

        if (!normalizedDate) {
            return "日付不明";
        }

        const parts =
            normalizedDate.split("-");

        return (
            `${Number(parts[0])}年` +
            `${Number(parts[1])}月` +
            `${Number(parts[2])}日`
        );
    }


    /**
     * 距離表示を整える
     */
    function formatDistance(distanceValue) {
        const distance =
            String(
                distanceValue == null
                    ? ""
                    : distanceValue
            ).trim();

        if (!distance) {
            return "距離未設定";
        }

        if (
            /m$/i.test(distance)
        ) {
            return distance;
        }

        if (
            /^\d+(\.\d+)?$/.test(distance)
        ) {
            return `${distance}m`;
        }

        return distance;
    }


    /**
     * 部員名を画面へ表示する
     */
    function showUserName(memberName) {
        const element =
            document.getElementById(
                "recordsUserName"
            );

        if (!element) {
            return;
        }

        element.textContent =
            memberName || "ログインユーザー";
    }


    /**
     * 記録件数を更新する
     */
    function updateRecordCount(count) {
        const element =
            document.getElementById(
                "recordsCount"
            );

        if (!element) {
            return;
        }

        element.textContent =
            `${count}件`;
    }


    /**
     * 読み込み中表示
     */
    function showLoading() {
        updateRecordCount(0);

        setVisibility({
            status: true,
            list: false,
            empty: false
        });

        const status =
            document.getElementById(
                "recordsStatus"
            );

        const message =
            document.getElementById(
                "recordsStatusMessage"
            );

        if (status) {
            status.classList.remove(
                "bas-records__status--error"
            );
        }

        if (message) {
            message.textContent =
                "練習記録を読み込んでいます。";
        }
    }


    /**
     * 一覧表示
     */
    function showList() {
        setVisibility({
            status: false,
            list: true,
            empty: false
        });
    }


    /**
     * 0件表示
     */
    function showEmpty() {
        setVisibility({
            status: false,
            list: false,
            empty: true
        });
    }


    /**
     * エラー表示
     */
    function showError(messageText) {
        setVisibility({
            status: true,
            list: false,
            empty: false
        });

        const status =
            document.getElementById(
                "recordsStatus"
            );

        const message =
            document.getElementById(
                "recordsStatusMessage"
            );

        if (status) {
            status.classList.add(
                "bas-records__status--error"
            );
        }

        if (message) {
            message.textContent =
                messageText;
        }
    }


    /**
     * 状態ごとの表示切替
     */
    function setVisibility(options) {
        const status =
            document.getElementById(
                "recordsStatus"
            );

        const list =
            document.getElementById(
                "recordsListSection"
            );

        const empty =
            document.getElementById(
                "recordsEmpty"
            );

        if (status) {
            status.hidden =
                !options.status;
        }

        if (list) {
            list.hidden =
                !options.list;
        }

        if (empty) {
            empty.hidden =
                !options.empty;
        }
    }


    /**
     * 比較用文字列を整える
     */
    function normalizeText(value) {
        return String(
            value == null
                ? ""
                : value
        ).trim();
    }

/**
 * タブを初期化する
 */
function initializeTabs() {
    const practiceTab =
        document.getElementById(
            "practiceRecordsTab"
        );

    const groupingTab =
        document.getElementById(
            "groupingRecordsTab"
        );

    if (
        !practiceTab ||
        !groupingTab
    ) {
        return;
    }

    practiceTab.addEventListener(
        "click",
        function () {
            showPracticeTab();
        }
    );

    groupingTab.addEventListener(
        "click",
        function () {
            showGroupingTab();
        }
    );
}

/**
 * 練習記録タブを表示する
 */
function showPracticeTab() {
    document
        .getElementById(
            "recordsListSection"
        )
        .hidden = false;

    document
        .getElementById(
            "groupingRecordsSection"
        )
        .hidden = true;

    document
        .getElementById(
            "practiceRecordsTab"
        )
        .classList.add(
            "bas-records__tab--active"
        );

    document
        .getElementById(
            "groupingRecordsTab"
        )
        .classList.remove(
            "bas-records__tab--active"
        );
}

/**
 * グルーピング記録タブを表示する
 */
function showGroupingTab() {
    document
        .getElementById(
            "recordsListSection"
        )
        .hidden = true;

    document
        .getElementById(
            "groupingRecordsSection"
        )
        .hidden = false;

    document
        .getElementById(
            "practiceRecordsTab"
        )
        .classList.remove(
            "bas-records__tab--active"
        );

    document
        .getElementById(
            "groupingRecordsTab"
        )
        .classList.add(
            "bas-records__tab--active"
        );
}

function loadGroupingRecords() {

    if (
        !window.V4Session ||
        typeof window.V4Session.getLoggedInMemberId
        !== "function"
    ) {
        return;
    }

    const memberId =
        window.V4Session.getLoggedInMemberId();

    const key =
        "baika-grouping-history-" +
        memberId;

    const history =
        JSON.parse(
            localStorage.getItem(key) || "[]"
        );

   renderGroupingRecords(history);

}

/**
 * 画面表示用の文字列をHTMLとして安全な形へ変換する
 */
function escapeHtml(value) {

    return String(
        value == null ? "" : value
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/**
 * グルーピング記録を画面へ表示する
 */

/**
 * コンディションの内部値を日本語表示へ変換する
 */
function formatConditionValue(type, value) {

    const originalValue =
        String(value == null ? "" : value).trim();

    const labels = {
        feeling: {
            "very-good": "とても良い",
            good: "良い",
            normal: "普通",
            bad: "悪い",
            "very-bad": "とても悪い"
        },

        weather: {
            sunny: "晴れ",
            cloudy: "曇り",
            rainy: "雨",
            snowy: "雪"
        },

        windStrength: {
            none: "無風",
            weak: "弱い",
            normal: "普通",
            strong: "強い",
            "very-strong": "とても強い"
        },

        windDirection: {
            north: "↑ 手前から奥へ",
            south: "↓ 奥から手前へ",
            west: "← 右から左へ",
            east: "→ 左から右へ",
            northwest: "↖ 右手前から左奥へ",
            northeast: "↗ 左手前から右奥へ",
            southwest: "↙ 右奥から左手前へ",
            southeast: "↘ 左奥から手前へ"
        }
    };

    if (
        labels[type] &&
        labels[type][originalValue]
    ) {
        return labels[type][originalValue];
    }

    return originalValue;
}

function renderGroupingRecords(history) {

    const list =
        document.getElementById(
            "groupingRecordsList"
        );

    const empty =
        document.getElementById(
            "groupingRecordsEmpty"
        );

    const count =
        document.getElementById(
            "groupingRecordCount"
        );

    list.replaceChildren();

    count.textContent =
        history.length + "件";

    if (history.length === 0) {

        empty.hidden = false;

        return;

    }

    empty.hidden = true;

    history
        .slice()
        .reverse()
        .forEach(function(record, index){

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "bas-records__item";

            const arrowCount =
    Array.isArray(record.arrows)
        ? record.arrows.length
        : 0;

const conditionItems = [
    record.conditionFeeling
        ? {
            icon: "😊",
            label: "調子",
            value: formatConditionValue(
            "feeling",
            record.conditionFeeling
)
        }
        : null,

    record.conditionWeather
        ? {
            icon: "☀️",
            label: "天気",
            value: formatConditionValue(
            "weather",
             record.conditionWeather
)
        }
        : null,

    record.conditionWindStrength
        ? {
            icon: "💨",
            label: "風の強さ",
            value: formatConditionValue(
            "windStrength",
            record.conditionWindStrength
)
        }
        : null,

    record.conditionWindDirection
        ? {
            icon: "🧭",
            label: "風向き",
            value: formatConditionValue(
            "windDirection",
            record.conditionWindDirection
)
        }
        : null,

    record.conditionTheme
        ? {
            icon: "🎯",
            label: "今日のテーマ",
            value: record.conditionTheme
        }
        : null,

    record.conditionMemo
        ? {
            icon: "📝",
            label: "メモ",
            value: record.conditionMemo
        }
        : null
].filter(Boolean);

const conditionHtml =
    conditionItems.length > 0
        ? `
            <div class="bas-records__grouping-conditions">
                ${conditionItems
                    .map(function (item) {
                        return `
                            <p class="bas-records__grouping-condition">
                                <span>
                                    ${item.icon}
                                    ${escapeHtml(item.label)}
                                </span>

                                <strong>
                                    ${escapeHtml(item.value)}
                                </strong>
                            </p>
                        `;
                    })
                    .join("")}
            </div>
        `
        : "";

card.innerHTML =
    `
    <h3>${record.practiceDate}</h3>

    <div class="bas-records__grouping-meta">

    <span>${record.distance}</span>

    <span>${record.arrows.length}射</span>

    <span>${record.savedAt}</span>

</div>

${conditionHtml}

<div class="bas-records__grouping-actions">

       <button
    class="bas-records__grouping-button bas-records__grouping-button--primary"
    data-grouping-id="${escapeHtml(record.id)}"
>
    確認
</button>

       <button
    class="bas-records__grouping-button"
    type="button"
    data-grouping-compare-id="${escapeHtml(record.id)}"
    aria-pressed="false"
>
    比較に追加
</button>

    </div>
    `;

const confirmButton =
    card.querySelector("[data-grouping-id]");

if (confirmButton) {
    confirmButton.addEventListener(
        "click",
        function () {

            console.log(
                "[確認ボタン] クリックされました",
                record
            );

            console.log(
                "[確認ボタン] ビューア状態",
                window.BAS_GROUPING_VIEWER
            );

            if (
                window.BAS_GROUPING_VIEWER &&
                typeof window.BAS_GROUPING_VIEWER.open ===
                    "function"
            ) {
                window.BAS_GROUPING_VIEWER.open(record);
            } else {
                console.error(
                    "[確認ボタン] グルーピングビューアを読み込めません。"
                );
            }

        }
    );
}

const compareButton =
    card.querySelector(
        "[data-grouping-compare-id]"
    );

if (compareButton) {
    compareButton.addEventListener(
        "click",
        function () {
            const recordId =
                String(record.id || "");

            const selectedIndex =
                selectedGroupingRecords.findIndex(
                    function (selectedRecord) {
                        return String(
                            selectedRecord.id || ""
                        ) === recordId;
                    }
                );

            /*
             * すでに選択済みなら解除する
             */
            if (selectedIndex !== -1) {
                selectedGroupingRecords.splice(
                    selectedIndex,
                    1
                );

                compareButton.textContent =
                    "比較に追加";

                compareButton.setAttribute(
                    "aria-pressed",
                    "false"
                );

                compareButton.classList.remove(
                    "bas-records__grouping-button--selected"
                );

                updateGroupingComparisonBar();

                console.log(
                    "[グルーピング比較] 選択解除",
                    selectedGroupingRecords
                );

                return;
            }

            /*
             * 最大2件まで
             */
            if (
                selectedGroupingRecords.length >= 2
            ) {
                alert(
                    "比較できるグルーピングは最大2件です。どちらかを解除してください。"
                );

                return;
            }

            selectedGroupingRecords.push(record);

            compareButton.textContent =
                `選択中（${selectedGroupingRecords.length}/2）`;

            compareButton.setAttribute(
                "aria-pressed",
                "true"
            );

            compareButton.classList.add(
                "bas-records__grouping-button--selected"
            );

            updateGroupingComparisonBar();

            console.log(
                "[グルーピング比較] 選択追加",
                selectedGroupingRecords
            );
        }
    );
}

            list.appendChild(card);

        });

}

    window.BAS_RECORDS = {
        initialize: initialize
    };
})();