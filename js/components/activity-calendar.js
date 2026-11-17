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
                console.warn(
                    "カレンダーの認証セッションがありません。"
                );
                return;
            }

            if (
                !window.BAS_CLOUD ||
                typeof window.BAS_CLOUD.loadActivityRecordsWithSession !==
                "function"
            ) {
                console.warn(
                    "カレンダーのクラウド取得機能が利用できません。"
                );
                return;
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

    // 予定登録フォームの開閉
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
            form.reset();

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

            if (!password) {
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

            if (
                !window.BAS_CLOUD ||
                typeof window.BAS_CLOUD.saveActivityRecord !==
                "function"
            ) {
                alert("クラウド保存機能を利用できません。");
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = "保存中...";

            try {
                await window.BAS_CLOUD.saveActivityRecord(
                    record,
                    memberId,
                    password
                );

                alert("予定を登録しました。");

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
                await loadCalendarActivities();

                form.reset();
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
                    "予定の保存に失敗しました。",
                    error
                );

                alert(
                    error && error.message
                        ? error.message
                        : "予定を登録できませんでした。"
                );
            } finally {
                // パスワードは保存後・失敗後ともに消去する
                passwordInput.value = "";

                submitButton.disabled = false;
                submitButton.textContent = "登録する";
            }
        });
    }

    window.BAS_ACTIVITY_CALENDAR = {
        initialize: function () {
            renderCalendar();
            initializeActivityForm();

            // ログイン中の部員が閲覧できる予定を取得
            loadCalendarActivities();
        }
    };
})();