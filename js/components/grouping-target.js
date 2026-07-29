/**
 * Baika Archery System
 * Project Zero
 *
 * グルーピング的 共通描画コンポーネント
 */

(function () {
    "use strict";

    const SVG_NAMESPACE =
        "http://www.w3.org/2000/svg";

    /**
     * 的と保存済みの矢をまとめて描画する
     *
     * @param {SVGElement|string} svgReference
     * @param {Array} arrows
     */
    function draw(svgReference, arrows) {
        const svg = resolveSvg(svgReference);

        if (!svg) {
            console.error(
                "[Grouping Target] SVGが見つかりません。",
                svgReference
            );
            return false;
        }

        svg.setAttribute("viewBox", "0 0 300 300");
        svg.innerHTML = "";

        drawRings(svg);
        drawScoreLabels(svg);
        drawXLabel(svg);

        const pinsGroup =
            createSvgElement("g");

        pinsGroup.setAttribute(
            "data-bas-grouping-pins",
            "true"
        );

        svg.appendChild(pinsGroup);

        renderPins(svg, arrows);

        return true;
    }

    /**
     * 的のリングを描画する
     *
     * @param {SVGElement} svg
     */
    function drawRings(svg) {
        const rings = [
            {
                radius: 150,
                fill: "#f7f7f4",
                stroke: "#6b7280"
            },
            {
                radius: 135,
                fill: "#f7f7f4",
                stroke: "#6b7280"
            },
            {
                radius: 120,
                fill: "#2f3136",
                stroke: "#f8fafc"
            },
            {
                radius: 105,
                fill: "#2f3136",
                stroke: "#f8fafc"
            },
            {
                radius: 90,
                fill: "#1996d3",
                stroke: "#111827"
            },
            {
                radius: 75,
                fill: "#1996d3",
                stroke: "#111827"
            },
            {
                radius: 60,
                fill: "#e53935",
                stroke: "#111827"
            },
            {
                radius: 45,
                fill: "#e53935",
                stroke: "#111827"
            },
            {
                radius: 30,
                fill: "#f6c915",
                stroke: "#111827"
            },
            {
                radius: 15,
                fill: "#f6c915",
                stroke: "#111827"
            },
            {
                radius: 7.5,
                fill: "none",
                stroke: "#111827"
            }
        ];

        rings.forEach(function (ring) {
            const circle =
                createSvgElement("circle");

            circle.setAttribute("cx", "150");
            circle.setAttribute("cy", "150");
            circle.setAttribute(
                "r",
                String(ring.radius)
            );
            circle.setAttribute("fill", ring.fill);
            circle.setAttribute(
                "stroke",
                ring.stroke
            );
            circle.setAttribute(
                "stroke-width",
                "0.7"
            );
            circle.setAttribute(
                "vector-effect",
                "non-scaling-stroke"
            );

            svg.appendChild(circle);
        });
    }

    /**
     * 得点数字を描画する
     *
     * @param {SVGElement} svg
     */
    function drawScoreLabels(svg) {
        const scoreLabels = [
            {
                score: "1",
                radius: 142.5,
                color: "#111827"
            },
            {
                score: "2",
                radius: 127.5,
                color: "#111827"
            },
            {
                score: "3",
                radius: 112.5,
                color: "#ffffff"
            },
            {
                score: "4",
                radius: 97.5,
                color: "#ffffff"
            },
            {
                score: "5",
                radius: 82.5,
                color: "#111827"
            },
            {
                score: "6",
                radius: 67.5,
                color: "#111827"
            },
            {
                score: "7",
                radius: 52.5,
                color: "#111827"
            },
            {
                score: "8",
                radius: 37.5,
                color: "#111827"
            },
            {
                score: "9",
                radius: 22.5,
                color: "#111827"
            },
            {
                score: "10",
                radius: 11.3,
                color: "#111827"
            }
        ];

        scoreLabels.forEach(function (label) {
            [-1, 1].forEach(function (direction) {
                const text =
                    createSvgElement("text");

                text.setAttribute(
                    "x",
                    String(
                        150 +
                        direction * label.radius
                    )
                );
                text.setAttribute("y", "150");
                text.setAttribute(
                    "fill",
                    label.color
                );
                text.setAttribute(
                    "font-size",
                    label.score === "10"
                        ? "6"
                        : "7"
                );
                text.setAttribute(
                    "font-weight",
                    "700"
                );
                text.setAttribute(
                    "text-anchor",
                    "middle"
                );
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
    }

    /**
     * 中央のXを描画する
     *
     * @param {SVGElement} svg
     */
    function drawXLabel(svg) {
        const xLabel =
            createSvgElement("text");

        xLabel.setAttribute("x", "150");
        xLabel.setAttribute("y", "150");
        xLabel.setAttribute(
            "fill",
            "#111827"
        );
        xLabel.setAttribute(
            "font-size",
            "5"
        );
        xLabel.setAttribute(
            "font-weight",
            "700"
        );
        xLabel.setAttribute(
            "text-anchor",
            "middle"
        );
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
    }

    /**
     * 矢のピンを描画する
     *
     * @param {SVGElement|string} svgReference
     * @param {Array} arrows
     */
    /**
 * 矢のピンを描画する
 *
 * @param {SVGElement|string} svgReference
 * @param {Array} arrows
 * @param {Object} options
 */
function renderPins(
    svgReference,
    arrows,
    options
) {
    const svg = resolveSvg(svgReference);

    if (!svg) {
        return false;
    }

    const renderOptions =
        createRenderOptions(options);

    let pinsGroup =
        svg.querySelector(
            "[data-bas-grouping-pins]"
        );

    if (!pinsGroup) {
        pinsGroup =
            createSvgElement("g");

        pinsGroup.setAttribute(
            "data-bas-grouping-pins",
            "true"
        );

        svg.appendChild(pinsGroup);
    }

    /*
     * 通常表示では以前のピンを消去する。
     * 比較表示では clear: false にして重ねる。
     */
    if (renderOptions.clear) {
        pinsGroup.innerHTML = "";
    }

    const groupingSource =
        Array.isArray(arrows)
            ? arrows
            : [];

    const seriesGroup =
        createSvgElement("g");

    seriesGroup.setAttribute(
        "data-bas-grouping-series",
        renderOptions.seriesName
    );

    pinsGroup.appendChild(seriesGroup);

    groupingSource.forEach(
        function (arrow, index) {
            if (!isValidArrow(arrow)) {
                return;
            }

            drawPin(
                seriesGroup,
                arrow,
                index,
                renderOptions
            );
        }
    );

    renderGroupingCenter(
        seriesGroup,
        groupingSource,
        renderOptions
    );

    return true;
}

    /**
     * 1本分のピンと番号を描画する
     */
    /**
 * 1本分のピンと番号を描画する
 */
function drawPin(
    pinsGroup,
    arrow,
    index,
    options
) {
    const x = Number(arrow.x);
    const y = Number(arrow.y);

    const pin =
        createSvgElement("circle");

    pin.setAttribute("cx", String(x));
    pin.setAttribute("cy", String(y));
    pin.setAttribute(
        "r",
        String(options.pinRadius)
    );
    pin.setAttribute(
        "fill",
        options.pinColor
    );
    pin.setAttribute(
        "stroke",
        options.pinStrokeColor
    );
    pin.setAttribute(
        "stroke-width",
        String(options.pinStrokeWidth)
    );
    pin.setAttribute(
        "vector-effect",
        "non-scaling-stroke"
    );

    pinsGroup.appendChild(pin);

    const pinNumber =
        createSvgElement("text");

    pinNumber.setAttribute(
        "x",
        String(x + 5)
    );
    pinNumber.setAttribute(
        "y",
        String(y + 3)
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
        options.numberColor
    );
    pinNumber.setAttribute(
        "stroke",
        options.numberStrokeColor
    );
    pinNumber.setAttribute(
        "stroke-width",
        "0.4"
    );
    pinNumber.setAttribute(
        "paint-order",
        "stroke"
    );
    pinNumber.setAttribute(
        "pointer-events",
        "none"
    );

    pinNumber.textContent =
        String(index + 1);

    pinsGroup.appendChild(pinNumber);
}

    /**
 * グルーピングの平均着弾位置を描画する
 */
function renderGroupingCenter(
    pinsGroup,
    arrows,
    options
) {
    const validArrows =
        arrows.filter(isValidArrow);

    if (validArrows.length === 0) {
        return;
    }

    const centerX =
        validArrows.reduce(
            function (sum, arrow) {
                return (
                    sum +
                    Number(arrow.x)
                );
            },
            0
        ) / validArrows.length;

    const centerY =
        validArrows.reduce(
            function (sum, arrow) {
                return (
                    sum +
                    Number(arrow.y)
                );
            },
            0
        ) / validArrows.length;

    const markerGroup =
        createSvgElement("g");

    markerGroup.setAttribute(
        "aria-label",
        options.centerLabel
    );

    const outerCircle =
        createSvgElement("circle");

    outerCircle.setAttribute(
        "cx",
        String(centerX)
    );
    outerCircle.setAttribute(
        "cy",
        String(centerY)
    );
    outerCircle.setAttribute("r", "7");
    outerCircle.setAttribute(
        "fill",
        "none"
    );
    outerCircle.setAttribute(
        "stroke",
        options.centerColor
    );
    outerCircle.setAttribute(
        "stroke-width",
        "2"
    );
    outerCircle.setAttribute(
        "vector-effect",
        "non-scaling-stroke"
    );

    markerGroup.appendChild(outerCircle);

    const horizontalLine =
        createSvgElement("line");

    horizontalLine.setAttribute(
        "x1",
        String(centerX - 10)
    );
    horizontalLine.setAttribute(
        "x2",
        String(centerX + 10)
    );
    horizontalLine.setAttribute(
        "y1",
        String(centerY)
    );
    horizontalLine.setAttribute(
        "y2",
        String(centerY)
    );
    horizontalLine.setAttribute(
        "stroke",
        options.centerColor
    );
    horizontalLine.setAttribute(
        "stroke-width",
        "1.8"
    );
    horizontalLine.setAttribute(
        "vector-effect",
        "non-scaling-stroke"
    );

    markerGroup.appendChild(
        horizontalLine
    );

    const verticalLine =
        createSvgElement("line");

    verticalLine.setAttribute(
        "x1",
        String(centerX)
    );
    verticalLine.setAttribute(
        "x2",
        String(centerX)
    );
    verticalLine.setAttribute(
        "y1",
        String(centerY - 10)
    );
    verticalLine.setAttribute(
        "y2",
        String(centerY + 10)
    );
    verticalLine.setAttribute(
        "stroke",
        options.centerColor
    );
    verticalLine.setAttribute(
        "stroke-width",
        "1.8"
    );
    verticalLine.setAttribute(
        "vector-effect",
        "non-scaling-stroke"
    );

    markerGroup.appendChild(verticalLine);

    const label =
        createSvgElement("text");

    label.setAttribute(
        "x",
        String(centerX + 10)
    );
    label.setAttribute(
        "y",
        String(centerY - 8)
    );
    label.setAttribute(
        "font-size",
        "8"
    );
    label.setAttribute(
        "font-weight",
        "bold"
    );
    label.setAttribute(
        "fill",
        options.centerColor
    );
    label.setAttribute(
        "stroke",
        options.centerLabelStrokeColor
    );
    label.setAttribute(
        "stroke-width",
        "0.5"
    );
    label.setAttribute(
        "paint-order",
        "stroke"
    );
    label.setAttribute(
        "pointer-events",
        "none"
    );

    label.textContent =
        options.centerLabel;

    markerGroup.appendChild(label);
    pinsGroup.appendChild(markerGroup);
}

/**
 * ピン描画設定を作成する
 *
 * optionsを省略した場合は、
 * 従来と同じ色と動作を使用する。
 */
function createRenderOptions(options) {
    const source =
        options &&
        typeof options === "object"
            ? options
            : {};

    return {
        pinColor:
            source.pinColor ||
            "#ec4899",

        pinStrokeColor:
            source.pinStrokeColor ||
            "#ffffff",

        pinStrokeWidth:
            Number.isFinite(
                Number(
                    source.pinStrokeWidth
                )
            )
                ? Number(
                    source.pinStrokeWidth
                )
                : 1.2,

        pinRadius:
            Number.isFinite(
                Number(source.pinRadius)
            )
                ? Number(source.pinRadius)
                : 4,

        numberColor:
            source.numberColor ||
            "#111827",

        numberStrokeColor:
            source.numberStrokeColor ||
            "#ffffff",

        centerColor:
            source.centerColor ||
            "#06b6d4",

        centerLabel:
            source.centerLabel ||
            "中心",

        centerLabelStrokeColor:
            source.centerLabelStrokeColor ||
            "#ffffff",

        seriesName:
            source.seriesName ||
            "default",

        clear:
            source.clear !== false
    };
}

    /**
     * 描画できる有効な矢か確認する
     */
    function isValidArrow(arrow) {
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
    }

    /**
     * IDまたはSVG要素から対象SVGを取得する
     */
    function resolveSvg(svgReference) {
        if (
            typeof svgReference === "string"
        ) {
            return document.getElementById(
                svgReference
            );
        }

        if (
            svgReference &&
            svgReference.namespaceURI ===
                SVG_NAMESPACE
        ) {
            return svgReference;
        }

        return null;
    }

    /**
     * SVG要素を作成する
     */
    function createSvgElement(tagName) {
        return document.createElementNS(
            SVG_NAMESPACE,
            tagName
        );
    }

    window.BAS_GROUPING_TARGET = {
        draw,
        renderPins
    };
})();