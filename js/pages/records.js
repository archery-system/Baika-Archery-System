/**
 * Baika Archery System
 * Project Zero
 * Records Page
 */

(function () {
    "use strict";

    const PRACTICE_RECORDS_CACHE_PREFIX =
        "baika-practice-records-cache-";

    const PRACTICE_RECORDS_CACHE_MAX_AGE =
        5 * 60 * 1000;

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
     * 練習記録キャッシュのキーを取得する
     */
    function getPracticeRecordsCacheKey(
        memberId
    ) {
        return (
            PRACTICE_RECORDS_CACHE_PREFIX +
            String(memberId || "").trim()
        );
    }


    /**
     * 練習記録をキャッシュへ保存する
     */
    function savePracticeRecordsCache(
        memberId,
        records
    ) {
        if (!Array.isArray(records)) {
            return;
        }

        try {
            const cacheData = {
                savedAt: Date.now(),
                records: records
            };

            window.sessionStorage.setItem(
                getPracticeRecordsCacheKey(
                    memberId
                ),
                JSON.stringify(cacheData)
            );
        } catch (error) {
            console.warn(
                "[練習記録] " +
                "一覧キャッシュを保存できませんでした。",
                error
            );
        }
    }


    /**
     * 練習記録キャッシュを読み込む
     */
    function loadPracticeRecordsCache(
        memberId
    ) {
        try {
            const raw =
                window.sessionStorage.getItem(
                    getPracticeRecordsCacheKey(
                        memberId
                    )
                );

            if (!raw) {
                return null;
            }

            const cacheData =
                JSON.parse(raw);

            if (
                !cacheData ||
                !Array.isArray(
                    cacheData.records
                )
            ) {
                return null;
            }

            const savedAt =
                Number(cacheData.savedAt);

            if (
                !Number.isFinite(savedAt) ||
                Date.now() - savedAt >
                PRACTICE_RECORDS_CACHE_MAX_AGE
            ) {
                return null;
            }

            return cacheData.records;
        } catch (error) {
            console.warn(
                "[練習記録] " +
                "一覧キャッシュを読み込めませんでした。",
                error
            );

            return null;
        }
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

        try {
            const members =
                await loadMembers();

            renderMemberSelect(
                members,
                memberData.memberId
            );

            bindMemberSelectChange();
        } catch (error) {
            console.error(
                "[記録] 部員一覧の取得に失敗しました。",
                error
            );
        }

        initializeTabs();

        initializeGroupingComparison();

        /*
         * 前回取得した練習記録があれば、
         * クラウド通信を待たずに先に表示する。
         */
        const cachedRecords =
            loadPracticeRecordsCache(
                memberData.memberId
            );

        if (cachedRecords) {
            const cachedMemberRecords =
                filterMemberRecords(
                    cachedRecords,
                    memberData
                );

            const cachedSortedRecords =
                sortRecordsByDate(
                    cachedMemberRecords
                );

            renderRecords(
                cachedSortedRecords,
                memberData
            );
        } else {
            showLoading();
        }

        /*
         * キャッシュ表示後、
         * 最新データをクラウドから取得する。
         */
        loadAndRenderRecords(
            memberData,
            Boolean(cachedRecords)
        );

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
     * GASから部員一覧を取得する
     *
     * @returns {Promise<Array>}
     */
    async function loadMembers() {
        if (
            typeof V4_GAS_API_URL !== "string" ||
            V4_GAS_API_URL.trim() === ""
        ) {
            throw new Error(
                "GAS API URLが設定されていません。"
            );
        }

        const separator =
            V4_GAS_API_URL.includes("?")
                ? "&"
                : "?";

        const requestUrl =
            `${V4_GAS_API_URL}${separator}action=getMembers`;

        const response =
            await fetch(
                requestUrl,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                "部員一覧の取得に失敗しました。"
            );
        }

        const result =
            await response.json();

        if (
            !result ||
            result.success !== true ||
            !Array.isArray(result.members)
        ) {
            throw new Error(
                result && result.message
                    ? result.message
                    : "部員一覧の応答形式が正しくありません。"
            );
        }

        return result.members;
    }

    /**
     * 記録閲覧用の部員選択欄を更新する
     *
     * ログイン画面と同じルールで、
     * active=true かつ sortOrder が設定された部員だけを
     * sortOrder 昇順で表示する。
     */
    function renderMemberSelect(
        members,
        selectedMemberId
    ) {
        const select =
            document.getElementById(
                "recordsMemberSelect"
            );

        if (!select) {
            return;
        }

        select.innerHTML = "";

        const visibleMembers =
            Array.isArray(members)
                ? members
                    .filter(function (member) {
                        if (
                            !member ||
                            typeof member !== "object" ||
                            member.active === false
                        ) {
                            return false;
                        }

                        const sortOrderRaw =
                            member.sortOrder;

                        if (
                            sortOrderRaw === null ||
                            sortOrderRaw === undefined ||
                            String(sortOrderRaw).trim() === ""
                        ) {
                            return false;
                        }

                        const sortOrder =
                            Number(sortOrderRaw);

                        return (
                            Number.isInteger(sortOrder) &&
                            sortOrder >= 1
                        );
                    })
                    .sort(function (a, b) {
                        return (
                            Number(a.sortOrder) -
                            Number(b.sortOrder)
                        );
                    })
                : [];

        visibleMembers.forEach(
            function (member) {
                const memberId =
                    String(
                        member.memberId ||
                        member.name ||
                        member.displayName ||
                        ""
                    ).trim();

                const displayName =
                    String(
                        member.displayName ||
                        member.name ||
                        memberId
                    ).trim();

                if (!memberId || !displayName) {
                    return;
                }

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    memberId;

                option.textContent =
                    displayName;

                select.appendChild(
                    option
                );
            }
        );

        if (selectedMemberId) {
            select.value =
                String(
                    selectedMemberId
                );
        }
    }

    /**
 * 部員選択変更時に、
 * 選択した部員の記録を再読み込みする
 */
    function bindMemberSelectChange() {
        const select =
            document.getElementById(
                "recordsMemberSelect"
            );

        if (!select) {
            return;
        }

        select.addEventListener(
            "change",
            async function () {
                const selectedMemberId =
                    String(
                        select.value || ""
                    ).trim();

                if (!selectedMemberId) {
                    return;
                }

                const selectedOption =
                    select.options[
                    select.selectedIndex
                    ];

                const selectedMemberName =
                    selectedOption
                        ? selectedOption.textContent.trim()
                        : "";

                const targetMemberData = {
                    memberId:
                        selectedMemberId,

                    memberName:
                        selectedMemberName
                };

                showUserName(
                    selectedMemberName
                );

                await loadAndRenderRecords(
                    targetMemberData,
                    false
                );

                await loadGroupingRecords(
                    targetMemberData
                );
            }
        );
    }

    /**
     * GASから記録を取得して表示する
     */
    async function loadAndRenderRecords(
        memberData,
        hasRenderedCache
    ) {
        if (!hasRenderedCache) {
            showLoading();
        }

        if (
            !window.BAS_CLOUD ||
            typeof window.BAS_CLOUD.loadPracticeRecords !==
            "function"
        ) {
            console.error(
                "[練習記録] BAS_CLOUD.loadPracticeRecordsを読み込めません。"
            );

            if (!hasRenderedCache) {
                showError(
                    "練習記録の読込機能を確認できませんでした。"
                );
            }

            return;
        }

        try {
            const allRecords =
                await window.BAS_CLOUD
                    .loadPracticeRecords();

            savePracticeRecordsCache(
                memberData.memberId,
                allRecords
            );

            const memberRecords =
                filterMemberRecords(
                    allRecords,
                    memberData
                );

            const sortedRecords =
                sortRecordsByDate(
                    memberRecords
                );

            renderRecords(
                sortedRecords,
                memberData
            );
        } catch (error) {
            console.error(
                "[練習記録] 記録の取得に失敗しました。",
                error
            );

            /*
             * キャッシュを表示できている場合は、
             * 通信エラーでも表示中の記録を消さない。
             */
            if (!hasRenderedCache) {
                showError(
                    "練習記録を読み込めませんでした。通信環境またはGAS設定を確認してください。"
                );
            }
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
 * 6射単位の練習記録を、
 * 同じ日付・同じ距離ごとの点取り記録へまとめる
 */
    function groupPracticeRecords(records) {
        const groups = new Map();

        records
            .slice()
            .reverse()
            .forEach(function (record) {
                const date =
                    normalizeDateValue(record.date);

                const distance =
                    String(
                        record.distance || ""
                    ).trim();

                const key =
                    `${date}__${distance}`;

                if (!groups.has(key)) {
                    groups.set(
                        key,
                        {
                            date: date,
                            distance: distance,
                            ends: []
                        }
                    );
                }

                groups.get(key).ends.push(record);
            });

        return Array.from(groups.values())
            .sort(function (a, b) {
                return (
                    getDateTimestamp(b.date) -
                    getDateTimestamp(a.date)
                );
            });
    }


    /**
     * 1エンドの6射を配列で取得する
     */
    function getEndScoreLabels(record) {
        return [
            record.a1,
            record.a2,
            record.a3,
            record.a4,
            record.a5,
            record.a6
        ].map(function (value) {
            return String(
                value == null ? "" : value
            )
                .trim()
                .toUpperCase();
        });
    }


    /**
     * 点数ラベルを数値へ変換する
     */
    function getScoreNumber(label) {
        if (
            label === "X" ||
            label === "10"
        ) {
            return 10;
        }

        if (label === "M" || !label) {
            return 0;
        }

        const score = Number(label);

        return Number.isFinite(score)
            ? score
            : 0;
    }


    /**
     * 複数エンドの集計を作る
     */
    function calculatePracticeSummary(ends) {
        const labels = [];

        ends.forEach(function (record) {
            labels.push(
                ...getEndScoreLabels(record)
            );
        });

        const total =
            labels.reduce(
                function (sum, label) {
                    return (
                        sum +
                        getScoreNumber(label)
                    );
                },
                0
            );

        const tenCount =
            labels.filter(function (label) {
                return label === "10";
            }).length;

        const xCount =
            labels.filter(function (label) {
                return label === "X";
            }).length;

        return {
            arrowCount: labels.length,
            total: total,
            tenCount: tenCount,
            xCount: xCount,
            average:
                labels.length > 0
                    ? total / labels.length
                    : 0
        };
    }


    /**
     * 点取り1件の前半・後半・総計を集計する
     */
    function buildPracticeSessionSummary(group) {
        const firstHalfEnds =
            group.ends.slice(0, 6);

        const secondHalfEnds =
            group.ends.slice(6, 12);

        return {
            date: group.date,
            distance: group.distance,
            ends: group.ends,

            firstHalf:
                calculatePracticeSummary(
                    firstHalfEnds
                ),

            secondHalf:
                calculatePracticeSummary(
                    secondHalfEnds
                ),

            total:
                calculatePracticeSummary(
                    group.ends
                )
        };
    }

    /**
     * 記録一覧を表示する
     */
    function renderRecords(
        records,
        memberData
    ) {
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

        if (records.length === 0) {
            updateRecordCount(0);
            showEmpty();
            return;
        }

        const groupedRecords =
            groupPracticeRecords(records);

        const sessions =
            groupedRecords.map(function (group) {
                return buildPracticeSessionSummary(group);
            });

        updateRecordCount(sessions.length);

        const fragment =
            document.createDocumentFragment();

        sessions.forEach(function (
            session,
            index
        ) {
            fragment.appendChild(
                createPracticeSessionCard(
                    session,
                    index,
                    memberData
                )
            );
        });

        recordsList.appendChild(fragment);

        showList();
    }


    /**
     * 記録カードを作成する
     */

    function createPracticeSessionCard(
        session,
        index,
        memberData
    ) {
        const article =
            document.createElement("article");

        article.className =
            "bas-match-record";

        article.dataset.sessionIndex =
            String(index);

        /*
         * 上段：日付と距離
         */
        const top =
            document.createElement("div");

        top.className =
            "bas-match-record__top";

        const title =
            document.createElement("h3");

        title.className =
            "bas-match-record__title";

        title.textContent =
            formatDisplayDate(
                session.date
            );

        const date =
            document.createElement("span");

        date.className =
            "bas-match-record__date";

        date.textContent =
            formatDistance(
                session.distance
            );

        top.appendChild(title);
        top.appendChild(date);

        /*
         * 基本情報
         */
        const meta =
            document.createElement("div");

        meta.className =
            "bas-match-record__meta";

        const arrowBadge =
            document.createElement("span");

        arrowBadge.className =
            "bas-match-record__badge";

        arrowBadge.textContent =
            `${session.total.arrowCount}射`;

        meta.appendChild(arrowBadge);

        /*
         * 総合計・総10数・総X数
         */
        const score =
            document.createElement("div");

        score.className =
            "bas-match-record__score";

        score.appendChild(
            createPracticeScoreItem(
                "合計",
                session.total.total,
                "点"
            )
        );

        score.appendChild(
            createPracticeScoreItem(
                "総10数",
                session.total.tenCount,
                ""
            )
        );

        score.appendChild(
            createPracticeScoreItem(
                "総X数",
                session.total.xCount,
                ""
            )
        );

        /*
         * 前半・後半の集計
         */
        const halfSummary =
            document.createElement("div");

        halfSummary.className =
            "bas-records__practice-halves";

        halfSummary.appendChild(
            createPracticeHalfSummary(
                "前半",
                session.firstHalf
            )
        );

        halfSummary.appendChild(
            createPracticeHalfSummary(
                "後半",
                session.secondHalf
            )
        );

        /*
         * 平均
         */
        const average =
            document.createElement("p");

        average.className =
            "bas-records__practice-average";

        average.textContent =
            `1射平均 ${session.total.average.toFixed(2)}点`;

        /*
         * 詳細ボタン
         */
        const actions =
            document.createElement("div");

        actions.className =
            "bas-match-record__actions";

        const detailButton =
            document.createElement("button");

        detailButton.type =
            "button";

        detailButton.className =
            "bas-button bas-button--secondary";

        detailButton.textContent =
            "詳細を見る";

        detailButton.dataset.practiceDetailIndex =
            String(index);

        actions.appendChild(
            detailButton
        );

        /*
         * 練習記録削除ボタン
         *
         * このカードに含まれる6射記録を
         * recordId単位で削除する。
         */
        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.className =
            "bas-button";

        deleteButton.textContent =
            "🗑 削除";

        deleteButton.addEventListener(
            "click",
            async function () {
                const recordsToDelete =
                    Array.isArray(session.ends)
                        ? session.ends
                        : [];

                const recordIds =
                    recordsToDelete
                        .map(function (record) {
                            return String(
                                record &&
                                record.recordId ||
                                ""
                            ).trim();
                        });

                /*
                 * 旧形式の記録が含まれる場合は
                 * 部分削除を防ぐ。
                 */
                if (
                    recordIds.length === 0 ||
                    recordIds.some(function (recordId) {
                        return !recordId;
                    })
                ) {
                    window.alert(
                        "この練習記録は旧形式のため、"
                        + "この画面から削除できません。"
                    );

                    return;
                }

                const confirmed =
                    window.confirm(
                        [
                            "この練習記録を削除しますか？",
                            "",
                            `日付：${formatDisplayDate(session.date)}`,
                            `距離：${formatDistance(session.distance)}`,
                            `射数：${session.total.arrowCount}射`,
                            `合計：${session.total.total}点`,
                            "",
                            "この操作は元に戻せません。"
                        ].join("\n")
                    );

                if (!confirmed) {
                    return;
                }

                const memberData =
                    getLoggedInMemberData();

                if (
                    !memberData ||
                    !memberData.memberId
                ) {
                    window.alert(
                        "ログイン中の部員を確認できません。"
                    );

                    return;
                }

                const password =
                    window.prompt(
                        "本人確認のため、現在のパスワードを入力してください。"
                    );

                if (password === null) {
                    return;
                }

                if (!password) {
                    window.alert(
                        "パスワードを入力してください。"
                    );

                    return;
                }

                if (
                    !window.BAS_CLOUD ||
                    typeof window.BAS_CLOUD
                        .deletePracticeRecord !==
                    "function"
                ) {
                    window.alert(
                        "練習記録の削除機能を読み込めませんでした。"
                    );

                    return;
                }

                deleteButton.disabled =
                    true;

                deleteButton.textContent =
                    "削除中…";

                try {
                    /*
                     * 1エンドずつ安全に削除する。
                     */
                    for (
                        const recordId of recordIds
                    ) {
                        await window.BAS_CLOUD
                            .deletePracticeRecord(
                                recordId,
                                memberData.memberId,
                                password
                            );
                    }

                    window.alert(
                        "練習記録を削除しました。"
                    );

                    /*
                     * クラウドから最新状態を再取得する。
                     */
                    await loadAndRenderRecords(
                        memberData,
                        false
                    );
                } catch (error) {
                    deleteButton.disabled =
                        false;

                    deleteButton.textContent =
                        "🗑 削除";

                    window.alert(
                        error instanceof Error
                            ? error.message
                            : "練習記録を削除できませんでした。"
                    );
                }
            }
        );

        const loggedInMemberData =
            getLoggedInMemberData();

        const isOwnRecordView =
            loggedInMemberData &&
            memberData &&
            String(
                loggedInMemberData.memberId || ""
            ).trim() ===
            String(
                memberData.memberId || ""
            ).trim();

        if (isOwnRecordView) {
            actions.appendChild(
                deleteButton
            );
        }

        const detail =
            document.createElement("div");

        detail.className =
            "bas-records__practice-detail";

        detail.hidden = true;

        session.ends.forEach(function (
            record,
            endIndex
        ) {
            const endCard =
                createRecordCard(
                    record,
                    endIndex,
                    memberData
                );

            detail.appendChild(endCard);
        });

        detailButton.addEventListener(
            "click",
            function () {
                detail.hidden =
                    !detail.hidden;

                detailButton.textContent =
                    detail.hidden
                        ? "詳細を見る"
                        : "詳細を閉じる";
            }
        );

        article.appendChild(top);
        article.appendChild(meta);
        article.appendChild(score);
        article.appendChild(halfSummary);
        article.appendChild(average);
        article.appendChild(actions);
        article.appendChild(detail);

        return article;
    }


    /**
     * 大会記録と同じ形式の
     * スコア表示を作成する
     */
    function createPracticeScoreItem(
        labelText,
        valueText,
        unitText
    ) {
        const item =
            document.createElement("p");

        item.className =
            "bas-match-record__score-item";

        const label =
            document.createElement("span");

        label.textContent =
            labelText;

        const value =
            document.createElement("strong");

        value.textContent =
            String(valueText);

        const unit =
            document.createElement("span");

        unit.textContent =
            unitText;

        item.appendChild(label);
        item.appendChild(value);

        if (unitText) {
            item.appendChild(unit);
        }

        return item;
    }


    /**
     * 前半・後半の集計表示を作成する
     */
    function createPracticeHalfSummary(
        titleText,
        summary
    ) {
        const section =
            document.createElement("div");

        section.className =
            "bas-records__practice-half";

        const title =
            document.createElement("strong");

        title.className =
            "bas-records__practice-half-title";

        title.textContent =
            titleText;

        const score =
            document.createElement("span");

        score.innerHTML =
            `得点 <strong>${summary.total}</strong>`;

        const ten =
            document.createElement("span");

        ten.innerHTML =
            `10数 <strong>${summary.tenCount}</strong>`;

        const x =
            document.createElement("span");

        x.innerHTML =
            `X数 <strong>${summary.xCount}</strong>`;

        section.appendChild(title);
        section.appendChild(score);
        section.appendChild(ten);
        section.appendChild(x);

        return section;
    }

    function createRecordCard(
        record,
        index,
        memberData
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

        /*
         * 1エンド削除ボタン
         */
        const deleteEndActions =
            document.createElement("div");

        deleteEndActions.className =
            "bas-match-record__actions";

        const deleteEndButton =
            document.createElement("button");

        deleteEndButton.type =
            "button";

        deleteEndButton.className =
            "bas-button";

        deleteEndButton.textContent =
            "🗑 この1エンドを削除";

        deleteEndButton.addEventListener(
            "click",
            async function () {
                const recordId =
                    String(
                        record &&
                        record.recordId ||
                        ""
                    ).trim();

                if (!recordId) {
                    window.alert(
                        "この1エンドは旧形式のため削除できません。"
                    );

                    return;
                }

                const confirmed =
                    window.confirm(
                        [
                            "この1エンドだけを削除しますか？",
                            "",
                            `日付：${formatDisplayDate(record.date)}`,
                            `距離：${formatDistance(record.distance)}`,
                            `6射：${getArrowValues(record).join("・")}`,
                            "",
                            "この操作は元に戻せません。"
                        ].join("\n")
                    );

                if (!confirmed) {
                    return;
                }

                const memberData =
                    getLoggedInMemberData();

                if (
                    !memberData ||
                    !memberData.memberId
                ) {
                    window.alert(
                        "ログイン中の部員を確認できません。"
                    );

                    return;
                }

                const password =
                    window.prompt(
                        "本人確認のため、現在のパスワードを入力してください。"
                    );

                if (password === null) {
                    return;
                }

                if (!password) {
                    window.alert(
                        "パスワードを入力してください。"
                    );

                    return;
                }

                if (
                    !window.BAS_CLOUD ||
                    typeof window.BAS_CLOUD
                        .deletePracticeRecord !==
                    "function"
                ) {
                    window.alert(
                        "練習記録の削除機能を読み込めませんでした。"
                    );

                    return;
                }

                deleteEndButton.disabled =
                    true;

                deleteEndButton.textContent =
                    "削除中…";

                try {
                    await window.BAS_CLOUD
                        .deletePracticeRecord(
                            recordId,
                            memberData.memberId,
                            password
                        );

                    window.alert(
                        "1エンドを削除しました。"
                    );

                    await loadAndRenderRecords(
                        memberData,
                        false
                    );
                } catch (error) {
                    deleteEndButton.disabled =
                        false;

                    deleteEndButton.textContent =
                        "🗑 この1エンドを削除";

                    window.alert(
                        error instanceof Error
                            ? error.message
                            : "1エンドを削除できませんでした。"
                    );
                }
            }
        );

        const loggedInMemberData =
            getLoggedInMemberData();

        const isOwnRecordView =
            loggedInMemberData &&
            memberData &&
            String(
                loggedInMemberData.memberId || ""
            ).trim() ===
            String(
                memberData.memberId || ""
            ).trim();

        if (isOwnRecordView) {
            deleteEndActions.appendChild(
                deleteEndButton
            );
        }

        article.appendChild(header);
        article.appendChild(arrows);
        article.appendChild(total);
        article.appendChild(deleteEndActions);

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

    async function loadGroupingRecords(
        memberData
    ) {

        if (
            !window.BAS_CLOUD ||
            typeof window.BAS_CLOUD.loadGroupingRecords
            !== "function"
        ) {
            console.error(
                "[グルーピング記録] 読込機能を利用できません。"
            );

            return;
        }

        const targetMemberData =
            memberData &&
                typeof memberData === "object"
                ? memberData
                : getLoggedInMemberData();

        const memberId =
            String(
                targetMemberData.memberId || ""
            ).trim();

        if (!memberId) {
            return;
        }

        try {
            const allRecords =
                await window.BAS_CLOUD
                    .loadGroupingRecords();

            const memberRecords =
                Array.isArray(allRecords)
                    ? allRecords.filter(
                        function (record) {
                            return (
                                String(
                                    record &&
                                    record.memberId ||
                                    ""
                                ).trim() ===
                                memberId
                            );
                        }
                    )
                    : [];

            renderGroupingRecords(
                memberRecords
            );

        } catch (error) {
            console.error(
                "[グルーピング記録] 記録の取得に失敗しました。",
                error
            );

            renderGroupingRecords([]);
        }
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
            .forEach(function (record, index) {

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