/**
 * Baika Archery System
 * Project Zero
 * 大会記録入力
 */

(function () {
    "use strict";

    const MATCH_FORMATS = {
        "70m": {
            label: "70mラウンド",
            firstHalfLabel: "前半 70m",
            secondHalfLabel: "後半 70m",
            firstHalfEnds: 6,
            secondHalfEnds: 6,
            arrowsPerEnd: 6,
            maxScorePerEnd: 60,
count1Label: "X",
count2Label: "10"
        },

        "60m": {
            label: "60mラウンド",
            firstHalfLabel: "前半 60m",
            secondHalfLabel: "後半 60m",
            firstHalfEnds: 6,
            secondHalfEnds: 6,
            arrowsPerEnd: 6,
            maxScorePerEnd: 60,
count1Label: "X",
count2Label: "10"
        },

        "50m": {
            label: "50mラウンド",
            firstHalfLabel: "前半 50m",
            secondHalfLabel: "後半 50m",
            firstHalfEnds: 6,
            secondHalfEnds: 6,
            arrowsPerEnd: 6,
            maxScorePerEnd: 60,
count1Label: "X",
count2Label: "10"
        },

        "30m": {
            label: "30mラウンド",
            firstHalfLabel: "前半 30m",
            secondHalfLabel: "後半 30m",
            firstHalfEnds: 6,
            secondHalfEnds: 6,
            arrowsPerEnd: 6,
            maxScorePerEnd: 60,
count1Label: "X",
count2Label: "10"
        },

        "50m30m": {
            label: "50m・30mラウンド",
            firstHalfLabel: "前半 50m",
            secondHalfLabel: "後半 30m",
            firstHalfEnds: 6,
            secondHalfEnds: 6,
            arrowsPerEnd: 6,
            maxScorePerEnd: 60,
count1Label: "X",
count2Label: "10"
        },

        "indoor18m": {
    label: "インドア18m",
    firstHalfLabel: "前半 18m",
    secondHalfLabel: "後半 18m",
    firstHalfEnds: 5,
    secondHalfEnds: 5,
    arrowsPerEnd: 6,
    maxScorePerEnd: 60,
    count1Label: "10",
    count2Label: "9"
}
        };

    let editingRecordId = "";
    let editingRecord = null;

    async function initialize() {
    const continueButton =
        document.getElementById(
            "continueMatchInputButton"
        );

    const backButton =
        document.getElementById(
            "backToMatchBasicButton"
        );

    const saveButton =
        document.getElementById(
            "saveMatchRecordButton"
        );

    if (continueButton) {
        continueButton.addEventListener(
            "click",
            showMatchScoreSection
        );
    }

    if (backButton) {
        backButton.addEventListener(
            "click",
            showMatchBasicSection
        );
    }

    if (saveButton) {
        saveButton.addEventListener(
            "click",
            saveMatchRecord
        );
    }

    setDefaultDate();

    await loadEditingRecord();
}

/**
 * URLに指定された大会記録を読み込み、
 * 入力画面へ復元する。
 *
 * 一覧画面から渡された一時データを先に使い、
 * 存在しない場合だけクラウドへ問い合わせる。
 */
async function loadEditingRecord() {
    const searchParams =
        new URLSearchParams(
            window.location.search
        );

    editingRecordId =
        String(
            searchParams.get(
                "recordId"
            ) || ""
        ).trim();

    if (!editingRecordId) {
        return;
    }

    /*
     * 一覧画面から渡された記録があれば、
     * クラウド通信を待たずに復元する。
     */
    const sessionRecord =
        loadEditingRecordFromSession();

    if (
        sessionRecord &&
        String(
            sessionRecord.recordId ||
            ""
        ).trim() ===
            editingRecordId
    ) {
        editingRecord =
            sessionRecord;

        if (
            !canEditMatchRecord(
                editingRecord
            )
        ) {
            handleEditPermissionError();
            return;
        }

        restoreEditingRecord(
            editingRecord
        );

        return;
    }

    /*
     * 一時データがない場合だけ、
     * クラウドから取得する。
     */
    if (
        !window.BAS_CLOUD ||
        typeof window.BAS_CLOUD
            .loadMatchRecords !==
            "function"
    ) {
        window.alert(
            "大会記録の読込機能を確認できませんでした。"
        );
        return;
    }

    try {
        const records =
            await window.BAS_CLOUD
                .loadMatchRecords();

        editingRecord =
            Array.isArray(records)
                ? records.find(
                    function (record) {
                        return (
                            String(
                                record &&
                                record.recordId ||
                                ""
                            ).trim() ===
                            editingRecordId
                        );
                    }
                ) || null
                : null;

        if (!editingRecord) {
            window.alert(
                "訂正する大会記録が見つかりませんでした。"
            );

            editingRecordId = "";
            return;
        }

        if (
            !canEditMatchRecord(
                editingRecord
            )
        ) {
            handleEditPermissionError();
            return;
        }

        restoreEditingRecord(
            editingRecord
        );
    } catch (error) {
        console.error(
            "[大会記録編集] 読込失敗:",
            error
        );

        window.alert(
            "訂正する大会記録を読み込めませんでした。"
        );
    }
}

/**
 * 一覧画面で一時保存された大会記録を取得する。
 */
function loadEditingRecordFromSession() {
    try {
        const storedValue =
            window.sessionStorage.getItem(
                "baika-editing-match-record"
            );

        if (!storedValue) {
            return null;
        }

        const record =
            JSON.parse(
                storedValue
            );

        if (
            !record ||
            typeof record !== "object"
        ) {
            return null;
        }

        return record;
    } catch (error) {
        console.warn(
            "[大会記録編集] " +
            "一時保存データを読み込めませんでした。",
            error
        );

        return null;
    }
}

function handleEditPermissionError() {
    window.alert(
        "この大会記録を訂正する権限がありません。"
    );

    window.location.href =
        "project-zero-match-records.html";
}

function clearEditingRecordSession() {
    try {
        window.sessionStorage.removeItem(
            "baika-editing-match-record"
        );
    } catch (error) {
        console.warn(
            "[大会記録編集] " +
            "一時保存データを削除できませんでした。",
            error
        );
    }
}

function saveMatchRecordsCache(
    records
) {
    if (!Array.isArray(records)) {
        return;
    }

    try {
        window.sessionStorage.setItem(
            "baika-match-records-cache",
            JSON.stringify({
                savedAt:
                    Date.now(),

                records:
                    records
            })
        );
    } catch (error) {
        console.warn(
            "[大会記録保存] " +
            "一覧キャッシュを更新できませんでした。",
            error
        );
    }
}

/**
 * 保存した1件を一覧キャッシュへ反映する。
 *
 * @param {Object} record
 * @returns {Array}
 */
function updateMatchRecordsCacheData(
    record
) {
    let records = [];

    try {
        const storedValue =
            window.sessionStorage.getItem(
                "baika-match-records-cache"
            );

        if (storedValue) {
            const cacheData =
                JSON.parse(
                    storedValue
                );

            if (
                cacheData &&
                Array.isArray(
                    cacheData.records
                )
            ) {
                records =
                    cacheData.records;
            }
        }
    } catch (error) {
        console.warn(
            "[大会記録保存] " +
            "既存キャッシュを読み込めませんでした。",
            error
        );
    }

    let replaced = false;

    const updatedRecords =
        records.map(
            function (currentRecord) {
                if (
                    String(
                        currentRecord &&
                        currentRecord.recordId ||
                        ""
                    ).trim() ===
                    String(
                        record.recordId || ""
                    ).trim()
                ) {
                    replaced = true;
                    return record;
                }

                return currentRecord;
            }
        );

    if (!replaced) {
        updatedRecords.push(
            record
        );
    }

    saveMatchRecordsCache(
        updatedRecords
    );

    return updatedRecords;
}

/**
 * 本人または管理者だけが訂正できる。
 */
function canEditMatchRecord(record) {
    if (
        !record ||
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
        String(
            loginData.role || ""
        ).trim();

    if (role === "admin") {
        return true;
    }

    const loginMemberId =
        String(
            loginData.memberId || ""
        ).trim();

    const recordMemberId =
        String(
            record.memberId || ""
        ).trim();

    return (
        loginMemberId !== "" &&
        recordMemberId !== "" &&
        loginMemberId ===
            recordMemberId
    );
}

/**
 * 保存済み大会記録を入力画面へ復元する。
 */
function restoreEditingRecord(record) {
    setInputValue(
        "matchName",
        record.matchName
    );

    setInputValue(
        "matchDate",
        record.matchDate
    );

        setInputValue(
        "matchVenue",
        record.venue || ""
    );

    setInputValue(
        "matchMemo",
        record.memo || ""
    );

    setInputValue(
        "matchCategory",
        record.category
    );

    setInputValue(
        "matchVisibility",
        record.visibility ||
            "members"
    );

    setInputValue(
        "matchResultUrl",
        record.resultUrl
    );

    const format =
        getSelectedFormat();

    if (!format) {
        window.alert(
            "保存済み記録の種目を復元できませんでした。"
        );
        return;
    }

    /*
     * 基本情報を表示へ反映し、
     * 得点入力欄を生成する。
     */
    showMatchScoreSection();

    const totalEnds =
        format.firstHalfEnds +
        format.secondHalfEnds;

    for (
        let endNumber = 1;
        endNumber <= totalEnds;
        endNumber += 1
    ) {
        setInputValue(
            `matchEnd${endNumber}`,
            record[
                `e${endNumber}`
            ]
        );
    }

    setInputValue(
        "firstHalfX",
        record.firstCount1
    );

    setInputValue(
        "firstHalfTen",
        record.firstCount2
    );

    setInputValue(
        "secondHalfX",
        record.secondCount1
    );

    setInputValue(
        "secondHalfTen",
        record.secondCount2
    );

    updateMatchTotals();

    const saveButton =
        document.getElementById(
            "saveMatchRecordButton"
        );

    if (saveButton) {
        saveButton.textContent =
            "訂正内容を保存";
    }
}

/**
 * 現在入力されている得点と本数を一時保存する。
 */
function captureCurrentScoreData() {
    const scoreData = {
        ends: {},
        firstCount1: "",
        firstCount2: "",
        secondCount1: "",
        secondCount2: ""
    };

    const endInputs =
        document.querySelectorAll(
            '#matchEndInputs input[id^="matchEnd"]'
        );

    endInputs.forEach(
        function (input) {
            scoreData.ends[
                input.id
            ] =
                input.value;
        }
    );

    scoreData.firstCount1 =
        getInputRawValue(
            "firstHalfX"
        );

    scoreData.firstCount2 =
        getInputRawValue(
            "firstHalfTen"
        );

    scoreData.secondCount1 =
        getInputRawValue(
            "secondHalfX"
        );

    scoreData.secondCount2 =
        getInputRawValue(
            "secondHalfTen"
        );

    return scoreData;
}

/**
 * 再生成後の入力欄へ退避した値を戻す。
 */
function restoreCurrentScoreData(
    scoreData,
    format
) {
    if (
        !scoreData ||
        !format
    ) {
        return;
    }

    const totalEnds =
        format.firstHalfEnds +
        format.secondHalfEnds;

    for (
        let endNumber = 1;
        endNumber <= totalEnds;
        endNumber += 1
    ) {
        const inputId =
            `matchEnd${endNumber}`;

        if (
            Object.prototype.hasOwnProperty.call(
                scoreData.ends,
                inputId
            )
        ) {
            setInputValue(
                inputId,
                scoreData.ends[
                    inputId
                ]
            );
        }
    }

    setInputValue(
        "firstHalfX",
        scoreData.firstCount1
    );

    setInputValue(
        "firstHalfTen",
        scoreData.firstCount2
    );

    setInputValue(
        "secondHalfX",
        scoreData.secondCount1
    );

    setInputValue(
        "secondHalfTen",
        scoreData.secondCount2
    );

    updateMatchTotals();
}

function getInputRawValue(
    elementId
) {
    const element =
        document.getElementById(
            elementId
        );

    return element
        ? String(
            element.value || ""
        )
        : "";
}

function setInputValue(
    elementId,
    value
) {
    const element =
        document.getElementById(
            elementId
        );

    if (!element) {
        return;
    }

    element.value =
        value == null
            ? ""
            : String(value);
}

    function setDefaultDate() {
        const dateInput =
            document.getElementById(
                "matchDate"
            );

        if (
            !dateInput ||
            dateInput.value
        ) {
            return;
        }

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                today.getDate()
            ).padStart(2, "0");

        dateInput.value =
            `${year}-${month}-${day}`;
    }

    function getSelectedFormat() {
        const categoryInput =
            document.getElementById(
                "matchCategory"
            );

        if (!categoryInput) {
            return null;
        }

        return (
            MATCH_FORMATS[
                categoryInput.value
            ] ||
            null
        );
    }

    function showMatchScoreSection() {
        const matchNameInput =
            document.getElementById(
                "matchName"
            );

        const matchDateInput =
            document.getElementById(
                "matchDate"
            );

        const visibilityInput =
            document.getElementById(
                "matchVisibility"
            );

        const format =
            getSelectedFormat();

        if (
            !matchNameInput ||
            !matchDateInput ||
            !visibilityInput
        ) {
            return;
        }

        const matchName =
            matchNameInput.value.trim();

        if (!matchName) {
            window.alert(
                "大会名を入力してください。"
            );

            matchNameInput.focus();
            return;
        }

        if (!matchDateInput.value) {
            window.alert(
                "開催日を選択してください。"
            );

            matchDateInput.focus();
            return;
        }

        if (!format) {
            window.alert(
                "種目を選択してください。"
            );

            return;
        }

        setSummaryText(
            "matchSummaryName",
            matchName
        );

        setSummaryText(
            "matchSummaryDate",
            matchDateInput.value
        );

        setSummaryText(
            "matchSummaryCategory",
            format.label
        );

        setSummaryText(
            "matchSummaryVisibility",
            visibilityInput.value ===
                "members"
                ? "部員全員に公開"
                : "本人・監督・管理者のみ"
        );

const currentScoreData =
    captureCurrentScoreData();

        createMatchScoreInputs(
            format
        );

        restoreCurrentScoreData(
    currentScoreData,
    format
);

        const form =
            document.getElementById(
                "matchRecordForm"
            );

        const scoreSection =
            document.getElementById(
                "matchScoreSection"
            );

        if (form) {
            form.hidden = true;
        }

        if (scoreSection) {
            scoreSection.hidden = false;
        }

const saveButton =
    document.getElementById(
        "saveMatchRecordButton"
    );

if (saveButton) {
    saveButton.disabled = false;
}

    }

    function setSummaryText(
        elementId,
        value
    ) {
        const element =
            document.getElementById(
                elementId
            );

        if (element) {
            element.textContent =
                String(value || "");
        }
    }

    function showMatchBasicSection() {
        const scoreSection =
            document.getElementById(
                "matchScoreSection"
            );

        const form =
            document.getElementById(
                "matchRecordForm"
            );

        if (scoreSection) {
            scoreSection.hidden = true;
        }

        if (form) {
            form.hidden = false;
        }
    }

    function createMatchScoreInputs(
    format
) {
    const container =
        document.getElementById(
            "matchEndInputs"
        );

    if (!container) {
        return;
    }

    container.replaceChildren();

    const firstHalf =
        createHalfSection({
            halfKey:
                "first",

            title:
                format.firstHalfLabel,

            startEndNumber:
                1,

            displayStartNumber:
                1,

            endCount:
                format.firstHalfEnds,

            maxScorePerEnd:
                format.maxScorePerEnd,

            count1Label:
                format.count1Label,

            count2Label:
                format.count2Label
        });

    const secondHalf =
        createHalfSection({
            halfKey:
                "second",

            title:
                format.secondHalfLabel,

            startEndNumber:
                format.firstHalfEnds + 1,

            displayStartNumber:
                1,

            endCount:
                format.secondHalfEnds,

            maxScorePerEnd:
                format.maxScorePerEnd,

            count1Label:
                format.count1Label,

            count2Label:
                format.count2Label
        });

    container.appendChild(
        firstHalf
    );

    container.appendChild(
        secondHalf
    );

    updateMatchCountLabels(
        format
    );

    updateMatchTotals();
}
        
    function createHalfSection(options) {
        const section =
            document.createElement(
                "section"
            );

        section.className =
            "bas-match-half";

        const title =
            document.createElement(
                "h3"
            );

        title.textContent =
            options.title;

        section.appendChild(title);

        const inputs =
            document.createElement(
                "div"
            );

        inputs.className =
            "bas-match-half__inputs";

        for (
            let index = 0;
            index < options.endCount;
            index += 1
        ) {
            const endNumber =
    options.startEndNumber +
    index;

const displayNumber =
    options.displayStartNumber +
    index;

const field =
    createEndScoreField(
        endNumber,
        displayNumber,
        options.maxScorePerEnd
    );

            inputs.appendChild(field);
        }

        section.appendChild(inputs);

        const summary =
            document.createElement(
                "div"
            );

        summary.className =
            "bas-match-half__summary";

       summary.innerHTML = `
    <p class="bas-match-half__total">
        ${
            options.halfKey === "first"
                ? "前半合計"
                : "後半合計"
        }：
        <strong
            id="${options.halfKey}HalfTotal"
        >
            0
        </strong>
        点
    </p>

    <label class="bas-match-compact-field">
        <span>${options.count1Label}</span>

        <input
            type="text"
            id="${options.halfKey}HalfX"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="2"
            placeholder="－"
            autocomplete="off"
            class="bas-match-compact-input"
        >
    </label>

    <label class="bas-match-compact-field">
        <span>${options.count2Label}</span>

        <input
            type="text"
            id="${options.halfKey}HalfTen"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="2"
            placeholder="－"
            autocomplete="off"
            class="bas-match-compact-input"
        >
    </label>
`;

        const summaryInputs =
    summary.querySelectorAll(
        ".bas-match-compact-input"
    );

        summaryInputs.forEach(
    function (input) {
        input.addEventListener(
            "input",
            handleNumericInput
        );
    }
);

        section.appendChild(summary);

        return section;
    }

    function createEndScoreField(
    endNumber,
    displayNumber,
    maxScorePerEnd
) {
    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "bas-match-end-field";

    const label =
        document.createElement(
            "label"
        );

    label.className =
        "bas-match-end-field__label";

    const inputId =
        `matchEnd${endNumber}`;

    label.htmlFor =
        inputId;

    label.textContent =
    String(displayNumber).padStart(
        2,
        "0"
    );

    const input =
        document.createElement(
            "input"
        );

    input.type = "text";
    input.id = inputId;
    input.name = inputId;
    input.inputMode = "numeric";
    input.pattern = "[0-9]*";
    input.maxLength = 2;
    input.placeholder = "－";
    input.autocomplete = "off";

    input.className =
        "bas-match-score-input";

    input.dataset.endNumber =
        String(endNumber);

    input.dataset.maxScore =
        String(maxScorePerEnd);

    input.addEventListener(
        "input",
        handleNumericInput
    );

    input.addEventListener(
        "blur",
        validateEndScore
    );

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    return wrapper;
}

/**
 * 数字以外を除去し、
 * 入力後に集計を更新する。
 */
function handleNumericInput(event) {
    const input =
        event.currentTarget;

    if (!input) {
        return;
    }

    input.value =
        String(input.value || "")
            .replace(
                /[^0-9]/g,
                ""
            );

    updateMatchTotals();
}

/**
 * 各エンドの上限点を確認する。
 */
function validateEndScore(event) {
    const input =
        event.currentTarget;

    if (
        !input ||
        input.value === ""
    ) {
        return;
    }

    const maxScore =
        Number(
            input.dataset.maxScore ||
            60
        );

    const score =
        Number(input.value);

    if (score > maxScore) {
        window.alert(
            `1エンドの得点は${maxScore}点以下で入力してください。`
        );

        input.value = "";
        input.focus();

        updateMatchTotals();
    }
}

/**
 * 種目に応じて本数項目の表示名を切り替える。
 *
 * 屋外：X・10
 * インドア：10・9
 */
function updateMatchCountLabels(
    format
) {
    if (!format) {
        return;
    }

    const count1Label =
        String(
            format.count1Label ||
            "X"
        );

    const count2Label =
        String(
            format.count2Label ||
            "10"
        );

    const totalCount1Label =
        document.getElementById(
            "matchTotalCount1Label"
        );

    const totalCount2Label =
        document.getElementById(
            "matchTotalCount2Label"
        );

    if (totalCount1Label) {
        totalCount1Label.textContent =
            count1Label;
    }

    if (totalCount2Label) {
        totalCount2Label.textContent =
            count2Label;
    }
}

    function updateMatchTotals() {
        const format =
            getSelectedFormat();

        if (!format) {
            return;
        }

        const firstHalfTotal =
            calculateEndRangeTotal(
                1,
                format.firstHalfEnds
            );

        const secondHalfStart =
            format.firstHalfEnds + 1;

        const secondHalfTotal =
            calculateEndRangeTotal(
                secondHalfStart,
                format.secondHalfEnds
            );

        setNumberText(
            "firstHalfTotal",
            firstHalfTotal
        );

        setNumberText(
            "secondHalfTotal",
            secondHalfTotal
        );

        const firstX =
            getNumberValue(
                "firstHalfX"
            );

        const secondX =
            getNumberValue(
                "secondHalfX"
            );

        const firstTen =
            getNumberValue(
                "firstHalfTen"
            );

        const secondTen =
            getNumberValue(
                "secondHalfTen"
            );

        setNumberText(
            "matchTotalScore",
            firstHalfTotal +
                secondHalfTotal
        );

        setNumberText(
            "matchTotalX",
            firstX + secondX
        );

        setNumberText(
            "matchTotalTen",
            firstTen + secondTen
        );
    }

async function saveMatchRecord() {
    const saveButton =
        document.getElementById(
            "saveMatchRecordButton"
        );

    if (
    !window.BAS_CLOUD ||
    typeof window.BAS_CLOUD
        .saveMatchRecord !==
        "function"
) {
        window.alert(
            "大会記録の保存機能を読み込めませんでした。"
        );
        return;
    }

    const record =
        createMatchRecordData();

    if (!record) {
        return;
    }

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent =
            "保存しています...";
    }

    try {
        await window.BAS_CLOUD
    .saveMatchRecord(
        record
    );

const updatedRecords =
    updateMatchRecordsCacheData(
        record
    );

clearEditingRecordSession();

        window.alert(
    editingRecordId
        ? "大会記録を訂正しました。"
        : "大会記録を保存しました。"
);

        window.location.href =
    editingRecordId
        ? "project-zero-match-records.html"
        : "project-zero-record-center.html";
    } catch (error) {
        console.error(
            "[大会記録保存] 保存に失敗しました。",
            error
        );

        window.alert(
            error &&
            error.message
                ? error.message
                : "大会記録を保存できませんでした。"
        );

        if (saveButton) {
    saveButton.disabled = false;

    saveButton.textContent =
        editingRecordId
            ? "訂正内容を保存"
            : "大会記録を保存";
}
    }

function createMatchRecordData() {
    const format =
        getSelectedFormat();

    if (!format) {
        window.alert(
            "種目を確認してください。"
        );
        return null;
    }

    if (
        !window.V4Session ||
        typeof window.V4Session
            .getLoggedInMemberData !==
            "function"
    ) {
        window.alert(
            "ログイン情報を確認できませんでした。"
        );
        return null;
    }

let resultUrl = "";

try {
    resultUrl =
        normalizeResultUrl(
            getTextInputValue(
                "matchResultUrl"
            )
        );
} catch (error) {
    return null;
}

    const memberData =
        window.V4Session
            .getLoggedInMemberData();

    if (
        !memberData ||
        !memberData.memberId
    ) {
        window.alert(
            "部員IDを確認できませんでした。"
        );
        return null;
    }

    const memberName =
        String(
            memberData.memberName ||
            memberData.displayName ||
            memberData.member ||
            ""
        ).trim();

        const isEditing =
    Boolean(
        editingRecordId &&
        editingRecord
    );

const ownerMemberId =
    isEditing
        ? String(
            editingRecord.memberId ||
            ""
        ).trim()
        : String(
            memberData.memberId ||
            ""
        ).trim();

const ownerMemberName =
    isEditing
        ? String(
            editingRecord.memberName ||
            ""
        ).trim()
        : memberName;

const recordId =
    isEditing
        ? editingRecordId
        : createMatchRecordId();

const createdAt =
    isEditing
        ? String(
            editingRecord.createdAt ||
            ""
        ).trim()
        : createTimestamp();

const updatedAt =
    isEditing
        ? createTimestamp()
        : "";

    const record = {
    ...(
        isEditing &&
        editingRecord
            ? editingRecord
            : {}
    ),

    recordId:
        recordId,

    memberId:
        ownerMemberId,

    memberName:
        ownerMemberName,

                matchName:
            getTextInputValue(
                "matchName"
            ),

        matchDate:
            getTextInputValue(
                "matchDate"
            ),

        venue:
            getTextInputValue(
                "matchVenue"
            ),

        memo:
            getTextInputValue(
                "matchMemo"
            ),

        category:
            getTextInputValue(
                "matchCategory"
            ),

        categoryLabel:
            format.label,

        visibility:
    getTextInputValue(
        "matchVisibility"
    ) || "members",

resultUrl:
    resultUrl,

firstHalfTotal:
    getTextValueAsNumber(
        "firstHalfTotal"
    ),

        secondHalfTotal:
            getTextValueAsNumber(
                "secondHalfTotal"
            ),

        total:
            getTextValueAsNumber(
                "matchTotalScore"
            ),

        count1Label:
            format.count1Label,

        count2Label:
            format.count2Label,

        firstCount1:
            getNumberValue(
                "firstHalfX"
            ),

        firstCount2:
            getNumberValue(
                "firstHalfTen"
            ),

        secondCount1:
            getNumberValue(
                "secondHalfX"
            ),

        secondCount2:
            getNumberValue(
                "secondHalfTen"
            ),

        totalCount1:
            getTextValueAsNumber(
                "matchTotalX"
            ),

        totalCount2:
            getTextValueAsNumber(
                "matchTotalTen"
            ),

        createdAt:
    createdAt,

updatedAt:
    updatedAt,

updatedBy:
    String(
        memberData.memberId ||
        ""
    ).trim()
    };

for (
    let endNumber = 1;
    endNumber <= 12;
    endNumber += 1
) {
    record[
        `e${endNumber}`
    ] = "";
}

    const totalEnds =
        format.firstHalfEnds +
        format.secondHalfEnds;

    for (
        let endNumber = 1;
        endNumber <= totalEnds;
        endNumber += 1
    ) {
        record[
            `e${endNumber}`
        ] =
            getNumberValue(
                `matchEnd${endNumber}`
            );
    }

    return record;
}

function getTextInputValue(
    elementId
) {
    const element =
        document.getElementById(
            elementId
        );

    return element
        ? String(
            element.value || ""
        ).trim()
        : "";
}

function getTextValueAsNumber(
    elementId
) {
    const element =
        document.getElementById(
            elementId
        );

    if (!element) {
        return 0;
    }

    const value =
        Number(
            element.textContent || 0
        );

    return Number.isFinite(value)
        ? value
        : 0;
}

function normalizeResultUrl(value) {
    const url =
        String(value || "").trim();

    if (!url) {
        return "";
    }

    if (
        !url.startsWith("https://") &&
        !url.startsWith("http://")
    ) {
        window.alert(
            "大会結果URLは http:// または https:// から入力してください。"
        );

        throw new Error(
            "大会結果URLの形式が正しくありません。"
        );
    }

    return url;
}

function createMatchRecordId() {
    const randomPart =
        Math.random()
            .toString(36)
            .slice(2, 10);

    return [
        "match",
        Date.now(),
        randomPart
    ].join("_");
}

function createTimestamp() {
    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    const hour =
        String(
            now.getHours()
        ).padStart(2, "0");

    const minute =
        String(
            now.getMinutes()
        ).padStart(2, "0");

    const second =
        String(
            now.getSeconds()
        ).padStart(2, "0");

    return (
        `${year}-${month}-${day} ` +
        `${hour}:${minute}:${second}`
    );
}

}

    function calculateEndRangeTotal(
        startEnd,
        endCount
    ) {
        let total = 0;

        for (
            let offset = 0;
            offset < endCount;
            offset += 1
        ) {
            total +=
                getNumberValue(
                    `matchEnd${
                        startEnd + offset
                    }`
                );
        }

        return total;
    }

    function getNumberValue(elementId) {
        const element =
            document.getElementById(
                elementId
            );

        if (!element) {
            return 0;
        }

        const value =
            Number(element.value || 0);

        return Number.isFinite(value)
            ? value
            : 0;
    }

    function setNumberText(
        elementId,
        value
    ) {
        const element =
            document.getElementById(
                elementId
            );

        if (element) {
            element.textContent =
                String(value);
        }
    }

    window.BAS_MATCH = {
        initialize: initialize,
        updateTotals:
            updateMatchTotals
    };
})();