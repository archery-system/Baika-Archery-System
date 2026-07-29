"use strict";

/*
 * Baika Archery System Ver4
 * 記録入力画面
 *
 * 現段階：
 * ・的の描画
 * ・2段階ズーム
 * ・着弾位置の取得
 * ・本数制限なしの仮入力
 */

let currentArrows = [];
let photoGroupingArrows = [];
let registeredGroupingArrows = [];
let isGroupingSaved = false;
let isZoomed = false;
let zoomCenter = {
    x: 150,
    y: 150
};

const GROUPING_DRAFT_STORAGE_PREFIX =
    "basProjectZeroGroupingDraft";

/**
 * ログイン中の部員を識別する値を取得する
 */
function getGroupingDraftMemberKey() {
    const sessionMember =
        window.V4Session &&
        typeof window.V4Session.getLoggedInMember ===
            "function"
            ? window.V4Session.getLoggedInMember()
            : null;

    if (sessionMember) {
        if (typeof sessionMember === "string") {
            return sessionMember;
        }

        if (
            typeof sessionMember === "object"
        ) {
            return (
                sessionMember.id ||
                sessionMember.memberId ||
                sessionMember.name ||
                sessionMember.memberName ||
                "unknown"
            );
        }
    }

    const savedMember =
        window.localStorage.getItem(
            "baikaLoggedInMember"
        );

    return savedMember || "unknown";
}

/**
 * 部員別のグルーピング一時保存キーを作成する
 */
function getGroupingDraftStorageKey() {
    return [
        GROUPING_DRAFT_STORAGE_PREFIX,
        getGroupingDraftMemberKey()
    ].join(":");
}

/**
 * 登録済みグルーピングを端末へ一時保存する
 */
function saveGroupingDraft() {
    try {
        const payload = {
            savedAt:
                new Date().toISOString(),

            arrows:
                registeredGroupingArrows.map(
                    function (arrow) {
                        return {
                            ...arrow
                        };
                    }
                )
        };

        window.localStorage.setItem(
            getGroupingDraftStorageKey(),
            JSON.stringify(payload)
        );
    } catch (error) {
        console.warn(
            "グルーピングの一時保存に失敗しました。",
            error
        );
    }
}

/**
 * 端末に残っているグルーピングを復元する
 */
function restoreGroupingDraft() {
    try {
        const savedValue =
            window.localStorage.getItem(
                getGroupingDraftStorageKey()
            );

        if (!savedValue) {
            return false;
        }

        const savedDraft =
            JSON.parse(savedValue);

        if (
            !savedDraft ||
            !Array.isArray(savedDraft.arrows)
        ) {
            return false;
        }

        registeredGroupingArrows =
            savedDraft.arrows.map(
                function (arrow) {
                    return {
                        ...arrow
                    };
                }
            );

        return (
            registeredGroupingArrows.length > 0
        );
    } catch (error) {
        console.warn(
            "グルーピングの復元に失敗しました。",
            error
        );

        return false;
    }
}

/**
 * 部員別のグルーピング一時保存を削除する
 */
function clearGroupingDraft() {
    try {
        window.localStorage.removeItem(
            getGroupingDraftStorageKey()
        );
    } catch (error) {
        console.warn(
            "グルーピングの一時保存削除に失敗しました。",
            error
        );
    }
}

function getGroupingHistoryStorageKey() {

    const memberId =
        window.V4Session &&
        typeof window.V4Session.getLoggedInMemberId ===
            "function"
            ? window.V4Session.getLoggedInMemberId()
            : "";

    if (!memberId) {
        return "baika-grouping-history-unknown";
    }

    return (
        "baika-grouping-history-" +
        memberId
    );

}

function loadGroupingHistory() {

    try {

        const saved =
            localStorage.getItem(
                getGroupingHistoryStorageKey()
            );

        if (!saved) {
            return [];
        }

        return JSON.parse(saved);

    } catch {

        return [];

    }

}

function saveGroupingHistory(history) {

    localStorage.setItem(
        getGroupingHistoryStorageKey(),
        JSON.stringify(history)
    );

}

const V4_GAS_API_URL =
    "https://script.google.com/macros/s/AKfycbwGlg88mq5G4fR0_H9BlQ8VmdloL8oBPOBeIBQKWrK_XunDTPalvpo1tLu4I0qA2f16/exec";

/**
 * 現在入力中の着弾をProject ZeroのStateへ同期する
 */
function syncCurrentPracticeInputToProjectZero() {
    if (typeof setState !== "function") {
        return;
    }

    const previousPractice =
        typeof getState === "function" &&
        getState("practice") &&
        typeof getState("practice") === "object"
            ? getState("practice")
            : {};

    const activeArrows =
        photoGroupingArrows.length > 0
            ? photoGroupingArrows
            : currentArrows;

    setState("practice", {
        ...previousPractice,

        arrows: activeArrows.map(function (arrow) {
            return {
                ...arrow
            };
        }),

        isDirty: activeArrows.length > 0
    });
}

document.addEventListener(
    "DOMContentLoaded",
    function () {
        restoreGroupingDraft();

        drawTargetSvg();
        drawGroupingTargetSvg();
        updateCurrentEndDisplay();
        updateScoreInputState();
    }
);

/**
 * アーチェリーの的をSVGで描画する
 */
