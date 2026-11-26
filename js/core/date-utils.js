/**
 * Baika Archery System
 * Project Zero
 * 共通の日付・時刻変換
 */

(function () {
    "use strict";

    /**
     * 保存日時を日本時間で表示する。
     *
     * 表示形式：
     * yyyy-MM-dd HH:mm:ss
     */
    function formatDateTimeJST(value) {
        if (value == null || value === "") {
            return "保存日時なし";
        }

        const date = new Date(value);

        if (!Number.isFinite(date.getTime())) {
            return "日時不明";
        }

        const formatter =
            new Intl.DateTimeFormat(
                "ja-JP",
                {
                    timeZone: "Asia/Tokyo",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hourCycle: "h23"
                }
            );

        const parts =
            formatter.formatToParts(date);

        const values = {};

        parts.forEach(function (part) {
            values[part.type] = part.value;
        });

        return (
            `${values.year}-${values.month}-${values.day}` +
            ` ${values.hour}:${values.minute}:${values.second}`
        );
    }

    /*
     * 共通の日付変換機能を公開する。
     */
    window.BAS_DATE_UTILS = {
        formatDateTimeJST: formatDateTimeJST
    };
})();