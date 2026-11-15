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

        list.textContent =
            "この日の予定は登録されていません。";
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
            cell.textContent = day;

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

        // 保存機能の実装までは送信を停止する
        form.addEventListener("submit", function (event) {
            event.preventDefault();
        });
    }

    window.BAS_ACTIVITY_CALENDAR = {
        initialize: function () {
            renderCalendar();
            initializeActivityForm();
        }
    };
})();