function drawTargetSvg() {
    const svg = document.getElementById("targetSvg");

    if (!svg) {
        return;
    }

    svg.innerHTML = "";

    /*
     * 外側から順番に描画する。
     * 半径15ごとに1点帯。
     */
    const rings = [
        { radius: 150, fill: "#f7f7f4", stroke: "#6b7280" }, // 1
        { radius: 135, fill: "#f7f7f4", stroke: "#6b7280" }, // 2
        { radius: 120, fill: "#2f3136", stroke: "#f8fafc" }, // 3
        { radius: 105, fill: "#2f3136", stroke: "#f8fafc" }, // 4
        { radius: 90, fill: "#1996d3", stroke: "#111827" },  // 5
        { radius: 75, fill: "#1996d3", stroke: "#111827" },  // 6
        { radius: 60, fill: "#e53935", stroke: "#111827" },  // 7
        { radius: 45, fill: "#e53935", stroke: "#111827" },  // 8
        { radius: 30, fill: "#f6c915", stroke: "#111827" },  // 9
        { radius: 15, fill: "#f6c915", stroke: "#111827" },  // 10
        { radius: 7.5, fill: "none", stroke: "#111827" }      // X
    ];

    rings.forEach(function (ring) {
        const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        circle.setAttribute("cx", "150");
        circle.setAttribute("cy", "150");
        circle.setAttribute("r", String(ring.radius));
        circle.setAttribute("fill", ring.fill);
        circle.setAttribute("stroke", ring.stroke);
        circle.setAttribute("stroke-width", "0.7");
        circle.setAttribute("vector-effect", "non-scaling-stroke");

        svg.appendChild(circle);
    });

    /*
     * 得点数字
     * 左右両側へ表示する。
     */
    const scoreLabels = [
        { score: "1", radius: 142.5, color: "#111827" },
        { score: "2", radius: 127.5, color: "#111827" },
        { score: "3", radius: 112.5, color: "#ffffff" },
        { score: "4", radius: 97.5, color: "#ffffff" },
        { score: "5", radius: 82.5, color: "#111827" },
        { score: "6", radius: 67.5, color: "#111827" },
        { score: "7", radius: 52.5, color: "#111827" },
        { score: "8", radius: 37.5, color: "#111827" },
        { score: "9", radius: 22.5, color: "#111827" },
        { score: "10", radius: 11.3, color: "#111827" }
    ];

    scoreLabels.forEach(function (label) {
        [-1, 1].forEach(function (direction) {
            const text = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            text.setAttribute(
                "x",
                String(150 + direction * label.radius)
            );
            text.setAttribute("y", "150");
            text.setAttribute("fill", label.color);
            text.setAttribute("font-size", label.score === "10" ? "6" : "7");
            text.setAttribute("font-weight", "700");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("pointer-events", "none");

            text.textContent = label.score;
            svg.appendChild(text);
        });
    });

    /*
     * 中央のX表示
     */
    const xLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    xLabel.setAttribute("x", "150");
    xLabel.setAttribute("y", "150");
    xLabel.setAttribute("fill", "#111827");
    xLabel.setAttribute("font-size", "5");
    xLabel.setAttribute("font-weight", "700");
    xLabel.setAttribute("text-anchor", "middle");
    xLabel.setAttribute("dominant-baseline", "middle");
    xLabel.setAttribute("pointer-events", "none");
    xLabel.textContent = "X";

    svg.appendChild(xLabel);

    /*
     * ピンは数字やリングより前面へ表示する。
     */
    const pinsGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    pinsGroup.id = "pinsGroup";
    svg.appendChild(pinsGroup);

    renderTargetPins();
}

/**
 * グルーピング確認用の的を描画する
 */
function drawGroupingTargetSvg() {
    const svg =
        document.getElementById("groupingTargetSvg");

    if (!svg) {
        return;
    }

    svg.innerHTML = "";

    /*
     * 入力用的と同じ競技仕様デザイン。
     */
    const rings = [
        { radius: 150, fill: "#f7f7f4", stroke: "#6b7280" },
        { radius: 135, fill: "#f7f7f4", stroke: "#6b7280" },
        { radius: 120, fill: "#2f3136", stroke: "#f8fafc" },
        { radius: 105, fill: "#2f3136", stroke: "#f8fafc" },
        { radius: 90, fill: "#1996d3", stroke: "#111827" },
        { radius: 75, fill: "#1996d3", stroke: "#111827" },
        { radius: 60, fill: "#e53935", stroke: "#111827" },
        { radius: 45, fill: "#e53935", stroke: "#111827" },
        { radius: 30, fill: "#f6c915", stroke: "#111827" },
        { radius: 15, fill: "#f6c915", stroke: "#111827" },
        { radius: 7.5, fill: "none", stroke: "#111827" }
    ];

    rings.forEach(function (ring) {
        const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        circle.setAttribute("cx", "150");
        circle.setAttribute("cy", "150");
        circle.setAttribute("r", String(ring.radius));
        circle.setAttribute("fill", ring.fill);
        circle.setAttribute("stroke", ring.stroke);
        circle.setAttribute("stroke-width", "0.7");
        circle.setAttribute(
            "vector-effect",
            "non-scaling-stroke"
        );

        svg.appendChild(circle);
    });

    /*
     * 入力用的と同じ得点数字。
     */
    const scoreLabels = [
        { score: "1", radius: 142.5, color: "#111827" },
        { score: "2", radius: 127.5, color: "#111827" },
        { score: "3", radius: 112.5, color: "#ffffff" },
        { score: "4", radius: 97.5, color: "#ffffff" },
        { score: "5", radius: 82.5, color: "#111827" },
        { score: "6", radius: 67.5, color: "#111827" },
        { score: "7", radius: 52.5, color: "#111827" },
        { score: "8", radius: 37.5, color: "#111827" },
        { score: "9", radius: 22.5, color: "#111827" },
        { score: "10", radius: 11.3, color: "#111827" }
    ];

    scoreLabels.forEach(function (label) {
        [-1, 1].forEach(function (direction) {
            const text = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            text.setAttribute(
                "x",
                String(150 + direction * label.radius)
            );
            text.setAttribute("y", "150");
            text.setAttribute("fill", label.color);
            text.setAttribute(
                "font-size",
                label.score === "10" ? "6" : "7"
            );
            text.setAttribute("font-weight", "700");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute(
                "dominant-baseline",
                "middle"
            );
            text.setAttribute(
                "pointer-events",
                "none"
            );

            text.textContent = label.score;
            svg.appendChild(text);
        });
    });

    /*
     * 中央のX表示。
     */
    const xLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    xLabel.setAttribute("x", "150");
    xLabel.setAttribute("y", "150");
    xLabel.setAttribute("fill", "#111827");
    xLabel.setAttribute("font-size", "5");
    xLabel.setAttribute("font-weight", "700");
    xLabel.setAttribute("text-anchor", "middle");
    xLabel.setAttribute(
        "dominant-baseline",
        "middle"
    );
    xLabel.setAttribute(
        "pointer-events",
        "none"
    );
    xLabel.textContent = "X";

    svg.appendChild(xLabel);

    /*
     * グルーピングピンは最前面へ表示する。
     */
    const groupingPinsGroup =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

    groupingPinsGroup.id = "groupingPinsGroup";
    svg.appendChild(groupingPinsGroup);

    renderGroupingPins();
}
/**
 * 的をタップしたときの処理
 *
 * 1回目：タップ位置を中心に拡大
 * 2回目：着弾位置を確定
 */
