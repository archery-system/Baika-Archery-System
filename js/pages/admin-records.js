/**
 * Baika Archery System
 * Project Zero
 * Administrator Records Page
 */


(function () {
    "use strict";

    let allAdminRecords = [];

    const adminCalendarToday =
    new Date();

let adminCalendarYear =
    adminCalendarToday.getFullYear();

let adminCalendarMonth =
    adminCalendarToday.getMonth() + 1;

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdminRecords
    );

    /**
     * 管理者用記録画面を初期化する
     */
    async function initializeAdminRecords() {
        if (
            !window.V4Session ||
            typeof window.V4Session.requireAdmin !== "function" ||
            !window.V4Session.requireAdmin()
        ) {
            return;
        }

        if (
            !window.BAS_CLOUD ||
            typeof window.BAS_CLOUD.loadPracticeRecords !== "function"
        ) {
            showStatus(
                "練習記録の読み込み機能を利用できません。",
                true
            );

            return;
        }

        try {
            const records =
                await window.BAS_CLOUD.loadPracticeRecords();

            const normalizedRecords =
    Array.isArray(records)
        ? records
        : [];

const indexedRecords =
    normalizedRecords.map(
        function (record, sourceIndex) {
            return {
                ...record,
                __sourceIndex: sourceIndex
            };
        }
    );

allAdminRecords =
    sortRecordsByDate(indexedRecords);

/*
 * 一覧を最優先で表示する。
 * 検索バーやカレンダーの準備はその後に行う。
 */
renderRecords(allAdminRecords);
hideStatus();

initializeMemberFilter();
initializeRecordCalendar();

/*
 * 一覧表示後にカレンダーを描画する。
 */
window.requestAnimationFrame(
    function () {
        renderRecordCalendar();
    }
);
        } catch (error) {
            console.error(
                "[管理者記録] 読み込みに失敗しました。",
                error
            );

            showStatus(
                "練習記録を読み込めませんでした。",
                true
            );
        }
    }

    /**
     * 記録を新しい日付順に並べる
     */
    function sortRecordsByDate(records) {
        return records
            .map(function (record, index) {
                return {
                    record,
                    index
                };
            })
            .sort(function (a, b) {
                const dateA =
                    new Date(a.record.date || 0).getTime();

                const dateB =
                    new Date(b.record.date || 0).getTime();

                if (dateA !== dateB) {
                    return dateB - dateA;
                }

                return b.index - a.index;
            })
            .map(function (item) {
                return item.record;
            });
    }

/**
 * 管理者用記録フィルターを準備する
 */
function initializeMemberFilter() {
    const memberFilter =
        document.getElementById(
            "adminRecordMemberFilter"
        );

    const dateFilter =
        document.getElementById(
            "adminRecordDateFilter"
        );

    const dateClearButton =
        document.getElementById(
            "adminRecordDateClearButton"
        );

    const calendarButton =
        document.getElementById(
            "adminRecordCalendarButton"
        );

    const calendarPanel =
        document.getElementById(
            "adminRecordCalendarPanel"
        );

    const distanceFilter =
        document.getElementById(
            "adminRecordDistanceFilter"
        );

    const sortOrder =
        document.getElementById(
            "adminRecordSortOrder"
        );

    if (
        !memberFilter ||
        !dateFilter ||
        !dateClearButton ||
        !calendarButton ||
        !calendarPanel ||
        !distanceFilter ||
        !sortOrder
    ) {
        console.error(
            "[管理者記録] 検索バーの要素を取得できません。"
        );

        return;
    }

    /**
     * 入力条件を記録一覧へ反映する
     */
    function applyFilters() {
        const dateInput =
            String(dateFilter.value || "")
                .trim();

        dateClearButton.hidden =
            dateInput === "";

        const memberKeyword =
            String(memberFilter.value || "")
                .trim()
                .toLowerCase();

        const selectedDate =
            normalizeFilterDateValue(
                dateInput
            );

        const selectedDistance =
            String(distanceFilter.value || "")
                .trim();

        let filteredRecords =
            allAdminRecords.filter(
                function (record) {
                    const memberName =
                        getMemberName(record)
                            .toLowerCase();

                    const recordDate =
                        normalizeDateValue(
                            record.date
                        );

                    const recordDistance =
                        normalizeDistanceValue(
                            record.distance
                        );

                    const matchesMember =
                        !memberKeyword ||
                        memberName.includes(
                            memberKeyword
                        );

                    const matchesDate =
                        !dateInput ||
                        !selectedDate ||
                        recordDate === selectedDate;

                    const matchesDistance =
                        !selectedDistance ||
                        recordDistance ===
                            selectedDistance;

                    return (
                        matchesMember &&
                        matchesDate &&
                        matchesDistance
                    );
                }
            );

        if (sortOrder.value === "oldest") {
            filteredRecords =
                filteredRecords
                    .slice()
                    .reverse();
        }

        renderRecords(filteredRecords);
    }

    memberFilter.addEventListener(
        "input",
        applyFilters
    );

    dateFilter.addEventListener(
        "input",
        applyFilters
    );

    dateClearButton.addEventListener(
        "click",
        function () {
            dateFilter.value = "";
            dateClearButton.hidden = true;

            applyFilters();
            dateFilter.focus();
        }
    );

    distanceFilter.addEventListener(
        "change",
        applyFilters
    );

    sortOrder.addEventListener(
        "change",
        applyFilters
    );

    calendarButton.addEventListener(
        "click",
        function () {
            calendarPanel.hidden =
                !calendarPanel.hidden;

            calendarButton.setAttribute(
                "aria-expanded",
                String(!calendarPanel.hidden)
            );
        }
    );

    applyFilters();
}


/**
 * 記録カレンダーの前月・次月ボタンを準備する
 */
function initializeRecordCalendar() {
    const previousButton =
        document.getElementById(
            "adminRecordCalendarPrevious"
        );

    const nextButton =
        document.getElementById(
            "adminRecordCalendarNext"
        );

    if (!previousButton || !nextButton) {
        console.error(
            "[管理者記録] カレンダー操作ボタンを取得できません。"
        );

        return;
    }

    previousButton.addEventListener(
        "click",
        function () {
            adminCalendarMonth -= 1;

            if (adminCalendarMonth < 1) {
                adminCalendarMonth = 12;
                adminCalendarYear -= 1;
            }

            renderRecordCalendar();
        }
    );

    nextButton.addEventListener(
        "click",
        function () {
            adminCalendarMonth += 1;

            if (adminCalendarMonth > 12) {
                adminCalendarMonth = 1;
                adminCalendarYear += 1;
            }

            renderRecordCalendar();
        }
    );
}


/**
 * 管理者用の記録カレンダーを表示する
 */
function renderRecordCalendar() {
    const title =
        document.getElementById(
            "adminRecordCalendarTitle"
        );

    const grid =
        document.getElementById(
            "adminRecordCalendarGrid"
        );

    if (!title || !grid) {
        console.error(
            "[管理者記録] カレンダー表示領域を取得できません。"
        );

        return;
    }

    title.textContent =
        `${adminCalendarYear}年${adminCalendarMonth}月`;

    grid.replaceChildren();

    const recordDateSet =
    new Set(
        allAdminRecords
            .map(function (record) {
                return normalizeDateValue(
                    record.date
                );
            })
            .filter(function (dateValue) {
                return dateValue !== "";
            })
    );

    const dayLabels = [
        "日",
        "月",
        "火",
        "水",
        "木",
        "金",
        "土"
    ];

    dayLabels.forEach(function (label) {
        const element =
            document.createElement("div");

        element.className =
            "bas-filter-calendar__day-label";

        element.textContent = label;

        grid.append(element);
    });

    const firstDay =
        new Date(
            adminCalendarYear,
            adminCalendarMonth - 1,
            1
        ).getDay();

    const lastDate =
        new Date(
            adminCalendarYear,
            adminCalendarMonth,
            0
        ).getDate();

    for (
        let emptyIndex = 0;
        emptyIndex < firstDay;
        emptyIndex += 1
    ) {
        const emptyCell =
            document.createElement("div");

        emptyCell.className =
            "bas-filter-calendar__cell " +
            "bas-filter-calendar__cell--empty";

        grid.append(emptyCell);
    }

    for (
    let day = 1;
    day <= lastDate;
    day += 1
) {
    const dateButton =
        document.createElement("button");

    const dateKey = [
        String(adminCalendarYear),
        String(adminCalendarMonth)
            .padStart(2, "0"),
        String(day)
            .padStart(2, "0")
    ].join("-");

    dateButton.type = "button";

    dateButton.className =
        "bas-filter-calendar__cell";

    dateButton.textContent =
        String(day);

    dateButton.dataset.date =
        dateKey;

        const todayKey =
    normalizeDateValue(
        new Date()
            .toISOString()
            .slice(0, 10)
    );

const selectedDate =
    normalizeFilterDateValue(
        document.getElementById(
            "adminRecordDateFilter"
        )?.value || ""
    );

if (dateKey === todayKey) {
    dateButton.classList.add(
        "bas-filter-calendar__cell--today"
    );
}

if (
    selectedDate &&
    dateKey === selectedDate
) {
    dateButton.classList.add(
        "bas-filter-calendar__cell--selected"
    );
}

    if (recordDateSet.has(dateKey)) {
        dateButton.classList.add(
            "bas-filter-calendar__cell--has-record"
        );

        dateButton.setAttribute(
            "aria-label",
            `${adminCalendarMonth}月${day}日、記録あり`
        );
    } else {
        dateButton.setAttribute(
            "aria-label",
            `${adminCalendarMonth}月${day}日`
        );
    }

dateButton.addEventListener(
    "click",
    function () {

        const dateFilter =
            document.getElementById(
                "adminRecordDateFilter"
            );

        const dateClearButton =
            document.getElementById(
                "adminRecordDateClearButton"
            );

        const calendarPanel =
            document.getElementById(
                "adminRecordCalendarPanel"
            );

        if (!dateFilter) {
            return;
        }

        dateFilter.value =
            dateKey.replace(
                /-/g,
                "/"
            );

        if (dateClearButton) {
            dateClearButton.hidden = false;
        }

        if (calendarPanel) {
            calendarPanel.hidden = true;
        }

        dateFilter.dispatchEvent(
            new Event("input")
        );
    }
);

    grid.append(dateButton);
}
}

    /**
     * 記録一覧を表示する
     */
    function renderRecords(records) {
        const list =
            document.getElementById("adminRecordsList");

        if (!list) {
            return;
        }

        list.replaceChildren();

        if (records.length === 0) {
            showStatus(
                "保存済みの練習記録はありません。",
                false
            );

            return;
        }
        
        const fragment =
            document.createDocumentFragment();

        records.forEach(function (record) {
            fragment.append(
                createRecordCard(record)
            );
        });

        list.append(fragment);
    }

    /**
     * 1件分の記録カードを作成する
     */
    function createRecordCard(record) {
        const card =
            document.createElement("article");

        card.className = "bas-card";

        card.dataset.sourceIndex =
         String(record.__sourceIndex);

        const title =
            document.createElement("h2");

        title.textContent =
            `${formatDate(record.date)} ${
                getMemberName(record)
            }`;

        const summary =
            document.createElement("p");

        const total = getTotal(record);
const arrowCount = getArrowValues(record).length;

const average =
    arrowCount > 0
        ? (total / arrowCount).toFixed(1)
        : "0.0";

summary.textContent = [
    `距離：${formatDistance(record.distance)}`,
    `合計：${total}点`,
    `平均：${average}点`,
    `6射：${getArrowSummary(record)}`
].join("｜");

const actions =
    document.createElement("div");

    actions.className =
    "bas-admin-record__actions";

actions.className =
    "bas-admin-record__actions";

const detailButton =
    document.createElement("button");

detailButton.type = "button";

detailButton.className =
    "bas-admin-record__action-button";

detailButton.textContent =
    "👁";
    "詳細";

detailButton.addEventListener(
    "click",
    function () {
        showRecordDetails(record);
    }
);

const editButton =
    document.createElement("button");

editButton.type = "button";

editButton.className =
    "bas-admin-record__action-button";
    "bas-button bas-admin-record__edit-button";

editButton.textContent =
    "✏";
    "編集";

editButton.addEventListener(
    "click",
    function () {
        toggleRecordEditForm(
            card,
            record
        );
    }
);

const deleteButton =
    document.createElement("button");

deleteButton.type = "button";

deleteButton.className =
    "bas-admin-record__action-button bas-admin-record__delete-button";

deleteButton.textContent =
    "🗑";
    "削除";

deleteButton.addEventListener(
    "click",
    async function () {
        const confirmed =
            window.confirm(
                [
                    "この練習記録を削除しますか？",
                    "",
                    `日付：${formatDate(record.date)}`,
                    `部員：${getMemberName(record)}`,
                    `距離：${formatDistance(
                        record.distance
                    )}`,
                    `6射：${getArrowSummary(record)}`,
                    "",
                    "この操作は元に戻せません。"
                ].join("\n")
            );

        if (!confirmed) {
            return;
        }

        deleteButton.disabled = true;
        deleteButton.textContent = "…";

        try {
            await deletePracticeRecord(
                record
            );

            window.alert(
                "記録を削除しました。"
            );
        } catch (error) {
            deleteButton.disabled = false;
            deleteButton.textContent = "🗑";

            window.alert(
                error instanceof Error
                    ? error.message
                    : "記録を削除できませんでした。"
            );
        }
    }
);

actions.append(
    detailButton,
    editButton,
    deleteButton
);

        card.append(
    title,
    summary,
    actions
);

        return card;
    }

/**
 * 記録カード内の編集フォームを開閉する
 */
function toggleRecordEditForm(
    card,
    record
) {
    const existingForm =
        card.querySelector(
            ".bas-admin-record__edit-form"
        );

    if (existingForm) {
        existingForm.remove();
        return;
    }

    document
        .querySelectorAll(
            ".bas-admin-record__edit-form"
        )
        .forEach(function (form) {
            form.remove();
        });

    const editForm =
        createRecordEditForm(record);

    card.append(editForm);
}

/**
 * 1件分の記録編集フォームを作成する
 */
function createRecordEditForm(record) {
    const form =
        document.createElement("form");

    form.className =
        "bas-admin-record__edit-form";

    form.noValidate = true;

    form.dataset.sourceIndex =
    String(record.__sourceIndex);

    const heading =
        document.createElement("h3");

    heading.textContent =
        "記録を編集";

    const dateField =
        createEditField(
            "日付",
            "date",
            normalizeDateValue(
                record.date
            )
        );

        dateField.input.name = "date";
        dateField.input.required = true;

    const distanceField =
        createEditField(
            "距離",
            "text",
            normalizeDistanceValue(
                record.distance
            )
        );

        distanceField.input.name = "distance";
        distanceField.input.inputMode = "numeric";
        distanceField.input.required = true;

    const arrowFields =
        document.createElement("div");

    arrowFields.className =
        "bas-admin-record__arrow-fields";

    const arrowValues =
        getArrowValues(record);

    for (
        let index = 0;
        index < 6;
        index += 1
    ) {
        const arrowField =
            createEditField(
                `矢${index + 1}`,
                "text",
                arrowValues[index] || ""
            );

        arrowField.input.name =
            `arrow${index + 1}`;

        arrowField.input.inputMode =
            "numeric";

        arrowFields.append(
            arrowField.wrapper
        );
    }

    const actions =
        document.createElement("div");

    actions.className =
        "bas-admin-record__edit-actions";

    const saveButton =
        document.createElement("button");

    saveButton.type = "submit";
    saveButton.className =
        "bas-button";
    saveButton.textContent =
        "保存";

    const cancelButton =
        document.createElement("button");

    cancelButton.type = "button";
    cancelButton.className =
        "bas-button";
    cancelButton.textContent =
        "キャンセル";

    cancelButton.addEventListener(
        "click",
        function () {
            form.remove();
        }
    );

    actions.append(
        saveButton,
        cancelButton
    );

    form.append(
        heading,
        dateField.wrapper,
        distanceField.wrapper,
        arrowFields,
        actions
    );

    form.addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        try {
            const updatedRecord =
                buildUpdatedRecordFromForm(
                    form,
                    record
                );

            await saveEditedRecord(
    updatedRecord
);

form.remove();

/*
 * 現在入力されている部員名・日付・距離・
 * 並び順を使って検索結果を再表示する。
 */
const editedSourceIndex =
    String(updatedRecord.__sourceIndex);

const memberFilter =
    document.getElementById(
        "adminRecordMemberFilter"
    );

if (memberFilter) {
    memberFilter.dispatchEvent(
        new Event("input")
    );
} else {
    renderRecords(
        allAdminRecords
    );
}

/*
 * 一覧の再描画が終わった後、
 * 修正した記録カードが見える位置へ戻す。
 */
window.requestAnimationFrame(
    function () {

      renderRecordCalendar();

        const editedCard =
            document.querySelector(
                `[data-source-index="${editedSourceIndex}"]`
            );

        if (!editedCard) {
            return;
        }

        editedCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
);

window.alert(
    "保存しました。"
);

        } catch (error) {
            window.alert(
                error instanceof Error
                    ? error.message
                    : "保存できませんでした。"
            );
        }
    }
);

    return form;
}

