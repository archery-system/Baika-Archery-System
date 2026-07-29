/**
 * Baika Archery System
 * Project Zero
 * Grouping Viewer
 */

(function () {
    "use strict";

    /**
 * 保存済みグルーピングを表示する
 *
 * @param {Object} record
 */

/**
 * 要素へ値を表示する
 *
 * @param {string} elementId
 * @param {*} value
 */

/**
 * コンディションの内部値を日本語表示へ変換する
 *
 * @param {string} type
 * @param {*} value
 * @returns {string}
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

function setDetailText(elementId, value) {
    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    const text =
        value == null
            ? ""
            : String(value).trim();

    element.textContent =
        text || "―";
}

/**
 * 保存済みの練習条件を表示する
 *
 * @param {Object} record
 */
function renderDetails(record) {
    setDetailText(
        "groupingViewerFeeling",
        formatConditionValue(
            "feeling",
            record.conditionFeeling
        )
    );

    setDetailText(
        "groupingViewerWeather",
        formatConditionValue(
            "weather",
            record.conditionWeather
        )
    );

    setDetailText(
        "groupingViewerWindStrength",
        formatConditionValue(
            "windStrength",
            record.conditionWindStrength
        )
    );

    setDetailText(
        "groupingViewerWindDirection",
        formatConditionValue(
            "windDirection",
            record.conditionWindDirection
        )
    );

    setDetailText(
        "groupingViewerTheme",
        record.conditionTheme
    );

    setDetailText(
        "groupingViewerMemo",
        record.conditionMemo
    );
}

function open(record) {
    console.log(
        "[グルーピングビューア] open開始",
        record
    );

    const modal =
        document.getElementById(
            "groupingViewerModal"
        );

    const summary =
        document.getElementById(
            "groupingViewerSummary"
        );

    const targetSvg =
        document.getElementById(
            "groupingViewerTargetSvg"
        );

    if (!modal) {
        console.error(
            "[グルーピングビューア] モーダルが見つかりません。"
        );
        return;
    }

    if (!record) {
        console.error(
            "[グルーピングビューア] 記録データがありません。"
        );
        return;
    }

    const arrows =
        Array.isArray(record.arrows)
            ? record.arrows
            : [];

    if (summary) {
        const practiceDate =
            record.practiceDate || "日付なし";

        const distance =
            record.distance || "距離なし";

        summary.textContent =
            `${practiceDate}・${distance}・${arrows.length}射`;
    }

    renderDetails(record);

    if (
        targetSvg &&
        window.BAS_GROUPING_TARGET &&
        typeof window.BAS_GROUPING_TARGET.draw ===
            "function"
    ) {
        window.BAS_GROUPING_TARGET.draw(
            targetSvg,
            arrows
        );
    } else if (targetSvg) {
        targetSvg.innerHTML = "";

        console.error(
            "[グルーピングビューア] 共通的描画コンポーネントを読み込めません。"
        );
    }

    modal.hidden = false;

    document.body.style.overflow = "hidden";
}

    /**
     * ビューアを閉じる
     */
    function close() {

        const modal =
            document.getElementById(
                "groupingViewerModal"
            );

        if (!modal) {
            return;
        }

        modal.hidden = true;
        document.body.style.overflow = "";
    }

    /**
     * 閉じる操作を準備する
     */
    function initialize() {

        const closeButton =
            document.getElementById(
                "groupingViewerCloseButton"
            );

        const backdrop =
            document.querySelector(
                "[data-grouping-viewer-close]"
            );

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                close
            );
        }

        if (backdrop) {
            backdrop.addEventListener(
                "click",
                close
            );
        }

        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {
                    close();
                }

            }
        );
    }

    window.BAS_GROUPING_VIEWER = {
        initialize: initialize,
        open: open,
        close: close
    };

})();