function handleTargetClick(event) {
    const svg = document.getElementById("targetSvg");

    if (!svg) {
        return;
    }

    /*
     * Target Engineがピンドラッグ／ピンタップとして
     * 処理した直後のclickは、ズームへ渡さない。
     */
    if (
        window.baikaTargetGesture &&
        typeof window.baikaTargetGesture
            .consumeSuppressedClick === "function" &&
        window.baikaTargetGesture
            .consumeSuppressedClick()
    ) {
        return;
    }

    /*
     * ピンク丸そのものをタップした場合も、
     * 的ズームや新規入力として扱わない。
     */
    if (
        event.target &&
        typeof event.target.closest === "function" &&
        event.target.closest(
            "[data-target-pin-index]"
        )
    ) {
        return;
    }

    const tappedPoint = getTargetSvgPoint(event);

    if (!tappedPoint) {
        return;
    }

    const tappedX = tappedPoint.x;
    const tappedY = tappedPoint.y;

    if (!isZoomed) {
        isZoomed = true;

        zoomCenter = {
            x: tappedX,
            y: tappedY
        };

        svg.setAttribute(
            "viewBox",
            `${Math.max(0, Math.min(250, tappedX - 25))} ${Math.max(0, Math.min(250, tappedY - 25))} 50 50`
        );

        return;
    }

    const realX =
        zoomCenter.x - 50 + (tappedX / 300) * 100;

    const realY =
        zoomCenter.y - 50 + (tappedY / 300) * 100;

    const arrow = calculateArrowScore(realX, realY);

currentArrows.push(arrow);

updateCurrentEndDisplay();
updateScoreInputState();
resetTargetZoom();
updateScoreInputState();
}

/**
 * 着弾位置から得点を計算する
 * 表示ピンの外周が得点ラインに触れた場合は、
 * 内側の高い得点として判定する。
 */
function calculateArrowScore(x, y) {
    const TARGET_CENTER = 150;
    /*
 * 白い外周の表示半径は5。
 * 線の太さや画面表示の誤差を考慮し、
 * 得点判定には1pxの補正を加える。
 */
const PIN_RADIUS = 6.5;

    const distanceFromCenter = Math.hypot(
        x - TARGET_CENTER,
        y - TARGET_CENTER
    );

    /*
     * ピンの中心ではなく、中心側の外周までの距離で判定する。
     * これにより、ピンがラインに触れた時点で内側の得点になる。
     */
    const scoringDistance = Math.max(
        0,
        distanceFromCenter - PIN_RADIUS
    );

    const arrow = {
        val: "M",
        score: 0,
        x: x,
        y: y
    };

    if (scoringDistance > 150) {
        return arrow;
    }

    if (scoringDistance <= 7.5) {
        arrow.val = "X";
        arrow.score = 10;
    } else if (scoringDistance <= 15) {
        arrow.val = "10";
        arrow.score = 10;
    } else if (scoringDistance <= 30) {
        arrow.val = "9";
        arrow.score = 9;
    } else if (scoringDistance <= 45) {
        arrow.val = "8";
        arrow.score = 8;
    } else if (scoringDistance <= 60) {
        arrow.val = "7";
        arrow.score = 7;
    } else if (scoringDistance <= 75) {
        arrow.val = "6";
        arrow.score = 6;
    } else if (scoringDistance <= 90) {
        arrow.val = "5";
        arrow.score = 5;
    } else if (scoringDistance <= 105) {
        arrow.val = "4";
        arrow.score = 4;
    } else if (scoringDistance <= 120) {
        arrow.val = "3";
        arrow.score = 3;
    } else if (scoringDistance <= 135) {
        arrow.val = "2";
        arrow.score = 2;
    } else {
        arrow.val = "1";
        arrow.score = 1;
    }

    return arrow;
}

/**
 * ズームを初期状態へ戻す
 */
function resetTargetZoom() {
    const svg = document.getElementById("targetSvg");

    isZoomed = false;
    zoomCenter = {
        x: 150,
        y: 150
    };

    if (!svg) {
        return;
    }

    svg.setAttribute("viewBox", "0 0 300 300");

    if (
        window.baikaTargetGesture &&
        typeof window.baikaTargetGesture
            .resetFineAdjustment === "function"
    ) {
        window.baikaTargetGesture
            .resetFineAdjustment();
    }

    renderTargetPins();
     renderGroupingPins();
}

/**
 * 入力済みの着弾位置を表示する
 */
function renderTargetPins() {
    const pinsGroup =
        document.getElementById("pinsGroup");

    if (!pinsGroup) {
        return;
    }

    pinsGroup.innerHTML = "";

    const targetSource =
        photoGroupingArrows.length > 0
            ? photoGroupingArrows
            : currentArrows;

    targetSource.forEach(function (arrow, index) {
if (
    arrow.x == null ||
    arrow.y == null
) {
    return;
}

        /*
 * 得点判定に使用する白い外周。
 * calculateArrowScore() の PIN_RADIUS = 5 と一致させる。
 */
const pinOuter = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
);

pinOuter.setAttribute("cx", String(arrow.x));
pinOuter.setAttribute("cy", String(arrow.y));
pinOuter.setAttribute("r", "5");
pinOuter.setAttribute("fill", "#ffffff");
pinOuter.setAttribute("stroke", "#374151");
pinOuter.setAttribute("stroke-width", "0.6");
pinOuter.setAttribute(
    "data-target-pin-index",
    String(index)
);
pinOuter.style.cursor = "grab";
pinOuter.style.pointerEvents = "all";
pinOuter.style.touchAction = "none";

/*
 * 着弾位置の中心を示す小さい赤丸。
 */
const pin = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
);

pin.setAttribute("cx", String(arrow.x));
pin.setAttribute("cy", String(arrow.y));
pin.setAttribute("r", "3");
pin.setAttribute("fill", "#ec4899");
pin.setAttribute(
    "data-target-pin-index",
    String(index)
);
pin.style.cursor = "grab";
pin.style.pointerEvents = "all";
pin.style.touchAction = "none";
        pin.setAttribute(
            "data-target-pin-index",
            String(index)
        );
        pin.style.cursor = "grab";
        pin.style.pointerEvents = "all";
        pin.style.touchAction = "none";

        /*
         * スマホで掴みやすい透明な当たり判定。
         * 見た目は変えず、半径12の範囲でドラッグ可能にする。
         */
        const pinHitArea =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            );

        pinHitArea.setAttribute(
            "cx",
            String(arrow.x)
        );
        pinHitArea.setAttribute(
            "cy",
            String(arrow.y)
        );
        pinHitArea.setAttribute("r", "12");
        pinHitArea.setAttribute(
            "fill",
            "transparent"
        );
        pinHitArea.setAttribute(
            "data-target-pin-index",
            String(index)
        );
        pinHitArea.style.cursor = "grab";
        pinHitArea.style.pointerEvents = "all";
        pinHitArea.style.touchAction = "none";

        pinsGroup.appendChild(pinHitArea);
　　　　 pinsGroup.appendChild(pinOuter);
　　　　 pinsGroup.appendChild(pin);

        const pinNumber = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        pinNumber.setAttribute("x", String(arrow.x + 5));
        pinNumber.setAttribute("y", String(arrow.y + 3));
        pinNumber.setAttribute("font-size", "8");
        pinNumber.setAttribute("font-weight", "bold");
        pinNumber.setAttribute("fill", "#111827");
        pinNumber.textContent = String(index + 1);
        pinNumber.setAttribute(
            "data-target-pin-label-index",
            String(index)
        );
        pinNumber.style.pointerEvents = "none";

        pinsGroup.appendChild(pinNumber);
    });
}
/**
 * グルーピング確認用の的に着弾位置を表示する
 */
