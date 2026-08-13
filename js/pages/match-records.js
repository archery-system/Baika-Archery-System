/**
 * Baika Archery System
 * Project Zero
 * 大会記録一覧
 */

(function () {
    "use strict";

    let currentVisibleRecords = [];

    const MATCH_RECORDS_CACHE_KEY =
        "baika-match-records-cache";

    const MATCH_RECORDS_CACHE_MAX_AGE =
        5 * 60 * 1000;

    async function initialize() {
        initializeMatchRecordFilters();

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
        currentVisibleRecords =
            filterVisibleRecords(
                allRecords
            );

        populateMatchRecordFilters(
            currentVisibleRecords
        );

        applyMatchRecordFilters();
    }

    /**
 * 大会記録検索を初期化する
 */
    function initializeMatchRecordFilters() {
        const ids = [
            "matchRecordScopeFilter",
            "matchRecordMemberFilter",
            "matchRecordCategoryFilter",
            "matchRecordYearFilter",
            "matchRecordVisibilityFilter",
            "matchRecordSortFilter"
        ];

        ids.forEach(function (id) {
            const element =
                document.getElementById(id);

            if (!element) {
                return;
            }

            element.addEventListener(
                "change",
                function () {
                    updateMemberFilterState();
                    applyMatchRecordFilters();
                }
            );
        });

        const nameSearch =
            document.getElementById(
                "matchRecordNameSearch"
            );

        if (nameSearch) {
            nameSearch.addEventListener(
                "input",
                applyMatchRecordFilters
            );
        }

        const resetButton =
            document.getElementById(
                "resetMatchRecordFilters"
            );

        if (resetButton) {
            resetButton.addEventListener(
                "click",
                resetMatchRecordFilters
            );
        }

        updateMemberFilterState();
    }


    /**
     * 検索条件用の選択肢を作る
     */
    function populateMatchRecordFilters(
        records
    ) {
        populateMemberFilter(records);
        populateCategoryFilter(records);
        populateYearFilter(records);
    }


    /**
     * 部員選択肢を作る
     */
    function populateMemberFilter(records) {
        const select =
            document.getElementById(
                "matchRecordMemberFilter"
            );

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        const members =
            new Map();

        records.forEach(function (record) {
            const memberId =
                normalizeText(
                    record.memberId
                );

            const memberName =
                normalizeText(
                    record.memberName
                );

            if (!memberId) {
                return;
            }

            members.set(
                memberId,
                memberName || memberId
            );
        });

        select.replaceChildren();

        select.appendChild(
            createFilterOption(
                "",
                "すべての部員"
            )
        );

        Array.from(
            members.entries()
        )
            .sort(function (a, b) {
                return a[1].localeCompare(
                    b[1],
                    "ja"
                );
            })
            .forEach(function (entry) {
                select.appendChild(
                    createFilterOption(
                        entry[0],
                        entry[1]
                    )
                );
            });

        if (
            Array.from(
                select.options
            ).some(function (option) {
                return (
                    option.value ===
                    currentValue
                );
            })
        ) {
            select.value =
                currentValue;
        }
    }


    /**
     * 種目選択肢を作る
     */
    function populateCategoryFilter(records) {
        const select =
            document.getElementById(
                "matchRecordCategoryFilter"
            );

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        const categories =
            new Map();

        records.forEach(function (record) {
            const category =
                normalizeText(
                    record.category
                );

            if (!category) {
                return;
            }

            const label =
                normalizeText(
                    record.categoryLabel
                ) ||
                category;

            categories.set(
                category,
                label
            );
        });

        select.replaceChildren();

        select.appendChild(
            createFilterOption(
                "",
                "すべての種目"
            )
        );

        Array.from(
            categories.entries()
        ).forEach(function (entry) {
            select.appendChild(
                createFilterOption(
                    entry[0],
                    entry[1]
                )
            );
        });

        if (
            Array.from(
                select.options
            ).some(function (option) {
                return (
                    option.value ===
                    currentValue
                );
            })
        ) {
            select.value =
                currentValue;
        }
    }


    /**
     * 年度選択肢を作る
     */
    function populateYearFilter(records) {
        const select =
            document.getElementById(
                "matchRecordYearFilter"
            );

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        const years =
            new Set();

        records.forEach(function (record) {
            const fiscalYear =
                getMatchFiscalYear(
                    record.matchDate
                );

            if (fiscalYear) {
                years.add(fiscalYear);
            }
        });

        select.replaceChildren();

        select.appendChild(
            createFilterOption(
                "",
                "すべての年度"
            )
        );

        Array.from(years)
            .sort(function (a, b) {
                return b - a;
            })
            .forEach(function (year) {
                select.appendChild(
                    createFilterOption(
                        String(year),
                        `${year}年度`
                    )
                );
            });

        if (
            Array.from(
                select.options
            ).some(function (option) {
                return (
                    option.value ===
                    currentValue
                );
            })
        ) {
            select.value =
                currentValue;
        }
    }


    /**
     * option要素を作る
     */
    function createFilterOption(
        value,
        label
    ) {
        const option =
            document.createElement(
                "option"
            );

        option.value =
            value;

        option.textContent =
            label;

        return option;
    }


    /**
     * 4月始まりの年度を取得する
     */
    function getMatchFiscalYear(
        dateValue
    ) {
        const text =
            normalizeText(dateValue);

        const match =
            text.match(
                /^(\d{4})-(\d{1,2})/
            );

        if (!match) {
            return 0;
        }

        const year =
            Number(match[1]);

        const month =
            Number(match[2]);

        if (
            !Number.isFinite(year) ||
            !Number.isFinite(month)
        ) {
            return 0;
        }

        return month >= 4
            ? year
            : year - 1;
    }


    /**
     * 検索条件を適用する
     */
    function applyMatchRecordFilters() {
        const scope =
            getFilterValue(
                "matchRecordScopeFilter"
            );

        const memberId =
            getFilterValue(
                "matchRecordMemberFilter"
            );

        const category =
            getFilterValue(
                "matchRecordCategoryFilter"
            );

        const fiscalYear =
            getFilterValue(
                "matchRecordYearFilter"
            );

        const visibility =
            getFilterValue(
                "matchRecordVisibilityFilter"
            );

        const sortMode =
            getFilterValue(
                "matchRecordSortFilter"
            ) ||
            "newest";

        const nameQuery =
            normalizeText(
                getFilterValue(
                    "matchRecordNameSearch"
                )
            ).toLowerCase();

        const loginMemberId =
            getLoggedInMatchMemberId();

        const filtered =
            currentVisibleRecords.filter(
                function (record) {

                    if (
                        scope === "mine" &&
                        normalizeText(
                            record.memberId
                        ) !== loginMemberId
                    ) {
                        return false;
                    }

                    if (
                        scope === "all" &&
                        memberId &&
                        normalizeText(
                            record.memberId
                        ) !== memberId
                    ) {
                        return false;
                    }

                    if (
                        category &&
                        normalizeText(
                            record.category
                        ) !== category
                    ) {
                        return false;
                    }

                    if (
                        fiscalYear &&
                        String(
                            getMatchFiscalYear(
                                record.matchDate
                            )
                        ) !== fiscalYear
                    ) {
                        return false;
                    }

                    if (
                        visibility &&
                        normalizeText(
                            record.visibility
                        ) !== visibility
                    ) {
                        return false;
                    }

                    if (
                        nameQuery &&
                        !normalizeText(
                            record.matchName
                        )
                            .toLowerCase()
                            .includes(nameQuery)
                    ) {
                        return false;
                    }

                    return true;
                }
            );

        const sorted =
            sortRecords(
                filtered,
                sortMode
            );

        renderRecords(sorted);

        updateMatchRecordSearchCount(
            sorted.length
        );
    }


    /**
     * filterの値を取得する
     */
    function getFilterValue(id) {
        const element =
            document.getElementById(id);

        if (!element) {
            return "";
        }

        return element.value || "";
    }


    /**
     * ログイン中の部員IDを取得する
     */
    function getLoggedInMatchMemberId() {
        if (
            !window.V4Session ||
            typeof window.V4Session
                .getLoggedInMemberData !==
            "function"
        ) {
            return "";
        }

        const data =
            window.V4Session
                .getLoggedInMemberData();

        return normalizeText(
            data && data.memberId
        );
    }


    /**
     * 対象によって部員選択を切り替える
     */
    function updateMemberFilterState() {
        const scope =
            document.getElementById(
                "matchRecordScopeFilter"
            );

        const member =
            document.getElementById(
                "matchRecordMemberFilter"
            );

        if (!scope || !member) {
            return;
        }

        const isMine =
            scope.value === "mine";

        member.disabled =
            isMine;

        if (isMine) {
            member.value = "";
        }
    }


    /**
     * 検索結果件数を表示する
     */
    function updateMatchRecordSearchCount(
        count
    ) {
        const element =
            document.getElementById(
                "matchRecordSearchCount"
            );

        if (!element) {
            return;
        }

        element.textContent =
            `該当 ${count}件`;
    }


    /**
     * 検索条件を初期状態へ戻す
     */
    function resetMatchRecordFilters() {
        const scope =
            document.getElementById(
                "matchRecordScopeFilter"
            );

        const member =
            document.getElementById(
                "matchRecordMemberFilter"
            );

        const category =
            document.getElementById(
                "matchRecordCategoryFilter"
            );

        const year =
            document.getElementById(
                "matchRecordYearFilter"
            );

        const name =
            document.getElementById(
                "matchRecordNameSearch"
            );

        const visibility =
            document.getElementById(
                "matchRecordVisibilityFilter"
            );

        const sort =
            document.getElementById(
                "matchRecordSortFilter"
            );

        if (scope) {
            scope.value = "mine";
        }

        if (member) {
            member.value = "";
        }

        if (category) {
            category.value = "";
        }

        if (year) {
            year.value = "";
        }

        if (name) {
            name.value = "";
        }

        if (visibility) {
            visibility.value = "";
        }

        if (sort) {
            sort.value = "newest";
        }

        updateMemberFilterState();
        applyMatchRecordFilters();
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

    function sortRecords(
        records,
        sortMode
    ) {
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

                    const aScore =
                        Number(a.total) || 0;

                    const bScore =
                        Number(b.total) || 0;

                    if (
                        sortMode ===
                        "score-desc"
                    ) {
                        if (
                            bScore !==
                            aScore
                        ) {
                            return (
                                bScore -
                                aScore
                            );
                        }
                    }

                    if (
                        sortMode ===
                        "score-asc"
                    ) {
                        if (
                            aScore !==
                            bScore
                        ) {
                            return (
                                aScore -
                                bScore
                            );
                        }
                    }

                    if (
                        sortMode ===
                        "oldest"
                    ) {
                        if (
                            aDate !==
                            bDate
                        ) {
                            return aDate
                                .localeCompare(
                                    bDate
                                );
                        }
                    } else {
                        if (
                            aDate !==
                            bDate
                        ) {
                            return bDate
                                .localeCompare(
                                    aDate
                                );
                        }
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

        const venue =
            document.createElement(
                "span"
            );

        venue.className =
            "bas-match-record__venue";

        venue.textContent =
            normalizeText(
                record.venue
            )
                ? "📍 " +
                normalizeText(
                    record.venue
                )
                : "";

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

        if (venue.textContent) {
            top.appendChild(venue);
        }

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
                `総${normalizeText(
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
                `総${normalizeText(
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

        const memo =
            normalizeText(
                record.memo
            );

        if (memo) {
            const memoRow =
                document.createElement(
                    "div"
                );

            memoRow.className =
                "bas-match-record__memo";

            const memoLabel =
                document.createElement(
                    "strong"
                );

            memoLabel.textContent =
                "📝 大会メモ";

            const memoText =
                document.createElement(
                    "p"
                );

            memoText.textContent =
                memo;

            memoRow.appendChild(
                memoLabel
            );

            memoRow.appendChild(
                memoText
            );

            article.appendChild(
                memoRow
            );
        }

        const resultUrl =
            normalizeResultUrlForDisplay(
                record.resultUrl
            );

        const canEdit =
            canEditRecord(record) &&
            normalizeText(
                record.recordId
            );

        if (
            resultUrl ||
            canEdit
        ) {
            const footerRow =
                document.createElement(
                    "div"
                );

            footerRow.className =
                "bas-match-record__footer";

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

                footerRow.appendChild(
                    urlRow
                );
            }

            if (canEdit) {
                const actions =
                    document.createElement(
                        "div"
                    );

                actions.className =
                    "bas-match-record__actions";

                const editLink =
                    document.createElement(
                        "a"
                    );

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

                actions.appendChild(
                    editLink
                );

                footerRow.appendChild(
                    actions
                );
            }

            article.appendChild(
                footerRow
            );
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