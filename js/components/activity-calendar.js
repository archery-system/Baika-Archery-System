/**
 * Baika Archery System
 * Project Zero
 * 部活動カレンダー
 */

(function () {
    "use strict";

    let currentMonth = new Date();
    currentMonth.setDate(1);

    let selectedDate = null;

    // クラウドから取得した部活動の予定
    let activityRecords = [];

    // 指定した日付の予定を取得する
    function getActivitiesForDate(dateKey) {
        return activityRecords.filter(function (record) {
            return String(record.date || "").trim() === dateKey;
        });
    }

    // 認証セッションを使用して予定を取得
    async function loadCalendarActivities() {
        try {
            const sessionToken =
                window.V4Session &&
                    typeof window.V4Session.getSessionToken === "function"
                    ? window.V4Session.getSessionToken()
                    : "";

            if (!sessionToken) {
                throw new Error(
                    "カレンダーの認証セッションがありません。"
                );
            }

            if (
                !window.BAS_CLOUD ||
                typeof window.BAS_CLOUD.loadActivityRecordsWithSession !==
                "function"
            ) {
                throw new Error(
                    "カレンダーのクラウド取得機能が利用できません。"
                );
            }

            const records =
                await window.BAS_CLOUD.loadActivityRecordsWithSession(
                    sessionToken
                );

            activityRecords = Array.isArray(records)
                ? records
                : [];

            // カレンダーと選択中の日付の詳細を更新
            renderCalendar();
            renderSelectedSchedule();
        } catch (error) {
            console.error(
                "カレンダーの予定取得に失敗しました:",
                error
            );

            throw error;
        }
    }

    function renderSelectedSchedule() {
        const title = document.getElementById(
            "homeActivityScheduleTitle"
        );

        const list = document.getElementById(
            "homeActivityScheduleList"
        );

        if (!title || !list) {
            return;
        }

        if (!selectedDate) {
            title.textContent = "日付を選択してください";
            list.textContent =
                "カレンダーの日付をタップすると予定を表示します。";
            return;
        }

        const [year, month, day] =
            selectedDate.split("-").map(Number);

        const date = new Date(
            year,
            month - 1,
            day
        );

        const weekdays = [
            "日", "月", "火", "水", "木", "金", "土"
        ];

        const weekday = weekdays[date.getDay()];

        title.textContent =
            `${year}年${month}月${day}日（${weekday}）の予定`;

        // 選択した日付の予定を取得
        const dayActivities = getActivitiesForDate(selectedDate);

        // 予定が登録されていない場合
        if (dayActivities.length === 0) {
            list.textContent =
                "この日の予定は登録されていません。";
            return;
        }

        // 予定がある場合は、すべての予定を表示
        list.replaceChildren();

        dayActivities.forEach(function (record) {
            const card = document.createElement("div");
            card.className = "bas-calendar__activity-detail";

            // 予定名
            const activityTitle = document.createElement("div");
            activityTitle.className =
                "bas-calendar__activity-detail-title";

            activityTitle.textContent = record.title || "予定名なし";

            // 全員公開は黒、個人予定は赤
            activityTitle.style.color =
                record.scope === "owner"
                    ? "#c62828"
                    : "#000000";

            card.appendChild(activityTitle);

            // 時間
            const startTime = String(record.startTime || "").trim();
            const endTime = String(record.endTime || "").trim();

            if (startTime || endTime) {
                const time = document.createElement("div");
                time.className = "bas-calendar__activity-detail-info";

                time.textContent =
                    `時間：${startTime || "未設定"} ～ ${endTime || "未設定"}`;

                card.appendChild(time);
            }

            // 場所
            if (record.place) {
                const place = document.createElement("div");
                place.className = "bas-calendar__activity-detail-info";
                place.textContent = `場所：${record.place}`;
                card.appendChild(place);
            }

            // メモ
            if (record.memo) {
                const memo = document.createElement("div");
                memo.className = "bas-calendar__activity-detail-memo";
                memo.textContent = record.memo;
                card.appendChild(memo);
            }

            // 関連URL
            if (record.url) {
                const url = String(record.url).trim();

                if (/^https?:\/\//i.test(url)) {
                    const link = document.createElement("a");
                    link.className = "bas-calendar__activity-detail-link";
                    link.href = url;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.textContent = "関連リンクを開く";

                    card.appendChild(link);
                }
            }

            // 予定の削除権限を確認
            const memberId =
                window.V4Session &&
                    typeof window.V4Session.getLoggedInMemberId === "function"
                    ? window.V4Session.getLoggedInMemberId()
                    : "";

            const isAdmin =
                window.V4Session &&
                typeof window.V4Session.isAdmin === "function" &&
                window.V4Session.isAdmin();

            const isOwner =
                Boolean(memberId) &&
                String(record.createdBy || "").trim() ===
                String(memberId).trim();

            const canDelete =
                isOwner ||
                (isAdmin && record.scope === "all");

            if (record.id && canDelete) {
                const actions =
                    document.createElement("div");

                actions.className =
                    "bas-calendar__activity-actions";

                // 予定編集ボタン
                const editButton =
                    document.createElement("button");

                editButton.type = "button";

                editButton.className =
                    "bas-calendar__activity-edit";

                editButton.textContent = "編集";

                // 編集権限のある予定のみ操作可能
                editButton.disabled = false;

                editButton.addEventListener(
                    "click",
                    function () {
                        // 編集対象の予定IDを保持
                        editingActivityId = record.id;

                        // 既存の予定情報をフォームへ読み込む
                        const fields = {
                            homeActivityTitle: record.title,
                            homeActivityType: record.type,
                            homeActivityDate: record.date,
                            homeActivityStartTime: record.startTime,
                            homeActivityEndTime: record.endTime,
                            homeActivityPlace: record.place,
                            homeActivityMemo: record.memo,
                            homeActivityUrl: record.url
                        };

                        Object.entries(fields).forEach(
                            function ([id, value]) {
                                const input =
                                    document.getElementById(id);

                                if (input) {
                                    input.value = value ?? "";
                                }
                            }
                        );

                        // 既存の公開範囲をフォームに反映
                        const scopeInput =
                            document.querySelector(
                                `input[name="homeActivityScope"][value="${record.scope}"]`
                            );

                        if (scopeInput) {
                            scopeInput.checked = true;
                        }

                        // 他の部員の予定を編集する管理者は
                        // 公開範囲を変更できない
                        const ownerScopeInput =
                            document.querySelector(
                                'input[name="homeActivityScope"][value="owner"]'
                            );

                        if (ownerScopeInput) {
                            ownerScopeInput.disabled = !isOwner;
                        }

                        // 編集モードに切り替える
                        updateActivityPasswordMode(true);

                        // 見出しを編集用に変更
                        const heading =
                            document.getElementById(
                                "homeActivityFormHeading"
                            );

                        if (heading) {
                            heading.textContent = "予定の編集";
                        }

                        // 保存ボタンを編集用に変更
                        const submitButton =
                            document.getElementById(
                                "homeActivitySubmitButton"
                            );

                        if (submitButton) {
                            submitButton.textContent = "変更を保存";
                        }

                        // 編集フォームを表示
                        const formArea =
                            document.getElementById(
                                "homeActivityFormArea"
                            );

                        const addButton =
                            document.getElementById(
                                "homeActivityAddButton"
                            );

                        if (formArea) {
                            formArea.hidden = false;
                            formArea.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });
                        }

                        if (addButton) {
                            addButton.hidden = true;
                        }
                    }
                );

                actions.appendChild(editButton);

                const deleteButton =
                    document.createElement("button");

                deleteButton.type = "button";
                deleteButton.className =
                    "bas-calendar__activity-delete";

                deleteButton.textContent = "削除";

                deleteButton.addEventListener(
                    "click",
                    async function () {
                        const confirmed = window.confirm(
                            `「${record.title || "予定名なし"}」を削除しますか？\n\n削除した予定は元に戻せません。`
                        );

                        if (!confirmed) {
                            return;
                        }

                        const sessionToken =
                            window.V4Session &&
                            typeof window.V4Session.getSessionToken === "function"
                                ? window.V4Session.getSessionToken()
                                : "";

                        if (!sessionToken) {
                            alert(
                                "認証セッションがありません。再ログインしてください。"
                            );
                            return;
                        }

                        deleteButton.disabled = true;
                        deleteButton.textContent = "削除中...";

                        try {
                            await window.BAS_CLOUD.deleteActivityRecordWithSession(
                                record.id,
                                sessionToken
                            );

                            // 削除成功後、最新の予定を取得
                            try {
                                await loadCalendarActivities();

                                alert("予定を削除しました。");
                            } catch (reloadError) {
                                console.error(
                                    "削除後の予定再取得に失敗しました:",
                                    reloadError
                                );

                                alert(
                                    "予定の削除は完了しましたが、" +
                                    "カレンダーの更新に失敗しました。\n" +
                                    "画面を再読み込みしてください。"
                                );
                            }
                        } catch (error) {
                            console.error(
                                "予定の削除に失敗しました:",
                                error
                            );

                            alert(
                                error && error.message
                                    ? error.message
                                    : "予定を削除できませんでした。"
                            );
                        } finally {
                            deleteButton.disabled = false;
                            deleteButton.textContent = "削除";
                        }
                    }
                );

                actions.appendChild(deleteButton);
                card.appendChild(actions);
            }

            list.appendChild(card);
        });
    }

    function renderCalendar() {
        const container =
            document.getElementById(
                "homeActivityCalendar"
            );

        if (!container) {
            return;
        }

        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay =
            new Date(year, month, 1).getDay();

        const lastDate =
            new Date(year, month + 1, 0).getDate();

        container.replaceChildren();

        const header = document.createElement("div");
        header.className = "bas-calendar__header";

        const previous = document.createElement("button");
        previous.type = "button";
        previous.textContent = "〈";

        const title = document.createElement("h3");
        title.textContent = `${year}年${month + 1}月`;

        const next = document.createElement("button");
        next.type = "button";
        next.textContent = "〉";

        const todayButton = document.createElement("button");
        todayButton.type = "button";
        todayButton.textContent = "今日";
        todayButton.className = "bas-calendar__today-button";

        todayButton.addEventListener("click", function () {
            const today = new Date();

            currentMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

            selectedDate =
                `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

            renderCalendar();
        });

        previous.addEventListener("click", function () {
            currentMonth.setMonth(month - 1);
            renderCalendar();
        });

        next.addEventListener("click", function () {
            currentMonth.setMonth(month + 1);
            renderCalendar();
        });

        header.append(previous, title, todayButton, next);
        container.appendChild(header);

        const grid = document.createElement("div");
        grid.className = "bas-calendar__grid";

        const weekdays = [
            "日", "月", "火", "水", "木", "金", "土"
        ];

        weekdays.forEach(function (day) {
            const cell = document.createElement("div");
            cell.className = "bas-calendar__weekday";
            cell.textContent = day;
            grid.appendChild(cell);
        });

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement("div");
            grid.appendChild(empty);
        }

        const today = new Date();

        for (let day = 1; day <= lastDate; day++) {
            const cell = document.createElement("div");
            cell.className = "bas-calendar__day";

            // 日付の数字
            const dayNumber = document.createElement("span");
            dayNumber.className = "bas-calendar__day-number";
            dayNumber.textContent = day;

            // 予定名の表示領域
            const activityArea = document.createElement("div");
            activityArea.className = "bas-calendar__activities";

            cell.append(dayNumber, activityArea);

            if (
                year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate()
            ) {
                cell.classList.add(
                    "bas-calendar__today"
                );
            }

            const dateKey =
                `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            // この日に登録された予定を取得
            const dayActivities = getActivitiesForDate(dateKey);

            if (dayActivities.length > 0) {
                // 最初の予定名を表示
                const firstActivity = dayActivities[0];

                const activityTitle = document.createElement("span");
                activityTitle.className = "bas-calendar__activity-title";

                activityTitle.textContent = firstActivity.title || "";

                // 全員公開は黒、個人予定は赤
                activityTitle.style.color =
                    firstActivity.scope === "owner"
                        ? "#c62828"
                        : "#000000";

                activityArea.appendChild(activityTitle);

                // 2件以上の場合は次の行に「…」を表示
                if (dayActivities.length >= 2) {
                    const more = document.createElement("span");
                    more.className = "bas-calendar__activity-more";
                    more.textContent = "…";

                    activityArea.appendChild(more);
                }
            }                

            if (selectedDate === dateKey) {
                cell.classList.add(
                    "bas-calendar__selected"
                );
            }

            cell.addEventListener("click", function () {
                selectedDate = dateKey;
                renderCalendar();
            });

            grid.appendChild(cell);
        }

        container.appendChild(grid);

        renderSelectedSchedule();
    }

    // 現在編集中の予定ID
    // null の場合は新規登録モード
    let editingActivityId = null;

    // 新規登録・編集に応じてパスワード欄を切り替える
    function updateActivityPasswordMode(isEditing) {
        const passwordArea = document.getElementById(
            "homeActivityPasswordArea"
        );

        const passwordInput = document.getElementById(
            "homeActivityPassword"
        );

        if (!passwordArea || !passwordInput) {
            return;
        }

        // パスワードは切り替え時に必ず消去
        passwordInput.value = "";

        // 新規登録では表示・必須
        // 編集では非表示・必須解除
        passwordArea.hidden = isEditing;
        passwordInput.required = !isEditing;

        // 新規登録モードでは公開範囲の選択制限を解除
        if (!isEditing) {
            const ownerScopeInput =
                document.querySelector(
                    'input[name="homeActivityScope"][value="owner"]'
                );

            if (ownerScopeInput) {
                ownerScopeInput.disabled = false;
            }
        }
    }

    // 予定登録・編集フォームの開閉
    function initializeActivityForm() {
        const addButton = document.getElementById(
            "homeActivityAddButton"
        );

        const formArea = document.getElementById(
            "homeActivityFormArea"
        );

        const form = document.getElementById(
            "homeActivityForm"
        );

        const cancelButton = document.getElementById(
            "homeActivityCancelButton"
        );

        const dateInput = document.getElementById(
            "homeActivityDate"
        );

        if (
            !addButton ||
            !formArea ||
            !form ||
            !cancelButton ||
            !dateInput
        ) {
            return;
        }

        addButton.addEventListener("click", function () {
            editingActivityId = null;
            form.reset();

            // 新規登録モード：パスワードを表示・必須にする
            updateActivityPasswordMode(false);

            // フォームの見出しを新規登録用に戻す
            const heading = document.getElementById(
                "homeActivityFormHeading"
            );

            if (heading) {
                heading.textContent = "予定の新規登録";
            }

            // 保存ボタンの表示を戻す
            const submitButton = document.getElementById(
                "homeActivitySubmitButton"
            );

            if (submitButton) {
                submitButton.textContent = "登録する";
            }

            if (selectedDate) {
                dateInput.value = selectedDate;
            } else {
                const today = new Date();

                dateInput.value =
                    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            }

            formArea.hidden = false;
            addButton.hidden = true;
        });

        cancelButton.addEventListener("click", function () {
            editingActivityId = null;
            form.reset();

            // キャンセル時は新規登録モードへ戻す
            updateActivityPasswordMode(false);

            // 見出しを新規登録用に戻す
            const heading = document.getElementById(
                "homeActivityFormHeading"
            );

            if (heading) {
                heading.textContent = "予定の新規登録";
            }

            // 保存ボタンの表示を戻す
            const submitButton = document.getElementById(
                "homeActivitySubmitButton"
            );

            if (submitButton) {
                submitButton.textContent = "登録する";
            }

            formArea.hidden = true;
            addButton.hidden = false;

            const calendar = document.getElementById(
                "homeActivityCalendar"
            );

            if (calendar) {
                calendar.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });

        // 予定をクラウドへ保存する
        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            const submitButton = form.querySelector(
                'button[type="submit"]'
            );

            const passwordInput = document.getElementById(
                "homeActivityPassword"
            );

            if (
                !submitButton ||
                !passwordInput
            ) {
                alert("予定登録フォームを確認できません。");
                return;
            }

            if (submitButton.disabled) {
                return;
            }

            const memberId =
                window.V4Session &&
                window.V4Session.getLoggedInMemberId();

            if (!memberId) {
                alert("ログイン情報を確認できません。");
                return;
            }

            const password = passwordInput.value;

            // 新規登録時のみパスワードを必須にする
            const isEditing = Boolean(editingActivityId);

            if (!isEditing && !password) {
                alert("本人確認用パスワードを入力してください。");
                return;
            }

            const getValue = function (id) {
                const element = document.getElementById(id);

                return element
                    ? element.value.trim()
                    : "";
            };

            const scopeInput = form.querySelector(
                'input[name="homeActivityScope"]:checked'
            );

            const record = {
                title: getValue("homeActivityTitle"),
                type: getValue("homeActivityType"),
                date: getValue("homeActivityDate"),
                startTime: getValue("homeActivityStartTime"),
                endTime: getValue("homeActivityEndTime"),
                place: getValue("homeActivityPlace"),
                memo: getValue("homeActivityMemo"),
                url: getValue("homeActivityUrl"),
                scope: scopeInput
                    ? scopeInput.value
                    : "all"
            };

            if (!record.title || !record.date) {
                alert("予定名と日付を入力してください。");
                return;
            }

            // 新規登録と編集で必要なクラウド機能を確認
            const cloudMethod = isEditing
                ? "updateActivityRecordWithSession"
                : "saveActivityRecord";

            if (
                !window.BAS_CLOUD ||
                typeof window.BAS_CLOUD[cloudMethod] !== "function"
            ) {
                alert(
                    isEditing
                        ? "クラウド更新機能を利用できません。"
                        : "クラウド保存機能を利用できません。"
                );
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = "保存中...";

            try {
                if (isEditing) {
                    // 編集時はログインセッションで認証
                    const sessionToken =
                        window.V4Session &&
                            typeof window.V4Session.getSessionToken === "function"
                            ? window.V4Session.getSessionToken()
                            : "";

                    if (!sessionToken) {
                        throw new Error(
                            "認証セッションがありません。再ログインしてください。"
                        );
                    }

                    if (
                        !window.BAS_CLOUD ||
                        typeof window.BAS_CLOUD.updateActivityRecordWithSession !==
                        "function"
                    ) {
                        throw new Error(
                            "予定の更新機能を利用できません。"
                        );
                    }

                    // 既存の予定IDを指定して更新
                    await window.BAS_CLOUD.updateActivityRecordWithSession(
                        editingActivityId,
                        record,
                        sessionToken
                    );

                    alert("予定を更新しました。");
                } else {
                    // 新規登録は従来どおり
                    await window.BAS_CLOUD.saveActivityRecord(
                        record,
                        memberId,
                        password
                    );

                    alert("予定を登録しました。");
                }

                // 保存した予定の日付を選択する
                selectedDate = record.date;

                // 保存した予定の月へカレンダーを移動する
                const [savedYear, savedMonth] =
                    record.date.split("-").map(Number);

                currentMonth = new Date(
                    savedYear,
                    savedMonth - 1,
                    1
                );

                // 保存成功後にクラウドから最新の予定を取得
                try {
                    await loadCalendarActivities();
                } catch (reloadError) {
                    console.error(
                        "保存後の予定再取得に失敗しました:",
                        reloadError
                    );

                    alert(
                        "予定の保存は完了しましたが、" +
                        "カレンダーの更新に失敗しました。\n" +
                        "画面を再読み込みしてください。"
                    );
                }

                // 保存成功後は編集モードを解除
                editingActivityId = null;

                form.reset();

                // 新規登録モードに戻す
                updateActivityPasswordMode(false);

                const heading =
                    document.getElementById(
                        "homeActivityFormHeading"
                    );

                if (heading) {
                    heading.textContent = "予定の新規登録";
                }

                formArea.hidden = true;
                addButton.hidden = false;

                const calendar = document.getElementById(
                    "homeActivityCalendar"
                );

                if (calendar) {
                    calendar.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            } catch (error) {
                console.error(
                    isEditing
                        ? "予定の更新に失敗しました。"
                        : "予定の登録に失敗しました。",
                    error
                );

                alert(
                    error && error.message
                        ? error.message
                        : isEditing
                            ? "予定を更新できませんでした。"
                            : "予定を登録できませんでした。"
                );
            } finally {
                // パスワードは保存後・失敗後ともに消去する
                passwordInput.value = "";

                submitButton.disabled = false;

                // 編集中かどうかでボタン表示を切り替える
                submitButton.textContent =
                    editingActivityId
                        ? "変更を保存"
                        : "登録する";
            }
        });
    }

    window.BAS_ACTIVITY_CALENDAR = {
        initialize: function () {
            renderCalendar();
            initializeActivityForm();

            // ログイン中の部員が閲覧できる予定を取得
            loadCalendarActivities().catch(function (error) {
                console.error(
                    "カレンダーの初回読み込みに失敗しました:",
                    error
                );
            });
        }
    };
})();