function getTargetSvgPoint(event) {
    const svg = document.getElementById("targetSvg");

    if (!svg) {
        return null;
    }

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const matrix = svg.getScreenCTM();

    if (!matrix) {
        return null;
    }

    const svgPoint =
        point.matrixTransform(matrix.inverse());

    return {
        x: Math.max(0, Math.min(300, svgPoint.x)),
        y: Math.max(0, Math.min(300, svgPoint.y))
    };
}

function getPhotoGroupingArrows() {
    return photoGroupingArrows;
}

function updateTargetPinPosition(
    index,
    x,
    y
) {
    if (!photoGroupingArrows[index]) {
        return false;
    }

    photoGroupingArrows[index].x =
        Math.max(0, Math.min(300, Number(x)));

    photoGroupingArrows[index].y =
        Math.max(0, Math.min(300, Number(y)));

    const adjustedArrow = calculateArrowScore(
        photoGroupingArrows[index].x,
        photoGroupingArrows[index].y
    );

    photoGroupingArrows[index].val =
        adjustedArrow.val;
    photoGroupingArrows[index].score =
        adjustedArrow.score;
    photoGroupingArrows[index].isMiss =
        adjustedArrow.val === "M";
    photoGroupingArrows[index].targetAdjusted =
        true;

    renderGroupingPins();
    updateCurrentEndDisplay();

    window.dispatchEvent(
        new CustomEvent(
            "baika:target-pin-updated",
            {
                detail: {
                    index: index,
                    arrows: photoGroupingArrows.map(
                        function (arrow) {
                            return { ...arrow };
                        }
                    )
                }
            }
        )
    );

    return true;
}

function finishTargetPinPosition(
    index,
    x,
    y
) {
    const updated =
        updateTargetPinPosition(
            index,
            x,
            y
        );

    if (!updated) {
        return false;
    }

    renderTargetPins();
    renderGroupingPins();

    return true;
}

window.baikaTargetModel = {
    getArrows: getPhotoGroupingArrows,
    updatePinPosition: updateTargetPinPosition,
    finishPinPosition: finishTargetPinPosition
};

function renderGroupingPins() {
    const pinsGroup =
        document.getElementById("groupingPinsGroup");

    if (!pinsGroup) {
        return;
    }

    pinsGroup.innerHTML = "";

    const activeArrows =
        photoGroupingArrows.length > 0
            ? photoGroupingArrows
            : currentArrows;

    const groupingSource =
        registeredGroupingArrows.concat(activeArrows);

    groupingSource.forEach(function (arrow, index) {
if (
    arrow.val === "M" ||
    arrow.x == null ||
    arrow.y == null
) {
    return;
}

        const pin = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        pin.setAttribute("cx", String(arrow.x));
        pin.setAttribute("cy", String(arrow.y));
        pin.setAttribute("r", "4");
        pin.setAttribute("fill", "#ec4899");
        pin.setAttribute("stroke", "#ffffff");
        pin.setAttribute("stroke-width", "1.2");

        pinsGroup.appendChild(pin);

        const pinNumber = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        pinNumber.setAttribute(
            "x",
            String(arrow.x + 5)
        );

        pinNumber.setAttribute(
            "y",
            String(arrow.y + 3)
        );

        pinNumber.setAttribute(
            "font-size",
            "8"
        );

        pinNumber.setAttribute(
            "font-weight",
            "bold"
        );

        pinNumber.setAttribute(
            "fill",
            "#111827"
        );

        pinNumber.textContent =
            String(index + 1);

        pinNumber.style.pointerEvents = "none";

        pinsGroup.appendChild(pinNumber);

    });

    renderGroupingCenter(
        pinsGroup,
        groupingSource
    );
}

/**
 * グルーピングの平均着弾位置を表示する
 */
function renderGroupingCenter(
    pinsGroup,
    arrows
) {
    const validArrows =
        arrows.filter(function (arrow) {
            if (!arrow) {
                return false;
            }

            const scoreLabel =
                String(
                    arrow.val != null
                        ? arrow.val
                        : ""
                )
                    .trim()
                    .toUpperCase();

            const isMiss =
                arrow.isMiss === true ||
                scoreLabel === "M";

            return (
                !isMiss &&
                arrow.x != null &&
                arrow.y != null &&
                Number.isFinite(Number(arrow.x)) &&
                Number.isFinite(Number(arrow.y))
            );
        });

    if (validArrows.length === 0) {
        return;
    }

    const centerX =
        validArrows.reduce(
            function (sum, arrow) {
                return sum + Number(arrow.x);
            },
            0
        ) / validArrows.length;

    const centerY =
        validArrows.reduce(
            function (sum, arrow) {
                return sum + Number(arrow.y);
            },
            0
        ) / validArrows.length;

    const markerGroup =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

    markerGroup.setAttribute(
        "aria-label",
        "グルーピング中心"
    );

    const outerCircle =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

    outerCircle.setAttribute("cx", String(centerX));
    outerCircle.setAttribute("cy", String(centerY));
    outerCircle.setAttribute("r", "7");
    outerCircle.setAttribute("fill", "none");
    outerCircle.setAttribute("stroke", "#06b6d4");
    outerCircle.setAttribute("stroke-width", "2");

    markerGroup.appendChild(outerCircle);

    const horizontalLine =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

    horizontalLine.setAttribute(
        "x1",
        String(centerX - 10)
    );
    horizontalLine.setAttribute(
        "x2",
        String(centerX + 10)
    );
    horizontalLine.setAttribute("y1", String(centerY));
    horizontalLine.setAttribute("y2", String(centerY));
    horizontalLine.setAttribute("stroke", "#06b6d4");
    horizontalLine.setAttribute("stroke-width", "1.8");

    markerGroup.appendChild(horizontalLine);

    const verticalLine =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

    verticalLine.setAttribute("x1", String(centerX));
    verticalLine.setAttribute("x2", String(centerX));
    verticalLine.setAttribute(
        "y1",
        String(centerY - 10)
    );
    verticalLine.setAttribute(
        "y2",
        String(centerY + 10)
    );
    verticalLine.setAttribute("stroke", "#06b6d4");
    verticalLine.setAttribute("stroke-width", "1.8");

    markerGroup.appendChild(verticalLine);

    const label =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

    label.setAttribute(
        "x",
        String(centerX + 10)
    );
    label.setAttribute(
        "y",
        String(centerY - 8)
    );
    label.setAttribute("font-size", "8");
    label.setAttribute("font-weight", "bold");
    label.setAttribute("fill", "#0891b2");
    label.textContent = "中心";

    markerGroup.appendChild(label);
    pinsGroup.appendChild(markerGroup);
}