/**
 * 編集フォームの内容から更新予定の記録を作成する
 */
function buildUpdatedRecordFromForm(
    form,
    originalRecord
) {
    const formData =
        new FormData(form);

    const date =
        normalizeDateValue(
            formData.get("date")
        );

    if (!date) {
        throw new Error(
            "日付を正しく入力してください。"
        );
    }

    const distance =
        normalizeDistanceValue(
            formData.get("distance")
        );

    if (!distance) {
        throw new Error(
            "距離を入力してください。"
        );
    }

    const arrowValues = [];

    for (
        let index = 1;
        index <= 6;
        index += 1
    ) {
        const fieldName =
            `arrow${index}`;

        const arrowValue =
            normalizeEditedArrowValue(
                formData.get(fieldName)
            );

        if (!arrowValue) {
            throw new Error(
                `矢${index}の得点を入力してください。`
            );
        }

        arrowValues.push(arrowValue);
    }

    const total =
        arrowValues.reduce(
            function (sum, value) {
                return (
                    sum +
                    convertArrowValueToScore(
                        value
                    )
                );
            },
            0
        );

    return {
        ...originalRecord,
        date,
        distance,
        a1: arrowValues[0],
        a2: arrowValues[1],
        a3: arrowValues[2],
        a4: arrowValues[3],
        a5: arrowValues[4],
        a6: arrowValues[5],
        total
    };
}

