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

        previous.addEventListener("click", function () {
            currentMonth.setMonth(month - 1);
            renderCalendar();
        });

        next.addEventListener("click", function () {
            currentMonth.setMonth(month + 1);
            renderCalendar();
        });

        header.append(previous, title, next);
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
    }

    window.BAS_ACTIVITY_CALENDAR = {
        initialize: renderCalendar
    };
})();