/**
 * 写真上のピンをグルーピング表示へ反映する。
 * Step29Aでは写真全体を300×300の的へ正規化して表示する。
 */
function syncPhotoPinsToGrouping(
    photoPins,
    naturalWidth,
    naturalHeight,
    calibration
) {
    if (
        !Array.isArray(photoPins) ||
        !naturalWidth ||
        !naturalHeight
    ) {
        photoGroupingArrows = [];
        renderGroupingPins();
        return;
    }

    const previousTargetArrows =
        Array.isArray(photoGroupingArrows)
            ? photoGroupingArrows
            : [];

    photoGroupingArrows =
        photoPins.map(function (pin, index) {
            const scoreLabel =
                pin.score === null
                    ? ""
                    : String(pin.score)
                        .trim()
                        .toUpperCase();

            const isMiss =
                scoreLabel === "M";

            const photoTargetX =
                calibration &&
                calibration.ready
                    ? (
                        150 +
                        (
                            Number(pin.x) -
                            Number(calibration.centerX)
                        ) /
                        Number(calibration.radiusX) *
                        150
                    )
                    : (
                        Number(pin.x) /
                        Number(naturalWidth)
                    ) * 300;

            const photoTargetY =
                calibration &&
                calibration.ready
                    ? (
                        150 +
                        (
                            Number(pin.y) -
                            Number(calibration.centerY)
                        ) /
                        Number(calibration.radiusY) *
                        150
                    )
                    : (
                        Number(pin.y) /
                        Number(naturalHeight)
                    ) * 300;

            const previous =
                previousTargetArrows[index];

            const preserveManualAdjustment =
                previous &&
                previous.targetAdjusted === true &&
                pin.photoPositionChanged !== true;

            return {
                val: scoreLabel,
                score:
                    isMiss
                        ? 0
                        : (
                            scoreLabel === "X"
                                ? 10
                                : Number(scoreLabel || 0)
                        ),
                isMiss: isMiss,
                x:
                    preserveManualAdjustment
                        ? Number(previous.x)
                        : photoTargetX,
                y:
                    preserveManualAdjustment
                        ? Number(previous.y)
                        : photoTargetY,
                targetAdjusted:
                    preserveManualAdjustment,
                inputType: "photo-grouping"
            };
        });

    renderTargetPins();
    renderGroupingPins();
    updateCurrentEndDisplay();

/*
 * 写真上のピン入力結果を
 * Project Zero の practice.arrows へ同期する。
 */
syncCurrentPracticeInputToProjectZero();
}

window.syncPhotoPinsToGrouping =
    syncPhotoPinsToGrouping;

/**
 * 現在入力中の着弾と、合計・平均を画面へ反映する
 */
function getActiveInputArrows() {
    return photoGroupingArrows.length > 0
        ? photoGroupingArrows
        : currentArrows;
}

function updateTargetScoreSummary(arrows) {
    const summary = document.getElementById("v4TargetScoreSummary");
    if (!summary) return;

    const source = Array.isArray(arrows) ? arrows : getActiveInputArrows();

    if (source.length === 0) {
        summary.textContent = "着弾を入力すると得点を表示します";
        return;
    }

    const scoreLabels = source.map(function (arrow, index) {
        const label = arrow && arrow.val != null ? String(arrow.val) : "－";
        return `${index + 1}:${label}`;
    });

    const total = source.reduce(function (sum, arrow) {
        return sum + Number(arrow && arrow.score || 0);
    }, 0);

    const average = (total / source.length).toFixed(1);

    summary.textContent =
        `${scoreLabels.join("  ")}　｜　本数 ${source.length}　合計 ${total}　平均 ${average}`;
}

function updateCurrentEndDisplay() {
    const arrows = getActiveInputArrows();
    updateTargetScoreSummary(arrows);
    const preview = document.getElementById("v4ArrowsPreview");

    if (preview) {
        preview.innerHTML = "";

        arrows.forEach(function (arrow, index) {
            const slot = document.createElement("button");
            slot.type = "button";
            slot.className = "v4-arrow-slot is-filled";
            slot.disabled = true;

            if (arrow && arrow.val === "M") {
                slot.classList.add("is-miss");
            }

            const number = document.createElement("span");
            number.className = "v4-arrow-number";
            number.textContent = String(index + 1);

            const score = document.createElement("span");
            score.className = "v4-arrow-score";
            score.textContent = arrow && arrow.val != null
                ? String(arrow.val)
                : "－";

            slot.appendChild(number);
            slot.appendChild(score);
            preview.appendChild(slot);
        });

        if (arrows.length === 0) {
            const empty = document.createElement("div");
            empty.className = "v4-arrows-empty";
            empty.textContent = "まだ入力されていません";
            preview.appendChild(empty);
        }
    }

    const count = arrows.length;
    const total = arrows.reduce(function (sum, arrow) {
        return sum + Number(arrow && arrow.score || 0);
    }, 0);
    const average = count > 0 ? (total / count).toFixed(1) : "0.0";

    const countElement = document.getElementById("v4CurrentArrowCount");
    const totalElement = document.getElementById("v4CurrentArrowTotal");
    const averageElement = document.getElementById("v4CurrentArrowAverage");

    if (countElement) countElement.textContent = `${count}本`;
    if (totalElement) totalElement.textContent = String(total);
    if (averageElement) averageElement.textContent = average;

    updateScoreInputState();
}

/**
 * キーパッドから得点を入力する
 */
function handleScoreKeypadInput(value, score) {
currentArrows.push({
    val: value,
    score: score,
    x: null,
    y: null,
    inputType: "keypad"
});

    updateCurrentEndDisplay();
    renderTargetPins();
    renderGroupingPins();
    updateScoreInputState();

    syncCurrentPracticeInputToProjectZero();
}

/**
 * 写真入力の1本以上をGoogleスプレッドシートへ登録する
 */

/**
 * 保存済みの練習データをProject Zeroへ同期する
 *
 * @param {Array} practiceData
 * @param {Object} savedRecord
 */