/**
 * 編集した記録をクラウドへ保存する
 */
async function saveEditedRecord(
    updatedRecord
) {
    const sourceIndex =
        Number(
            updatedRecord.__sourceIndex
        );

    if (
        !Number.isInteger(sourceIndex)
    ) {
        throw new Error(
            "編集対象を特定できません。"
        );
    }

    const records =
        allAdminRecords
            .slice()
            .sort(function (a, b) {
                return (
                    a.__sourceIndex -
                    b.__sourceIndex
                );
            });

    records[sourceIndex] = updatedRecord;

    await window.BAS_CLOUD
        .overwritePracticeRecords(
            records
        );

    allAdminRecords =
        sortRecordsByDate(records);
}

/**
 * 指定した練習記録をクラウドから削除する
 */
async function deletePracticeRecord(
    recordToDelete
) {
    const sourceIndex =
        Number(
            recordToDelete.__sourceIndex
        );

    if (!Number.isInteger(sourceIndex)) {
        throw new Error(
            "削除する記録を特定できません。"
        );
    }

    /*
     * 元のスプレッドシートの並び順へ戻す。
     */
    const sourceOrderedRecords =
        allAdminRecords
            .slice()
            .sort(function (a, b) {
                return (
                    a.__sourceIndex -
                    b.__sourceIndex
                );
            });

    if (!sourceOrderedRecords[sourceIndex]) {
        throw new Error(
            "削除する記録が見つかりません。"
        );
    }

    /*
     * 対象の1件を除外する。
     */
    const remainingRecords =
        sourceOrderedRecords
            .filter(function (
                record,
                index
            ) {
                return index !== sourceIndex;
            })
            .map(function (
                record,
                newSourceIndex
            ) {
                return {
                    ...record,
                    __sourceIndex:
                        newSourceIndex
                };
            });

    await window.BAS_CLOUD
        .overwritePracticeRecords(
            remainingRecords
        );

    allAdminRecords =
        sortRecordsByDate(
            remainingRecords
        );

    /*
     * 現在の検索条件を維持したまま
     * 一覧を再表示する。
     */
    const memberFilter =
        document.getElementById(
            "adminRecordMemberFilter"
        );

    if (memberFilter) {
        memberFilter.dispatchEvent(
            new Event("input")
        );
    } else {
        renderRecords(
            allAdminRecords
        );
    }

    /*
     * 削除後の記録日に合わせて
     * カレンダーの紫丸も更新する。
     */
    renderRecordCalendar();
}

