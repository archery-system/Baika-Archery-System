/**
 * Baika Archery System
 * Project Zero
 * 大会記録一覧
 */

(function () {
    "use strict";

    const MATCH_RECORDS_CACHE_KEY =
    "baika-match-records-cache";

const MATCH_RECORDS_CACHE_MAX_AGE =
    5 * 60 * 1000;

    async function initialize() {
    let renderedCache = false;

    const cachedRecords =
        loadMatchRecordsCache();

    if (cachedRecords) {
        renderVisibleRecords(
            cachedRecords
        );

        renderedCache = true;
    } else {
        showLoading();
    }

    if (
        !window.BAS_CLOUD ||
        typeof window.BAS_CLOUD
            .loadMatchRecords !==
            "function"
    ) {
        if (!renderedCache) {
            showError(
                "大会記録の読込機能を確認できませんでした。"
            );
        }

        return;
    }

    try {
        const allRecords =
            await window.BAS_CLOUD
                .loadMatchRecords();

        saveMatchRecordsCache(
            allRecords
        );

        renderVisibleRecords(
            allRecords
        );
    } catch (error) {
        console.error(
            "[大会記録一覧] 読込失敗:",
            error
        );

        /*
         * キャッシュを表示できている場合は、
         * 通信失敗でも画面を消さない。
         */
        if (!renderedCache) {
            showError(
                "大会記録を読み込めませんでした。"
            );
        }
    }
}

function renderVisibleRecords(
    allRecords
) {
    const visibleRecords =
        filterVisibleRecords(
            allRecords
        );

    const sortedRecords =
        sortRecords(
            visibleRecords
        );

    renderRecords(
        sortedRecords
    );
}

function saveMatchRecordsCache(
    records
) {
    if (!Array.isArray(records)) {
        return;
    }

    try {
        const cacheData = {
            savedAt:
                Date.now(),

            records:
                records
        };

        window.sessionStorage.setItem(
            MATCH_RECORDS_CACHE_KEY,
            JSON.stringify(
                cacheData
            )
        );
    } catch (error) {
        console.warn(
            "[大会記録一覧] " +
            "一覧キャッシュを保存できませんでした。",
            error
        );
    }
}

function loadMatchRecordsCache() {
    try {
        const storedValue =
            window.sessionStorage.getItem(
                MATCH_RECORDS_CACHE_KEY
            );

        if (!storedValue) {
            return null;
        }

        const cacheData =
            JSON.parse(
                storedValue
            );

        if (
            !cacheData ||
            !Array.isArray(
                cacheData.records
            )
        ) {
            return null;
        }

        const savedAt =
            Number(
                cacheData.savedAt || 0
            );

        const cacheAge =
            Date.now() - savedAt;

        if (
            savedAt <= 0 ||
            cacheAge >
                MATCH_RECORDS_CACHE_MAX_AGE
        ) {
            return null;
        }

        return cacheData.records;
    } catch (error) {
        console.warn(
            "[大会記録一覧] " +
            "一覧キャッシュを読み込めませんでした。",
            error
        );

        return null;
    }
}

    function filterVisibleRecords(records) {
        if (!Array.isArray(records)) {
            return [];
        }

        const loginData =
            window.V4Session &&
            typeof window.V4Session
                .getLoggedInMemberData ===
                "function"
                ? window.V4Session
                    .getLoggedInMemberData()
                : null;

        if (!loginData) {
            return [];
        }

        const loginMemberId =
            normalizeText(
                loginData.memberId
            );

        const role =
            normalizeText(
                loginData.role
            );

        const canViewAll =
            role === "admin" ||
            role === "coach";

        return records.filter(
            function (record) {
                if (
                    !record ||
                    typeof record !==
                        "object"
                ) {
                    return false;
                }

                if (canViewAll) {
                    return true;
                }

                const recordMemberId =
                    normalizeText(
                        record.memberId
                    );

                if (
                    recordMemberId ===
                    loginMemberId
                ) {
                    return true;
                }

                return (
                    normalizeText(
                        record.visibility
                    ) === "members"
                );
            }
        );
    }

    function sortRecords(records) {
        return records
            .slice()
            .sort(
                function (a, b) {
                    const aDate =
                        normalizeText(
                            a.matchDate
                        );

                    const bDate =
                        normalizeText(
                            b.matchDate
                        );

                    if (aDate !== bDate) {
                        return bDate
                            .localeCompare(
                                aDate
                            );
                    }

                    return normalizeText(
                        b.createdAt
                    ).localeCompare(
                        normalizeText(
                            a.createdAt
                        )
                    );
                }
            );
    }

    function renderRecords(records) {
        const list =
            document.getElementById(
                "matchRecordsList"
            );

        const status =
            document.getElementById(
                "matchRecordsStatus"
            );

        const empty =
            document.getElementById(
                "matchRecordsEmpty"
            );

        const count =
            document.getElementById(
                "matchRecordCount"
            );

        if (
            !list ||
            !status ||
            !empty ||
            !count
        ) {
            return;
        }

        list.replaceChildren();

        count.textContent =
            `${records.length}件`;

        if (records.length === 0) {
            status.hidden = true;
            list.hidden = true;
            empty.hidden = false;
            return;
        }

        records.forEach(
            function (record) {
                list.appendChild(
                    createRecordCard(
                        record
                    )
                );
            }
        );

        status.hidden = true;
        empty.hidden = true;
        list.hidden = false;
    }

/**
 * 大会記録を訂正できるか判定する。
 *
 * 本人：
 *   自分の記録だけ訂正可能
 *
 * 管理者：
 *   すべての記録を訂正可能
 *
 * 監督・他部員：
 *   閲覧のみ
 */
function canEditRecord(record) {
    if (
        !record ||
        typeof record !== "object"
    ) {
        return false;
    }

    if (
        !window.V4Session ||
        typeof window.V4Session
            .getLoggedInMemberData !==
            "function"
    ) {
        return false;
    }

    const loginData =
        window.V4Session
            .getLoggedInMemberData();

    if (!loginData) {
        return false;
    }

    const role =
        normalizeText(
            loginData.role
        );

    if (role === "admin") {
        return true;
    }

    if (role !== "member") {
        return false;
    }

    const loginMemberId =
        normalizeText(
            loginData.memberId
        );

    const recordMemberId =
        normalizeText(
            record.memberId
        );

    return (
        loginMemberId !== "" &&
        recordMemberId !== "" &&
        loginMemberId === recordMemberId
    );
}

    function createRecordCard(record) {
        const article =
            document.createElement(
                "article"
            );

        article.className =
            "bas-match-record";

        const top =
            document.createElement(
                "div"
            );

        top.className =
            "bas-match-record__top";

        const title =
            document.createElement(
                "h3"
            );

        title.className =
            "bas-match-record__title";

        title.textContent =
            normalizeText(
                record.matchName
            ) ||
            "大会名未設定";

        const date =
            document.createElement(
                "span"
            );

        date.className =
            "bas-match-record__date";

        date.textContent =
            formatDate(
                record.matchDate
            );

        top.appendChild(title);
        top.appendChild(date);

        const meta =
            document.createElement(
                "div"
            );

        meta.className =
            "bas-match-record__meta";

        meta.appendChild(
            createBadge(
                normalizeText(
                    record.categoryLabel
                ) ||
                normalizeText(
                    record.category
                ) ||
                "種目未設定"
            )
        );

        meta.appendChild(
            createBadge(
                normalizeText(
                    record.memberName
                ) ||
                "部員名未設定"
            )
        );

        meta.appendChild(
            createBadge(
                normalizeText(
                    record.visibility
                ) === "members"
                    ? "部員公開"
                    : "非公開"
            )
        );

        const score =
            document.createElement(
                "div"
            );

        score.className =
            "bas-match-record__score";

        score.appendChild(
            createScoreItem(
                "合計",
                toNumber(
                    record.total
                ),
                "点"
            )
        );

        score.appendChild(
            createScoreItem(
                `総${
                    normalizeText(
                        record.count1Label
                    ) || "X"
                }数`,
                toNumber(
                    record.totalCount1
                ),
                ""
            )
        );

        score.appendChild(
            createScoreItem(
                `総${
                    normalizeText(
                        record.count2Label
                    ) || "10"
                }数`,
                toNumber(
                    record.totalCount2
                ),
                ""
            )
        );

        article.appendChild(top);
        article.appendChild(meta);
        article.appendChild(score);

const detail =
    createRecordDetail(
        record
    );

article.appendChild(
    detail
);

const resultUrl =
    normalizeResultUrlForDisplay(
        record.resultUrl
    );

if (resultUrl) {
    const urlRow =
        document.createElement(
            "p"
        );

    urlRow.className =
        "bas-match-record__url";

    const urlLabel =
        document.createElement(
            "strong"
        );

    urlLabel.textContent =
        "大会結果URL：";

    const resultLink =
        document.createElement(
            "a"
        );

    resultLink.href =
        resultUrl;

    resultLink.target =
        "_blank";

    resultLink.rel =
        "noopener noreferrer";

    resultLink.className =
        "bas-match-record__url-link";

    resultLink.textContent =
        resultUrl;

    urlRow.appendChild(
        urlLabel
    );

    urlRow.appendChild(
        resultLink
    );

    article.appendChild(
        urlRow
    );
}

if (
    canEditRecord(record) &&
    normalizeText(record.recordId)
) {
    const actions =
        document.createElement("div");

    actions.className =
        "bas-match-record__actions";

    const editLink =
        document.createElement("a");

    editLink.href =
        "project-zero-match.html?recordId=" +
        encodeURIComponent(
            normalizeText(
                record.recordId
            )
        );

        editLink.addEventListener(
    "click",
    function () {
        saveEditingRecordToSession(
            record
        );
    }
);

    editLink.className =
        "bas-button";

    editLink.textContent =
        "記録を訂正する";

    actions.appendChild(editLink);
    article.appendChild(actions);
}

return article;
}

function createRecordDetail(record) {
    const detail =
        document.createElement(
            "div"
        );

    detail.className =
        "bas-match-record__detail";

    const category =
        normalizeText(
            record.category
        );

    const isIndoor =
        category === "indoor18m";

    const firstHalfEnds =
        isIndoor
            ? 5
            : 6;

    const secondHalfEnds =
        isIndoor
            ? 5
            : 6;

    const firstSection =
        createHalfDetail({
            title: isIndoor
                ? "前半 18m"
                : getFirstHalfTitle(
                    category
                ),

            startEnd: 1,

            endCount:
                firstHalfEnds,

            total:
                toNumber(
                    record.firstHalfTotal
                ),

            count1Label:
                normalizeText(
                    record.count1Label
                ) || (
                    isIndoor
                        ? "10"
                        : "X"
                ),

            count2Label:
                normalizeText(
                    record.count2Label
                ) || (
                    isIndoor
                        ? "9"
                        : "10"
                ),

            count1:
                toNumber(
                    record.firstCount1
                ),

            count2:
                toNumber(
                    record.firstCount2
                ),

            record:
                record
        });

    const secondSection =
        createHalfDetail({
            title: isIndoor
                ? "後半 18m"
                : getSecondHalfTitle(
                    category
                ),

            startEnd:
                firstHalfEnds + 1,

            endCount:
                secondHalfEnds,

            total:
                toNumber(
                    record.secondHalfTotal
                ),

            count1Label:
                normalizeText(
                    record.count1Label
                ) || (
                    isIndoor
                        ? "10"
                        : "X"
                ),

            count2Label:
                normalizeText(
                    record.count2Label
                ) || (
                    isIndoor
                        ? "9"
                        : "10"
                ),

            count1:
                toNumber(
                    record.secondCount1
                ),

            count2:
                toNumber(
                    record.secondCount2
                ),

            record:
                record
        });

    detail.appendChild(
        firstSection
    );

    detail.appendChild(
        secondSection
    );

    return detail;
}

function createHalfDetail(options) {
    const section =
        document.createElement(
            "section"
        );

    section.className =
        "bas-match-record__half";

    const title =
        document.createElement(
            "h4"
        );

    title.className =
        "bas-match-record__half-title";

    title.textContent =
        options.title;

    section.appendChild(title);

    const endGrid =
        document.createElement(
            "div"
        );

    endGrid.className =
        "bas-match-record__ends";

    for (
        let index = 0;
        index < options.endCount;
        index += 1
    ) {
        const internalEndNumber =
            options.startEnd +
            index;

        const displayEndNumber =
            index + 1;

        const endItem =
            document.createElement(
                "p"
            );

        endItem.className =
            "bas-match-record__end";

        const endLabel =
            document.createElement(
                "span"
            );

        endLabel.textContent =
            String(
                displayEndNumber
            );

        const endScore =
            document.createElement(
                "strong"
            );

        endScore.textContent =
            String(
                toNumber(
                    options.record[
                        `e${internalEndNumber}`
                    ]
                )
            );

        endItem.appendChild(
            endLabel
        );

        endItem.appendChild(
            endScore
        );

        endGrid.appendChild(
            endItem
        );
    }

    section.appendChild(
        endGrid
    );

    const summary =
        document.createElement(
            "div"
        );

    summary.className =
        "bas-match-record__half-summary";

    summary.appendChild(
        createCompactSummaryItem(
            "合計",
            options.total,
            "点"
        )
    );

    summary.appendChild(
        createCompactSummaryItem(
            options.count1Label,
            options.count1,
            ""
        )
    );

    summary.appendChild(
        createCompactSummaryItem(
            options.count2Label,
            options.count2,
            ""
        )
    );

    section.appendChild(
        summary
    );

    return section;
}

function createCompactSummaryItem(
    label,
    value,
    suffix
) {
    const item =
        document.createElement(
            "p"
        );

    item.className =
        "bas-match-record__compact-summary";

    const labelElement =
        document.createElement(
            "span"
        );

    labelElement.textContent =
        label;

    const valueElement =
        document.createElement(
            "strong"
        );

    valueElement.textContent =
        `${value}${suffix}`;

    item.appendChild(
        labelElement
    );

    item.appendChild(
        valueElement
    );

    return item;
}

function getFirstHalfTitle(category) {
    switch (category) {
        case "70m":
            return "前半 70m";

        case "60m":
            return "前半 60m";

        case "50m":
            return "前半 50m";

        case "30m":
            return "前半 30m";

        case "50m30m":
            return "前半 50m";

        default:
            return "前半";
    }
}

function getSecondHalfTitle(category) {
    switch (category) {
        case "70m":
            return "後半 70m";

        case "60m":
            return "後半 60m";

        case "50m":
            return "後半 50m";

        case "30m":
            return "後半 30m";

        case "50m30m":
            return "後半 30m";

        default:
            return "後半";
    }
}

    function createBadge(text) {
        const badge =
            document.createElement(
                "span"
            );

        badge.className =
            "bas-match-record__badge";

        badge.textContent =
            String(text || "");

        return badge;
    }

    function createScoreItem(
        label,
        value,
        suffix
    ) {
        const item =
            document.createElement(
                "p"
            );

        item.className =
            "bas-match-record__score-item";

        const labelText =
            document.createTextNode(
                label
            );

        const strong =
            document.createElement(
                "strong"
            );

        strong.textContent =
            `${value}${suffix}`;

        item.appendChild(labelText);
        item.appendChild(strong);

        return item;
    }

    function showLoading() {
        const status =
            document.getElementById(
                "matchRecordsStatus"
            );

        const list =
            document.getElementById(
                "matchRecordsList"
            );

        const empty =
            document.getElementById(
                "matchRecordsEmpty"
            );

        const count =
            document.getElementById(
                "matchRecordCount"
            );

        if (status) {
            status.textContent =
                "大会記録を読み込んでいます。";

            status.hidden = false;
        }

        if (list) {
            list.hidden = true;
        }

        if (empty) {
            empty.hidden = true;
        }

        if (count) {
            count.textContent = "0件";
        }
    }

    function showError(message) {
        const status =
            document.getElementById(
                "matchRecordsStatus"
            );

        const list =
            document.getElementById(
                "matchRecordsList"
            );

        const empty =
            document.getElementById(
                "matchRecordsEmpty"
            );

        if (status) {
            status.textContent =
                String(message || "");

            status.hidden = false;
        }

        if (list) {
            list.hidden = true;
        }

        if (empty) {
            empty.hidden = true;
        }
    }

/**
 * 訂正する大会記録を、
 * 次の画面で即座に使えるよう一時保存する。
 */
function saveEditingRecordToSession(
    record
) {
    if (
        !record ||
        typeof record !== "object"
    ) {
        return;
    }

    try {
        window.sessionStorage.setItem(
            "baika-editing-match-record",
            JSON.stringify(record)
        );
    } catch (error) {
        console.warn(
            "[大会記録一覧] " +
            "訂正データを一時保存できませんでした。",
            error
        );
    }
}

function normalizeResultUrlForDisplay(
    value
) {
    const url =
        normalizeText(value);

    if (
        url.startsWith("https://") ||
        url.startsWith("http://")
    ) {
        return url;
    }

    return "";
}

    function normalizeText(value) {
        return String(
            value == null
                ? ""
                : value
        ).trim();
    }

    function toNumber(value) {
        const number =
            Number(value || 0);

        return Number.isFinite(number)
            ? number
            : 0;
    }

    function formatDate(value) {
        const text =
            normalizeText(value);

        if (!text) {
            return "開催日未設定";
        }

        const parts =
            text.split("-");

        if (parts.length !== 3) {
            return text;
        }

        return (
            `${Number(parts[0])}/` +
            `${Number(parts[1])}/` +
            `${Number(parts[2])}`
        );
    }

    window.BAS_MATCH_RECORDS = {
        initialize: initialize
    };
})();