function syncPracticeToProjectZero(
    practiceData,
    savedRecord
) {
    if (
        typeof setState !== "function" ||
        !savedRecord ||
        !Array.isArray(practiceData)
    ) {
        return;
    }

    const samePracticeRecords =
    practiceData.filter(function (record) {
        if (!record) {
            return false;
        }

        const savedMemberId =
            String(savedRecord.memberId || "").trim();

        const recordMemberId =
            String(record.memberId || "").trim();

        /*
         * 新しい記録はmemberIdで部員を識別する。
         * 過去データにmemberIdがない場合だけ、
         * memberNameで比較する。
         */
        const isSameMember =
            savedMemberId && recordMemberId
                ? recordMemberId === savedMemberId
                : record.memberName ===
                    savedRecord.memberName;

        return (
            record.date === savedRecord.date &&
            isSameMember &&
            record.distance === savedRecord.distance
        );
    });

    const totalScore =
        samePracticeRecords.reduce(
            function (sum, record) {
                return sum + Number(record.total || 0);
            },
            0
        );

    const arrowCount =
        samePracticeRecords.reduce(
            function (count, record) {
                if (Array.isArray(record.pins)) {
                    return count + record.pins.length;
                }

                const scoreKeys = [
                    "a1",
                    "a2",
                    "a3",
                    "a4",
                    "a5",
                    "a6"
                ];

                return (
                    count +
                    scoreKeys.filter(function (key) {
                        return (
                            record[key] !== undefined &&
                            record[key] !== null &&
                            record[key] !== ""
                        );
                    }).length
                );
            },
            0
        );

    const averageScore =
        arrowCount > 0
            ? Number(
                (totalScore / arrowCount).toFixed(2)
            )
            : 0;

    const previousLastPractice =
        typeof getState === "function"
            ? getState("lastPractice")
            : null;

    setState("lastPractice", {
        date: savedRecord.date,
        distance: savedRecord.distance,
        totalScore: totalScore,
        averageScore: averageScore,
        arrowCount: arrowCount,
        memo:
            previousLastPractice &&
            typeof previousLastPractice.memo === "string"
                ? previousLastPractice.memo
                : ""
    });

    setState("practice", {
        date: savedRecord.date,
        distance: savedRecord.distance,
        arrows: Array.isArray(savedRecord.pins)
            ? savedRecord.pins.map(function (arrow) {
                return { ...arrow };
            })
            : [],
        photoMode: true
    });

    console.log(
        "[Project Zero] 練習データを同期しました。",
        {
            date: savedRecord.date,
            distance: savedRecord.distance,
            totalScore: totalScore,
            averageScore: averageScore,
            arrowCount: arrowCount
        }
    );
}

async function registerPhotoPracticeEnd(photoPins) {
    if (!Array.isArray(photoPins)) {
        return false;
    }

    if (photoPins.length === 0) {
        window.alert("1本以上のピンを追加してください。");
        return false;
    }

    const memberNameElement =
        document.getElementById(
            "v4LoggedInMemberName"
        );

    let memberName =
        memberNameElement
            ? memberNameElement.textContent.trim()
            : "";

    if (
        !memberName ||
        memberName === "未ログイン" ||
        memberName === "ログイン情報を確認中"
    ) {
        const savedMemberName =
            localStorage.getItem(
                "v4PhotoPracticeMemberName"
            ) || "";

        const enteredMemberName =
            window.prompt(
                "登録する部員名を入力してください。",
                savedMemberName
            );

        if (enteredMemberName === null) {
            return false;
        }

        memberName =
            enteredMemberName.trim();

        if (!memberName) {
            window.alert(
                "部員名を入力してください。"
            );
            return false;
        }

        localStorage.setItem(
            "v4PhotoPracticeMemberName",
            memberName
        );
    }

    const dateElement =
        document.getElementById(
            "v4PracticeDate"
        );

    const distanceElement =
        document.getElementById(
            "v4DistanceSelect"
        );

    const practiceDate =
        dateElement ? dateElement.value : "";

    const distance =
        distanceElement ? distanceElement.value : "";

    if (!practiceDate) {
        window.alert(
            "練習日を選択してください。"
        );
        return false;
    }

    if (!distance) {
        window.alert(
            "距離を選択してください。"
        );
        return false;
    }

    const arrows =
    photoPins.map(function (pin) {
        const rawLabel =
            pin && pin.val != null
                ? pin.val
                : pin && pin.score != null
                    ? pin.score
                    : "M";

        const label =
            String(rawLabel).toUpperCase();

        let numericScore = 0;

        if (
            label === "X" ||
            label === "10"
        ) {
            numericScore = 10;
        } else if (label !== "M") {
            numericScore = Number(label);
        }

        const hasTargetPosition =
            pin &&
            pin.x != null &&
            pin.y != null;

        const hasPhotoPosition =
            pin &&
            pin.photoX != null &&
            pin.photoY != null;

        return {
            val: label,
            score: numericScore,

            x: hasTargetPosition
                ? Number(pin.x)
                : null,

            y: hasTargetPosition
                ? Number(pin.y)
                : null,

            inputType:
                pin &&
                typeof pin.inputType === "string"
                    ? pin.inputType
                    : "photo",

            photoX: hasPhotoPosition
                ? Number(pin.photoX)
                : null,

            photoY: hasPhotoPosition
                ? Number(pin.photoY)
                : null
        };
    });

        const memberId =
        window.V4Session &&
        typeof window.V4Session.getLoggedInMemberId === "function"
            ? window.V4Session.getLoggedInMemberId()
            : "";

    const record = {
        date: practiceDate,
        memberId: memberId,
        memberName: memberName,
        distance: distance,
        a1: arrows[0] ? arrows[0].val : "",
        a2: arrows[1] ? arrows[1].val : "",
        a3: arrows[2] ? arrows[2].val : "",
        a4: arrows[3] ? arrows[3].val : "",
        a5: arrows[4] ? arrows[4].val : "",
        a6: arrows[5] ? arrows[5].val : "",
        total: arrows.reduce(
            function (sum, arrow) {
                return sum + arrow.score;
            },
            0
        ),
        pins: arrows
    };

    console.log(
        "[練習保存] 送信直前のrecord",
        record
    );

    try {
        const getResponse =
            await fetch(V4_GAS_API_URL);

        if (!getResponse.ok) {
            throw new Error(
                "クラウドデータを取得できませんでした。"
            );
        }

        const cloudData =
            await getResponse.json();

        const practiceData =
            Array.isArray(cloudData.practice)
                ? cloudData.practice
                : [];

        practiceData.push(record);

        const payload = {
            mode: "practice",
            data: practiceData
        };

        const saveResponse =
            await fetch(
                V4_GAS_API_URL,
                {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            );

        if (!saveResponse.ok) {
            throw new Error(
                "クラウドへ保存できませんでした。"
            );
        }

        await saveResponse.text();

        syncPracticeToProjectZero(
    practiceData,
    record
);

/*
 * 保存した6射を登録済みグルーピングへ残す
 */
registeredGroupingArrows =
    registeredGroupingArrows.concat(
        photoPins.map(function (arrow) {
            return {
                ...arrow
            };
        })
    );

    saveGroupingDraft();

currentArrows = [];
photoGroupingArrows = [];

resetTargetZoom();
updateCurrentEndDisplay();
renderTargetPins();
renderGroupingPins();
updateScoreInputState();
syncCurrentPracticeInputToProjectZero();

return true;
    } catch (error) {
        console.error(
            "Photo practice save failed:",
            error
        );

        window.alert(
            "クラウド保存に失敗しました。通信環境またはGAS設定を確認してください。"
        );

        return false;
    }
}

window.registerPhotoPracticeEnd =
    registerPhotoPracticeEnd;

    /**
 * 通常入力の6射を正式な練習記録として保存する
 *
 * @returns {Promise<boolean>}
 */
async function registerCurrentPracticeEnd() {
    const arrows =
        getActiveInputArrows();

    if (!Array.isArray(arrows)) {
        return false;
    }

    if (arrows.length !== 6) {
        window.alert(
            `点取り記録は6射で保存してください。現在は${arrows.length}射です。`
        );

        return false;
    }

    const saveButton =
        document.getElementById(
            "v4SaveCurrentEnd"
        );

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent =
            "保存しています…";
    }

    try {
        const saved =
            await registerPhotoPracticeEnd(
                arrows.map(function (arrow) {
                    return {
                        ...arrow
                    };
                })
            );

        if (saved) {
            window.alert(
                "6射の練習記録を保存しました。"
            );
        }

        return saved;
    } finally {
        if (saveButton) {
            saveButton.textContent =
                "💾 6射を記録";
        }

        updateScoreInputState();
    }
}