/**
 * 編集された矢の得点を統一する
 *
 * 使用可能:
 * X、10～1、M、0
 */
function normalizeEditedArrowValue(value) {
    const text =
        String(value || "")
            .trim()
            .toUpperCase();

    if (!text) {
        return "";
    }

    if (text === "X") {
        return "X";
    }

    if (
        text === "M" ||
        text === "0"
    ) {
        return "M";
    }

    const score =
        Number(text);

    if (
        Number.isInteger(score) &&
        score >= 1 &&
        score <= 10
    ) {
        return String(score);
    }

    throw new Error(
        "矢の得点は、X・10～1・Mのいずれかで入力してください。"
    );
}


/**
 * 矢の表示値を点数へ変換する
 */
function convertArrowValueToScore(value) {
    if (value === "X") {
        return 10;
    }

    if (value === "M") {
        return 0;
    }

    const score =
        Number(value);

    return Number.isFinite(score)
        ? score
        : 0;
}

/**
 * 編集フォーム用の入力欄を作成する
 */
function createEditField(
    labelText,
    inputType,
    value
) {
    const wrapper =
        document.createElement("label");

    wrapper.className =
        "bas-admin-record__edit-field";

    const label =
        document.createElement("span");

    label.textContent =
        labelText;

    const input =
        document.createElement("input");

    input.type =
        inputType;

    input.value =
        String(value || "");

    wrapper.append(
        label,
        input
    );

    return {
        wrapper,
        input
    };
}

    /**
 * 記録の詳細を表示する
 */
