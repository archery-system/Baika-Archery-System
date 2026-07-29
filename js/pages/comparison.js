/**
 * Baika Archery System
 * Project Zero
 * Grouping Comparison Page
 */

(function () {
    "use strict";

    const STORAGE_KEY =
        "basGroupingComparisonRecords";

    /**
     * 比較画面を初期化する
     */
    function initialize() {
        if (
            window.V4Session &&
            typeof window.V4Session.requireLogin ===
                "function" &&
            !window.V4Session.requireLogin()
        ) {
            return;
        }

        const records =
            loadComparisonRecords();

        if (!records) {
            showError(
                "記録画面で比較するグルーピングを2件選択してから、比較を開始してください。"
            );

            return;
        }

        renderRecord(
            "comparisonRecordA",
            records[0],
            "比較記録 1"
        );

        renderRecord(
            "comparisonRecordB",
            records[1],
            "比較記録 2"
        );

        renderComparisonTarget(records);

            initializeDisplayControls();

        const content =
            document.getElementById(
                "comparisonContent"
            );

        if (content) {
            content.hidden = false;
        }

        console.log(
            "[グルーピング比較] 比較データ読込成功",
            records
        );
    }

    /**
     * sessionStorageから比較データを取得する
     *
     * @returns {Object[]|null}
     */
    function loadComparisonRecords() {
        try {
            const savedValue =
                sessionStorage.getItem(
                    STORAGE_KEY
                );

            if (!savedValue) {
                return null;
            }

            const records =
                JSON.parse(savedValue);

            if (
                !Array.isArray(records) ||
                records.length !== 2
            ) {
                return null;
            }

            return records;
        } catch (error) {
            console.error(
                "[グルーピング比較] 比較データの読込に失敗しました。",
                error
            );

            return null;
        }
    }

    /**
     * 比較対象カードを表示する
     *
     * @param {string} elementId
     * @param {Object} record
     * @param {string} label
     */

/**
 * 2件のグルーピングを同じ的へ描画する
 *
 * @param {Object[]} records
 */
function renderComparisonTarget(records) {
    if (
        !window.BAS_GROUPING_TARGET ||
        typeof window.BAS_GROUPING_TARGET.draw !==
            "function" ||
        typeof window.BAS_GROUPING_TARGET.renderPins !==
            "function"
    ) {
        console.error(
            "[グルーピング比較] 的描画コンポーネントを利用できません。"
        );

        showError(
            "比較用の的を描画できませんでした。ページを再読み込みしてください。"
        );

        return;
    }

    const target =
        document.getElementById(
            "comparisonTarget"
        );

    if (!target) {
        console.error(
            "[グルーピング比較] comparisonTargetが見つかりません。"
        );

        return;
    }

    const recordA =
        records && records[0]
            ? records[0]
            : {};

    const recordB =
        records && records[1]
            ? records[1]
            : {};

    const arrowsA =
        Array.isArray(recordA.arrows)
            ? recordA.arrows
            : [];

    const arrowsB =
        Array.isArray(recordB.arrows)
            ? recordB.arrows
            : [];

    /*
     * まずピンなしの的だけを描画する。
     */
    window.BAS_GROUPING_TARGET.draw(
        target,
        []
    );

    /*
     * 比較記録1を赤色で描画する。
     */
    window.BAS_GROUPING_TARGET.renderPins(
        target,
        arrowsA,
        {
            pinColor: "#dc2626",
            pinStrokeColor: "#ffffff",
            numberColor: "#991b1b",
            numberStrokeColor: "#ffffff",
            centerColor: "#dc2626",
            centerLabel: "記録1中心",
            centerLabelStrokeColor: "#ffffff",
            seriesName: "record-a",
            clear: true
        }
    );

    /*
     * 比較記録2を青色で重ねて描画する。
     */
    window.BAS_GROUPING_TARGET.renderPins(
        target,
        arrowsB,
        {
            pinColor: "#2563eb",
            pinStrokeColor: "#ffffff",
            numberColor: "#1e3a8a",
            numberStrokeColor: "#ffffff",
            centerColor: "#2563eb",
            centerLabel: "記録2中心",
            centerLabelStrokeColor: "#ffffff",
            seriesName: "record-b",
            clear: false
        }
    );

    console.log(
        "[グルーピング比較] 的描画完了",
        {
            recordAArrows: arrowsA.length,
            recordBArrows: arrowsB.length
        }
    );
}

/**
 * 1件のグルーピングを分析する
 *
 * 座標値はSVG上の単位で計算する。
 *
 * @param {Object[]} arrows
 * @returns {Object}
 */
function analyzeGrouping(arrows) {
    const validArrows =
        Array.isArray(arrows)
            ? arrows.filter(
                function (arrow) {
                    if (!arrow) {
                        return false;
                    }

                    const scoreValue =
                        String(
                            arrow.score ??
                            arrow.val ??
                            ""
                        )
                            .trim()
                            .toUpperCase();

                    const isMiss =
                        scoreValue === "M";

                    return (
                        !isMiss &&
                        arrow.x != null &&
                        arrow.y != null &&
                        Number.isFinite(
                            Number(arrow.x)
                        ) &&
                        Number.isFinite(
                            Number(arrow.y)
                        )
                    );
                }
            )
            : [];

    if (validArrows.length === 0) {
        return {
            arrowCount: 0,
            centerX: null,
            centerY: null,
            horizontalSpread: null,
            verticalSpread: null,
            maximumSpread: null,
            averageRadius: null
        };
    }

    const points =
        validArrows.map(
            function (arrow) {
                return {
                    x: Number(arrow.x),
                    y: Number(arrow.y)
                };
            }
        );

    const centerX =
        points.reduce(
            function (sum, point) {
                return sum + point.x;
            },
            0
        ) / points.length;

    const centerY =
        points.reduce(
            function (sum, point) {
                return sum + point.y;
            },
            0
        ) / points.length;

    const xValues =
        points.map(
            function (point) {
                return point.x;
            }
        );

    const yValues =
        points.map(
            function (point) {
                return point.y;
            }
        );

    const horizontalSpread =
        Math.max(...xValues) -
        Math.min(...xValues);

    const verticalSpread =
        Math.max(...yValues) -
        Math.min(...yValues);

    let maximumSpread = 0;

    for (
        let firstIndex = 0;
        firstIndex < points.length;
        firstIndex += 1
    ) {
        for (
            let secondIndex =
                firstIndex + 1;
            secondIndex < points.length;
            secondIndex += 1
        ) {
            const deltaX =
                points[secondIndex].x -
                points[firstIndex].x;

            const deltaY =
                points[secondIndex].y -
                points[firstIndex].y;

            const distance =
                Math.hypot(
                    deltaX,
                    deltaY
                );

            maximumSpread =
                Math.max(
                    maximumSpread,
                    distance
                );
        }
    }

    const averageRadius =
        points.reduce(
            function (sum, point) {
                return (
                    sum +
                    Math.hypot(
                        point.x - centerX,
                        point.y - centerY
                    )
                );
            },
            0
        ) / points.length;

    return {
        arrowCount:
            points.length,

        centerX:
            centerX,

        centerY:
            centerY,

        horizontalSpread:
            horizontalSpread,

        verticalSpread:
            verticalSpread,

        maximumSpread:
            maximumSpread,

        averageRadius:
            averageRadius
    };
}

/**
 * 比較表示の切り替えボタンを初期化する
 */
function initializeDisplayControls() {
    const buttons =
        document.querySelectorAll(
            "[data-comparison-display]"
        );

    if (buttons.length === 0) {
        return;
    }

    buttons.forEach(function (button) {
        button.addEventListener(
            "click",
            function () {
                const displayMode =
                    button.dataset
                        .comparisonDisplay;

                updateComparisonDisplay(
                    displayMode
                );

                updateDisplayButtons(
                    buttons,
                    displayMode
                );
            }
        );
    });

    updateComparisonDisplay("overlay");
}

/**
 * 的上の記録表示を切り替える
 *
 * @param {string} displayMode
 */
/**
 * 的上の記録表示を切り替える
 *
 * @param {string} displayMode
 */
function updateComparisonDisplay(
    displayMode
) {
    const recordASeries =
        document.querySelector(
            '[data-bas-grouping-series="record-a"]'
        );

    const recordBSeries =
        document.querySelector(
            '[data-bas-grouping-series="record-b"]'
        );

    if (
        !recordASeries ||
        !recordBSeries
    ) {
        console.warn(
            "[グルーピング比較] 表示対象の系列が見つかりません。",
            {
                recordASeries,
                recordBSeries
            }
        );

        return;
    }

    switch (displayMode) {
        case "record-a":
            setSeriesVisibility(
                recordASeries,
                true
            );

            setSeriesVisibility(
                recordBSeries,
                false
            );
            break;

        case "record-b":
            setSeriesVisibility(
                recordASeries,
                false
            );

            setSeriesVisibility(
                recordBSeries,
                true
            );
            break;

        case "overlay":
        default:
            setSeriesVisibility(
                recordASeries,
                true
            );

            setSeriesVisibility(
                recordBSeries,
                true
            );
            break;
    }

    console.log(
        "[グルーピング比較] 表示切り替え",
        displayMode
    );
}

/**
 * SVG系列の表示状態を変更する
 *
 * @param {SVGElement} series
 * @param {boolean} isVisible
 */
function setSeriesVisibility(
    series,
    isVisible
) {
    if (!series) {
        return;
    }

    if (isVisible) {
        series.removeAttribute(
            "display"
        );

        series.style.removeProperty(
            "display"
        );

        series.setAttribute(
            "aria-hidden",
            "false"
        );

        return;
    }

    series.setAttribute(
        "display",
        "none"
    );

    series.style.display =
        "none";

    series.setAttribute(
        "aria-hidden",
        "true"
    );
}

/**
 * 選択中ボタンの表示を更新する
 *
 * @param {NodeList} buttons
 * @param {string} selectedMode
 */
function updateDisplayButtons(
    buttons,
    selectedMode
) {
    buttons.forEach(function (button) {
        const isSelected =
            button.dataset
                .comparisonDisplay ===
            selectedMode;

        button.classList.toggle(
            "bas-comparison__display-button--selected",
            isSelected
        );

        button.setAttribute(
            "aria-pressed",
            String(isSelected)
        );
    });
}

    function renderRecord(
        elementId,
        record,
        label
    ) {
        const element =
            document.getElementById(elementId);

        if (!element) {
            return;
        }

        const arrows =
            Array.isArray(record.arrows)
                ? record.arrows
                : [];

                const scores =
    arrows
        .map(function (arrow) {
            const score =
                Number(
                    arrow.score ??
                    arrow.val
                );

            return Number.isFinite(score)
                ? score
                : 0;
        });

const totalScore =
    scores.reduce(
        function (total, score) {
            return total + score;
        },
        0
    );

const averageScore =
    arrows.length > 0
        ? totalScore / arrows.length
        : 0;

        element.innerHTML = `
            <p class="bas-comparison__record-label">
                ${escapeHtml(label)}
            </p>

            <h2 class="bas-comparison__record-title">
                ${escapeHtml(
                    record.practiceDate ||
                    "日付なし"
                )}
            </h2>

            <div class="bas-comparison__record-meta">
    <span>
        ${escapeHtml(
            record.distance ||
            "距離なし"
        )}
    </span>

    <span>
        ${arrows.length}射
    </span>

    <span>
        合計 ${totalScore}点
    </span>

    <span>
        平均 ${averageScore.toFixed(1)}点
    </span>

    <span>
        ${escapeHtml(
            record.savedAt ||
            "保存日時なし"
        )}
    </span>
</div>
        `;
    }

    /**
     * エラーを表示する
     *
     * @param {string} message
     */
    function showError(message) {
        const errorSection =
            document.getElementById(
                "comparisonError"
            );

        const errorMessage =
            document.getElementById(
                "comparisonErrorMessage"
            );

        if (errorMessage) {
            errorMessage.textContent = message;
        }

        if (errorSection) {
            errorSection.hidden = false;
        }
    }

    /**
     * HTML特殊文字をエスケープする
     *
     * @param {*} value
     * @returns {string}
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

    window.BAS_COMPARISON = {
        initialize: initialize
    };
})();