window.registerCurrentPracticeEnd =
    registerCurrentPracticeEnd;

/**
 * 写真入力の任意本数で現在入力中の着弾を直接置き換える
 * 確認ダイアログは表示しない
 */
function replaceCurrentEndFromPhoto(photoPins) {
    if (!Array.isArray(photoPins)) {
        return false;
    }

    if (
        photoPins.length < 1 ||
        photoPins.some(function (pin) {
            return !pin || pin.score == null;
        })
    ) {
        return false;
    }

    currentArrows =
        photoPins.map(function (pin) {
            const label =
                String(pin.score).toUpperCase();

            let numericScore = 0;

            if (
                label === "X" ||
                label === "10"
            ) {
                numericScore = 10;
            } else if (label !== "M") {
                numericScore = Number(label);
            }

            return {
                val: label,
                score: numericScore,
                x: null,
                y: null,
                inputType: "photo",
                photoX: Number(pin.x),
                photoY: Number(pin.y)
            };
        });

    resetTargetZoom();
    updateCurrentEndDisplay();
    renderTargetPins();
    renderGroupingPins();
    updateScoreInputState();

    return true;
}

window.replaceCurrentEndFromPhoto =
    replaceCurrentEndFromPhoto;

/**
 * 現在エンドをすべてクリアする
 */
function clearCurrentEnd() {
    const arrows = getActiveInputArrows();

    if (arrows.length === 0) {
        return;
    }

    const shouldClear = window.confirm(
        `現在入力中の${arrows.length}本をすべてクリアしますか？`
    );

    if (!shouldClear) {
        return;
    }

    currentArrows = [];
    photoGroupingArrows = [];

    if (
        window.baikaTargetGesture &&
        typeof window.baikaTargetGesture.clearPinSelection === "function"
    ) {
        window.baikaTargetGesture.clearPinSelection();
    }

    resetTargetZoom();
    renderTargetPins();
    renderGroupingPins();
    updateCurrentEndDisplay();
    updateScoreInputState();
}

/**
 * 現在入力中の最後の1射だけを削除する
 */
function undoLastArrow() {
    const arrows =
        getActiveInputArrows();

    if (
        !Array.isArray(arrows) ||
        arrows.length === 0
    ) {
        return false;
    }

    arrows.pop();

    if (
        window.baikaTargetGesture &&
        typeof window.baikaTargetGesture.clearPinSelection ===
            "function"
    ) {
        window.baikaTargetGesture.clearPinSelection();
    }

    resetTargetZoom();
    renderTargetPins();
    renderGroupingPins();
    updateCurrentEndDisplay();
    updateScoreInputState();
    syncCurrentPracticeInputToProjectZero();

    return true;
}

/**
 * 現在入力とグルーピング追加済みの矢をすべて削除する
 */
function clearAllArrows() {
    const activeArrows =
        getActiveInputArrows();

    const totalArrowCount =
        activeArrows.length +
        registeredGroupingArrows.length;

    if (totalArrowCount === 0) {
        return false;
    }

    const shouldClear =
        window.confirm(
            `入力中とグルーピング追加済みの合計${totalArrowCount}射をすべてクリアしますか？`
        );

    if (!shouldClear) {
        return false;
    }

    currentArrows = [];
    photoGroupingArrows = [];
    registeredGroupingArrows = [];

    clearGroupingDraft();

    isGroupingSaved = false;

const groupingSaveMessage =
    document.getElementById(
        "v4GroupingSaveMessage"
    );

if (groupingSaveMessage) {
    groupingSaveMessage.textContent =
        "グルーピングがありません";
}

    if (
        window.baikaTargetGesture &&
        typeof window.baikaTargetGesture.clearPinSelection ===
            "function"
    ) {
        window.baikaTargetGesture.clearPinSelection();
    }

    resetTargetZoom();
    renderTargetPins();
    renderGroupingPins();
    updateCurrentEndDisplay();
    updateScoreInputState();
    syncCurrentPracticeInputToProjectZero();

    return true;
}

window.undoLastArrow =
    undoLastArrow;

window.clearAllArrows =
    clearAllArrows;

/**
 * 入力の有無に応じて、
 * キーパッドと登録ボタンの状態を更新する
 */
function updateScoreInputState() {
    const arrows = getActiveInputArrows();
    const hasArrows = arrows.length > 0;

    document.querySelectorAll(".v4-score-key").forEach(function (button) {
        button.disabled = false;
    });

    const registerButton =
    document.getElementById(
        "v4RegisterCurrentEnd"
    );

if (registerButton) {
    registerButton.disabled =
        !hasArrows;
}

const adjustedRegisterButton =
    document.getElementById(
        "v4RegisterAdjustedArrows"
    );

if (adjustedRegisterButton) {
    adjustedRegisterButton.disabled =
        !hasArrows;
}

const saveButton =
    document.getElementById(
        "v4SaveCurrentEnd"
    );

if (saveButton) {
    saveButton.disabled =
        arrows.length !== 6;
}

const undoButton =
    document.getElementById(
        "v4UndoLastArrow"
    );

if (undoButton) {
    undoButton.disabled =
        !hasArrows;
}

const clearButton =
    document.getElementById(
        "v4ClearCurrentEnd"
    );

if (clearButton) {
    clearButton.disabled =
        !hasArrows;
}

const clearAllButton =
    document.getElementById(
        "v4ClearAllArrows"
    );

if (clearAllButton) {
    clearAllButton.disabled =
        !hasArrows &&
        registeredGroupingArrows.length === 0;
}
const saveGroupingButton =
    document.getElementById(
        "v4SaveGrouping"
    );

if (saveGroupingButton) {
    saveGroupingButton.disabled =
        registeredGroupingArrows.length === 0 ||
        isGroupingSaved;
}
}

