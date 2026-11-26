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
     * @param {string} targetType
     */
    function draw(
        svgReference,
        arrows,
        targetType = "normal"
    ) {
        const svg = resolveSvg(svgReference);

        if (!svg) {
            console.error(
                "[Grouping Target] SVGが見つかりません。",
                svgReference
            );
            return false;
        }

        const isIndoorTriple =
            targetType === "indoor-triple";

        svg.setAttribute(
            "data-target-type",
            isIndoorTriple
                ? "indoor-triple"
                : "normal"
        );

        svg.setAttribute(
            "viewBox",
            isIndoorTriple
                ? "0 0 300 900"
                : "0 0 300 300"
        );

        svg.innerHTML = "";

        if (isIndoorTriple) {
            drawIndoorTripleRings(svg);
        } else {
            drawRings(svg);
            drawScoreLabels(svg);
            drawXLabel(svg);
        }

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
     * インドア縦3連的のリングを描画する
     *
     * @param {SVGElement} svg
     */
    function drawIndoorTripleRings(svg) {
        const faces = [
            { cy: 150, label: "上段" },
            { cy: 450, label: "中段" },
            { cy: 750, label: "下段" }
        ];

        const rings = [
            { radius: 150, fill: "#1996d3" },
            { radius: 120, fill: "#e53935" },
            { radius: 90, fill: "#e53935" },
            { radius: 60, fill: "#f6c915" },
            { radius: 30, fill: "#f6c915" },
            { radius: 15, fill: "none" }
        ];

        faces.forEach(function (face) {
            rings.forEach(function (ring) {
                const circle =
                    createSvgElement("circle");

                circle.setAttribute("cx", "150");
                circle.setAttribute(
                    "cy",
                    String(face.cy)
                );
                circle.setAttribute(
                    "r",
                    String(ring.radius)
                );
                circle.setAttribute(
                    "fill",
                    ring.fill
                );
                circle.setAttribute(
                    "stroke",
                    "#111827"
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

            const label =
                createSvgElement("text");

            label.setAttribute("x", "150");
            label.setAttribute(
                "y",
                String(face.cy - 135)
            );
            label.setAttribute(
                "text-anchor",
                "middle"
            );
            label.setAttribute(
                "font-size",
                "12"
            );
            label.setAttribute(
                "font-weight",
                "700"
            );
            label.setAttribute(
                "fill",
                "#ffffff"
            );
            label.setAttribute(
                "pointer-events",
                "none"
            );

            label.textContent = face.label;

            svg.appendChild(label);
        });
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

    const isIndoorTriple =
        svg.getAttribute(
            "data-target-type"
        ) === "indoor-triple";

    const targetHeight =
        isIndoorTriple ? 900 : 300;

    groupingSource.forEach(
        function (arrow, index) {
            if (!isValidArrow(arrow, targetHeight)) {
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

    /*
     * 的の種類に応じて
     * グルーピング中心を描画する。
     */
    if (isIndoorTriple) {
        const faceRanges = [
            { minY: 0, maxY: 300 },
            { minY: 300, maxY: 600 },
            { minY: 600, maxY: 900 }
        ];

        faceRanges.forEach(
            function (range, faceIndex) {
                const faceArrows =
                    groupingSource.filter(
                        function (arrow) {
                            if (!isValidArrow(arrow, targetHeight)) {
                                return false;
                            }

                            const y =
                                Number(arrow.y);

                            return (
                                y >= range.minY &&
                                (
                                    faceIndex === 2
                                        ? y <= range.maxY
                                        : y < range.maxY
                                )
                            );
                        }
                    );

                if (faceArrows.length > 0) {
                    renderGroupingCenter(
                        seriesGroup,
                        faceArrows,
                        renderOptions
                    );
                }
            }
        );
    } else {
        const validGroupingArrows =
            groupingSource.filter(
                function (arrow) {
                    return isValidArrow(
                        arrow,
                        targetHeight
                    );
                }
            );

        renderGroupingCenter(
            seriesGroup,
            validGroupingArrows,
            renderOptions
        );
    }

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
            arrows.filter(
                function (arrow) {
                    return isValidArrow(arrow);
                }
            );

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

    /*
     * グルーピング中心に白色の縁取りを追加する。
     * 的と中心マーカーが同系色でも
     * 着弾中心を識別できるようにする。
     */
    const outlineGroup =
        createSvgElement("g");

    [
        outerCircle,
        horizontalLine,
        verticalLine
    ].forEach(function (element) {
        const outline =
            element.cloneNode(true);

        outline.setAttribute(
            "stroke",
            "#ffffff"
        );

        outline.setAttribute(
            "stroke-width",
            String(
                Number(
                    element.getAttribute(
                        "stroke-width"
                    )
                ) + 2.5
            )
        );

        outlineGroup.appendChild(
            outline
        );
    });

    markerGroup.insertBefore(
        outlineGroup,
        markerGroup.firstChild
    );

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
    function isValidArrow(
            arrow,
            targetHeight = 900
    ) {
            if (!arrow) {
                return false;
            }

            const scoreLabel =
                String(
                    arrow.val != null
                        ? arrow.val
                        : arrow.score ?? ""
                )
                    .trim()
                    .toUpperCase();

            const isMiss =
                arrow.isMiss === true ||
                scoreLabel === "M";

            if (
                isMiss ||
                arrow.x == null ||
                arrow.y == null
            ) {
                return false;
            }

            const x = Number(arrow.x);
            const y = Number(arrow.y);

            /*
             * 入力用的の座標範囲を確認する。
             * 写真上の座標など、範囲外のデータは
             * 描画と中心計算の対象から除外する。
             */
            return (
                Number.isFinite(x) &&
                Number.isFinite(y) &&
                x >= 0 &&
                x <= 300 &&
                y >= 0 &&
                y <= targetHeight
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