function showRecordDetails(record) {
    const total =
        getTotal(record);

    const arrowValues =
        getArrowValues(record);

    const average =
        arrowValues.length > 0
            ? (
                total /
                arrowValues.length
            ).toFixed(1)
            : "0.0";

    window.alert(
        [
            `日付：${formatDate(record.date)}`,
            `部員：${getMemberName(record)}`,
            `距離：${formatDistance(record.distance)}`,
            `合計：${total}点`,
            `平均：${average}点`,
            `6射：${getArrowSummary(record)}`,
            `部員ID：${record.memberId || "未設定"}`
        ].join("\n")
    );
}

    /**
     * 部員名を取得する
     */
    function getMemberName(record) {
        return String(
            record.memberName ||
            record.member ||
            record.displayName ||
            "部員名不明"
        );
    }

    /**
     * 距離を表示用に整える
     */
    function formatDistance(distance) {
        if (
            distance === null ||
            distance === undefined ||
            distance === ""
        ) {
            return "未設定";
        }

        const text = String(distance);

        return text.endsWith("m")
            ? text
            : `${text}m`;
    }

    /**
     * 合計点を取得する
     */
    function getTotal(record) {
        const storedTotal =
            Number(record.total);

        if (Number.isFinite(storedTotal)) {
            return storedTotal;
        }

        return getArrowValues(record)
            .reduce(function (sum, value) {
                if (value === "X") {
                    return sum + 10;
                }

                const numericValue =
                    Number(value);

                return sum + (
                    Number.isFinite(numericValue)
                        ? numericValue
                        : 0
                );
            }, 0);
    }

    /**
     * 6射を文字列として表示する
     */
    function getArrowSummary(record) {
        const arrows =
            getArrowValues(record);

        return arrows.length > 0
            ? arrows.join("・")
            : "未設定";
    }

    /**
     * a1〜a6を配列へまとめる
     */
    function getArrowValues(record) {
        return [
            record.a1,
            record.a2,
            record.a3,
            record.a4,
            record.a5,
            record.a6
        ].filter(function (value) {
            return (
                value !== null &&
                value !== undefined &&
                value !== ""
            );
        });
    }