function registerCurrentGrouping() {
    const arrows = getActiveInputArrows();
    if (arrows.length === 0) return false;

    registeredGroupingArrows =
    registeredGroupingArrows.concat(
        arrows.map(function (arrow) {
            return {
                ...arrow
            };
        })
    );

saveGroupingDraft();

isGroupingSaved = false;

const groupingSaveMessage =
    document.getElementById(
        "v4GroupingSaveMessage"
    );

if (groupingSaveMessage) {
    groupingSaveMessage.textContent =
        "未保存";
}

currentArrows = [];
photoGroupingArrows = [];

    if (window.baikaTargetGesture && typeof window.baikaTargetGesture.clearPinSelection === "function") {
        window.baikaTargetGesture.clearPinSelection();
    }

    renderTargetPins();
    renderGroupingPins();
    updateCurrentEndDisplay();
    updateScoreInputState();
    resetTargetZoom();

    const message = document.getElementById("v4PinRegisterMessage");
    if (message) {
        message.textContent = `✓ ${arrows.length}本を登録しました`;
        window.setTimeout(function () {
            if (message.textContent.indexOf("登録しました") >= 0) message.textContent = "";
        }, 1200);
    }

    window.dispatchEvent(new CustomEvent("baika:grouping-registered", {
        detail: {
            count: arrows.length,
            registeredArrows: registeredGroupingArrows.map(function (arrow) { return { ...arrow }; })
        }
    }));
    return true;
}

function bindUnlimitedGroupingRegistration() {
    [
        "v4RegisterAdjustedArrows",
        "v4RegisterCurrentEnd"
    ].forEach(function (buttonId) {
        const button = document.getElementById(buttonId);
        if (!button || button.dataset.bound) return;

        button.dataset.bound = "true";
        button.addEventListener("click", registerCurrentGrouping);
    });
}

document.addEventListener("DOMContentLoaded", bindUnlimitedGroupingRegistration);
window.registerCurrentGrouping = registerCurrentGrouping;

function bindClearActionButtons() {
    const undoButton =
        document.getElementById(
            "v4UndoLastArrow"
        );

    if (
        undoButton &&
        undoButton.dataset.undoBound !== "true"
    ) {
        undoButton.dataset.undoBound =
            "true";

        undoButton.addEventListener(
            "click",
            undoLastArrow
        );
    }

    const clearAllButton =
        document.getElementById(
            "v4ClearAllArrows"
        );

    if (
        clearAllButton &&
        clearAllButton.dataset.clearAllBound !==
            "true"
    ) {
        clearAllButton.dataset.clearAllBound =
            "true";

        clearAllButton.addEventListener(
            "click",
            clearAllArrows
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    bindClearActionButtons
);

function bindCurrentPracticeSave() {
    const saveButton =
        document.getElementById(
            "v4SaveCurrentEnd"
        );

    if (
        !saveButton ||
        saveButton.dataset.saveBound === "true"
    ) {
        return;
    }

    saveButton.dataset.saveBound =
        "true";

    saveButton.addEventListener(
        "click",
        registerCurrentPracticeEnd
    );
}

document.addEventListener(
    "DOMContentLoaded",
    bindCurrentPracticeSave
);

function bindGroupingSaveButton() {

    const button =
        document.getElementById(
            "v4SaveGrouping"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
    "click",
    function () {

        if (
            registeredGroupingArrows.length === 0
        ) {
            return;
        }

        const memberNameElement =
            document.getElementById(
                "v4LoggedInMemberName"
            );

        const dateElement =
            document.getElementById(
                "v4PracticeDate"
            );

        const distanceElement =
            document.getElementById(
                "v4DistanceSelect"
            );

        const memberName =
            memberNameElement
                ? memberNameElement.textContent.trim()
                : "";

        const practiceDate =
            dateElement
                ? dateElement.value
                : "";

                const memberId =
    window.V4Session &&
    typeof window.V4Session.getLoggedInMemberId ===
        "function"
        ? window.V4Session.getLoggedInMemberId()
        : "";

        if (!memberId) {
    window.alert(
        "部員IDを取得できません。いったんログインし直してください。"
    );

    return;
}

        const distance =
            distanceElement
                ? distanceElement.value
                : "";

        if (
            !memberName ||
            memberName === "未ログイン" ||
            memberName === "ログイン情報を確認中"
        ) {
            window.alert(
                "ログイン中の部員を確認してください。"
            );

            return;
        }

        if (!practiceDate) {
            window.alert(
                "練習日を選択してください。"
            );

            return;
        }

        const conditionFeeling =
    document.getElementById(
        "v4ConditionFeeling"
    )?.value || "";

const conditionWeather =
    document.getElementById(
        "v4ConditionWeather"
    )?.value || "";

const conditionWindStrength =
    document.getElementById(
        "v4ConditionWindStrength"
    )?.value || "";

const conditionWindDirection =
    document.getElementById(
        "v4ConditionWindDirectionValue"
    )?.value || "";

const conditionTheme =
    document.getElementById(
        "v4ConditionTheme"
    )?.value.trim() || "";

const conditionMemo =
    document.getElementById(
        "v4ConditionMemo"
    )?.value.trim() || "";

        if (!distance) {
            window.alert(
                "距離を選択してください。"
            );

            return;
        }

        const history =
            loadGroupingHistory();

        const savedAt =
            new Date().toISOString();

        const record = {
    id:
        "grouping-" +
        Date.now(),

    savedAt:
        savedAt,

    memberId:
        memberId,

    memberName:
        memberName,

    practiceDate:
        practiceDate,

    distance:
        distance,

    conditionFeeling:
        conditionFeeling,

    conditionWeather:
        conditionWeather,

    conditionWindStrength:
        conditionWindStrength,

    conditionWindDirection:
        conditionWindDirection,

    conditionTheme:
        conditionTheme,

    conditionMemo:
        conditionMemo,

    arrows:
        registeredGroupingArrows.map(
            function (arrow) {
                return {
                    ...arrow
                };
            }
        )
};

        history.push(record);

        saveGroupingHistory(history);

        isGroupingSaved = true;

        const message =
            document.getElementById(
                "v4GroupingSaveMessage"
            );

        if (message) {
            message.textContent =
                "✅ 保存済み";
        }

        updateScoreInputState();

        console.log(
            "グルーピング履歴を保存しました。",
            record
        );
    }
);

}

document.addEventListener(
    "DOMContentLoaded",
    bindGroupingSaveButton
);