/**
 * 検索欄の日付を YYYY-MM-DD へ変換する
 */
function normalizeFilterDateValue(value) {
    const text =
        String(value || "").trim();

    if (!text) {
        return "";
    }

    const fullDateMatch =
        text.match(
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
        );

    if (fullDateMatch) {
        return [
            fullDateMatch[1],
            fullDateMatch[2].padStart(2, "0"),
            fullDateMatch[3].padStart(2, "0")
        ].join("-");
    }

    const shortDateMatch =
        text.match(
            /^(\d{1,2})[-/](\d{1,2})$/
        );

    if (shortDateMatch) {
        return [
            String(new Date().getFullYear()),
            shortDateMatch[1].padStart(2, "0"),
            shortDateMatch[2].padStart(2, "0")
        ].join("-");
    }

    return "";
}

/**
 * 距離を比較用の数値文字列へ統一する
 */
function normalizeDistanceValue(value) {
    const text =
        String(value || "").trim();

    const match =
        text.match(/\d+/);

    return match
        ? match[0]
        : "";
}

    /**
 * 日付を YYYY-MM-DD 形式へ統一する
 */
function normalizeDateValue(value) {
    if (!value) {
        return "";
    }

    const text =
        String(value).trim();

    const directMatch =
        text.match(
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
        );

    if (directMatch) {
        const year =
            directMatch[1];

        const month =
            directMatch[2].padStart(2, "0");

        const day =
            directMatch[3].padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const localDate =
        new Date(
            date.getTime() -
            date.getTimezoneOffset() * 60000
        );

    return localDate
        .toISOString()
        .split("T")[0];
}

    /**
     * 日付を表示用に整える
     */
    function formatDate(value) {
        if (!value) {
            return "日付不明";
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return new Intl.DateTimeFormat(
            "ja-JP",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(date);
    }

    /**
     * 状態メッセージを表示する
     */
    function showStatus(message, isError) {
    const status =
        document.getElementById(
            "adminRecordsStatus"
        );

    if (!status) {
        return;
    }

    status.hidden = false;
    status.textContent = message;

    status.style.borderColor =
        isError ? "currentColor" : "";
}

/**
 * 状態メッセージを非表示にする
 */
function hideStatus() {
    const status =
        document.getElementById(
            "adminRecordsStatus"
        );

    if (!status) {
        return;
    }

    status.hidden = true;
}

})();