/**
 * Baika Archery System
 * Project Zero
 *
 * イラスト的の表示処理
 */

(function () {
    "use strict";

    document.addEventListener(
        "DOMContentLoaded",
        initializeIllustrationTarget
    );

    function initializeIllustrationTarget() {
        const svg = document.getElementById(
            "v4IllustrationTargetSvg"
        );

        const illustrationViewer = document.getElementById(
            "v4IllustrationTargetViewer"
        );

        const photoViewer = document.getElementById(
            "v4TargetPhotoViewer"
        );

        const illustrationPanel = illustrationViewer.closest(
            ".v4-photo-panel"
        );

        const photoButton = document.getElementById(
            "v4SelectPhotoTarget"
        );

        const illustrationButton = document.getElementById(
            "v4SelectIllustrationTarget"
        );

        if (
            !svg ||
            !illustrationViewer ||
            !photoViewer ||
            !photoButton ||
            !illustrationButton
        ) {
            return;
        }

        /*
         * 的の種類に応じてイラスト的を描画する
         */
        function updateIllustrationTargetType() {
            const isIndoorTriple =
                document.documentElement.classList.contains(
                    "v4-is-indoor-triple"
                );

            if (isIndoorTriple) {
                drawIndoorTripleIllustration(svg);
            } else {
                svg.setAttribute(
                    "viewBox",
                    "0 0 300 300"
                );

                drawIllustrationTarget(svg);
            }

            renderIllustrationPins(svg);
        }

        updateIllustrationTargetType();

        /*
         * 的の種類が変更されたら再描画する
         */
        const targetTypeSelect =
            document.getElementById(
                "v4TargetTypeSelect"
            );

        if (targetTypeSelect) {
            targetTypeSelect.addEventListener(
                "change",
                function () {
                    updateIllustrationTargetType();
                }
            );
        }

    /*
     * 右側の入力的でピン位置が変更されたら、
     * イラスト的のピンも更新する。
     */
        window.addEventListener(
            "baika:target-pin-updated",
            function () {
                renderIllustrationPins(svg);
            }
        );


        /*
         * 拡大時に表示する中央の照準
         */
        const crosshair = document.createElement("div");

        crosshair.setAttribute(
            "aria-hidden",
            "true"
        );

        Object.assign(crosshair.style, {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "46px",
            height: "46px",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: "8",
            display: "none",
            background:
                "linear-gradient(#111827,#111827) center / 1px 100% no-repeat," +
                "linear-gradient(#111827,#111827) center / 100% 1px no-repeat"
        });

        illustrationViewer.style.position = "relative";
        illustrationViewer.appendChild(crosshair);

        svg.style.touchAction = "none";

        /*
         * イラスト的の2段階ズームと着弾入力
         */
        let isZoomed = false;

        /*
         * 全画面表示から元の配置へ戻すための情報
         */
        let illustrationFocusRestore = null;

        /*
         * イラスト的の全画面表示を切り替える。
         * 写真入力と同じ左側パネルを使用する。
         */
        function setIllustrationFocusMode(enable) {
            if (!illustrationPanel) {
                return;
            }

            if (enable && !illustrationFocusRestore) {
                illustrationFocusRestore = {
                    parent: illustrationPanel.parentNode,
                    nextSibling: illustrationPanel.nextSibling,
                    scrollX: window.scrollX,
                    scrollY: window.scrollY,
                    bodyPosition: document.body.style.position,
                    bodyTop: document.body.style.top,
                    bodyLeft: document.body.style.left,
                    bodyWidth: document.body.style.width
                };

                document.body.appendChild(illustrationPanel);

                document.body.style.position = "fixed";
                document.body.style.top =
                    `-${illustrationFocusRestore.scrollY}px`;
                document.body.style.left =
                    `-${illustrationFocusRestore.scrollX}px`;
                document.body.style.width = "100%";
            } else if (!enable && illustrationFocusRestore) {
                const restore = illustrationFocusRestore;

                if (
                    restore.nextSibling &&
                    restore.nextSibling.parentNode === restore.parent
                ) {
                    restore.parent.insertBefore(
                        illustrationPanel,
                        restore.nextSibling
                    );
                } else {
                    restore.parent.appendChild(illustrationPanel);
                }

                document.body.style.position =
                    restore.bodyPosition;
                document.body.style.top = restore.bodyTop;
                document.body.style.left = restore.bodyLeft;
                document.body.style.width = restore.bodyWidth;

                illustrationFocusRestore = null;

                requestAnimationFrame(function () {
                    window.scrollTo(
                        restore.scrollX,
                        restore.scrollY
                    );
                });
            }

            document.documentElement.classList.toggle(
                "v4-illustration-focus-mode",
                enable
            );

            document.body.classList.toggle(
                "v4-illustration-focus-mode",
                enable
            );
        }

        /*
         * イラスト的の拡大率を変更する。
         * 現在の表示中心を維持する。
         *
         * 6 = 600%
         * 8 = 800%
         * 10 = 1000%
         */
        function setIllustrationZoom(scale) {
            if (!isZoomed) {
                return;
            }

            const viewBox = svg.viewBox.baseVal;

            const centerX =
                viewBox.x + viewBox.width / 2;

            const centerY =
                viewBox.y + viewBox.height / 2;

            const zoomSize = 300 / scale;

            const zoomX = Math.max(
                0,
                Math.min(
                    300 - zoomSize,
                    centerX - zoomSize / 2
                )
            );

            const zoomY = Math.max(
                0,
                Math.min(
                    300 - zoomSize,
                    centerY - zoomSize / 2
                )
            );

            svg.setAttribute(
                "viewBox",
                `${zoomX} ${zoomY} ${zoomSize} ${zoomSize}`
            );
        }

        /*
         * イラスト的の拡大率切り替えボタン
         */
        const illustrationZoom800Button =
            document.getElementById(
                "v4IllustrationZoom800"
            );

        const illustrationZoom1000Button =
            document.getElementById(
                "v4IllustrationZoom1000"
            );

        const illustrationBackToOverviewButton =
            document.getElementById(
                "v4IllustrationBackToOverview"
            );

        const illustrationFullscreenCloseButton =
            document.getElementById(
                "v4IllustrationFullscreenClose"
            );

        const illustrationUndoLastPinButton =
            document.getElementById(
                "v4IllustrationUndoLastPin"
            );

        if (illustrationUndoLastPinButton) {
            illustrationUndoLastPinButton.addEventListener(
                "click",
                function () {
                    if (
                        typeof window.baikaUndoIllustrationTargetArrow
                        !== "function"
                    ) {
                        return;
                    }

                    const removed =
                        window.baikaUndoIllustrationTargetArrow();

                    if (removed) {
                        renderIllustrationPins(svg);
                        updateIllustrationZoomButtons();
                    }
                }
            );
        }

        if (illustrationZoom800Button) {
            illustrationZoom800Button.addEventListener(
                "click",
                function () {
                    setIllustrationZoom(8);
                }
            );
        }

        if (illustrationZoom1000Button) {
            illustrationZoom1000Button.addEventListener(
                "click",
                function () {
                    setIllustrationZoom(10);
                }
            );
        }

        /*
         * イラスト的の拡大操作ボタンを表示・非表示にする。
         */
        function updateIllustrationZoomButtons() {
            const showButtons =
                isZoomed && !illustrationViewer.hidden;

            setIllustrationFocusMode(showButtons);

            if (illustrationZoom800Button) {
                illustrationZoom800Button.hidden =
                    !showButtons;
            }

            if (illustrationZoom1000Button) {
                illustrationZoom1000Button.hidden =
                    !showButtons;
            }

            if (illustrationBackToOverviewButton) {
                illustrationBackToOverviewButton.hidden =
                    !showButtons;
            }

            if (illustrationFullscreenCloseButton) {
                illustrationFullscreenCloseButton.hidden =
                    !showButtons;
            }

            if (illustrationUndoLastPinButton) {
                illustrationUndoLastPinButton.hidden =
                    !showButtons;

                const arrows =
                    typeof window.baikaGetIllustrationTargetArrows ===
                        "function"
                        ? window.baikaGetIllustrationTargetArrows()
                        : [];

                illustrationUndoLastPinButton.disabled =
                    !Array.isArray(arrows) ||
                    arrows.length === 0;
            }
        }

        function resetIllustrationZoom() {
            isZoomed = false;

            const isIndoorTriple =
                document.documentElement.classList.contains(
                    "v4-is-indoor-triple"
                );

            svg.setAttribute(
                "viewBox",
                isIndoorTriple
                    ? "0 0 300 900"
                    : "0 0 300 300"
            );

            crosshair.style.display = "none";

            updateIllustrationZoomButtons();
        }

        /*
         * 全体表示へ戻る
         * 着弾位置は確定せず、拡大表示だけ解除する。
         */
        if (illustrationBackToOverviewButton) {
            illustrationBackToOverviewButton.addEventListener(
                "click",
                function () {
                    resetIllustrationZoom();
                }
            );
        }

        /*
         * 入力的を確認
         * 着弾位置を追加せず、通常の入力画面へ戻る。
         */
        if (illustrationFullscreenCloseButton) {
            illustrationFullscreenCloseButton.addEventListener(
                "click",
                function () {
                    resetIllustrationZoom();
                }
            );
        }

        function getIllustrationPoint(event) {
            const point = svg.createSVGPoint();

            point.x = event.clientX;
            point.y = event.clientY;

            const matrix = svg.getScreenCTM();

            if (!matrix) {
                return null;
            }

            const result = point.matrixTransform(
                matrix.inverse()
            );

            const isIndoorTriple =
                document.documentElement.classList.contains(
                    "v4-is-indoor-triple"
                );

            const targetHeight =
                isIndoorTriple ? 900 : 300;

            return {
                x: Math.max(
                    0,
                    Math.min(300, result.x)
                ),
                y: Math.max(
                    0,
                    Math.min(targetHeight, result.y)
                )
            };
        }

        /*
         * 拡大中は指で的を動かす。
         * 十字カーソルは画面中央に固定する。
         */
        let dragStart = null;
        let suppressClick = false;

        svg.addEventListener(
            "pointerdown",
            function (event) {
                if (!isZoomed || !event.isPrimary) {
                    return;
                }

                if (
                    event.pointerType === "mouse" &&
                    event.button !== 0
                ) {
                    return;
                }

                const viewBox = svg.viewBox.baseVal;

                dragStart = {
                    pointerId: event.pointerId,
                    clientX: event.clientX,
                    clientY: event.clientY,
                    x: viewBox.x,
                    y: viewBox.y,
                    width: viewBox.width,
                    height: viewBox.height,
                    moved: false
                };

                svg.setPointerCapture(event.pointerId);
            }
        );

        svg.addEventListener(
            "pointermove",
            function (event) {
                if (
                    !dragStart ||
                    dragStart.pointerId !== event.pointerId
                ) {
                    return;
                }

                const rect = svg.getBoundingClientRect();

                if (!rect.width || !rect.height) {
                    return;
                }

                const dx = event.clientX - dragStart.clientX;
                const dy = event.clientY - dragStart.clientY;

                if (Math.hypot(dx, dy) > 5) {
                    dragStart.moved = true;
                }

                const x = Math.max(
                    0,
                    Math.min(
                        300 - dragStart.width,
                        dragStart.x -
                            dx * dragStart.width / rect.width
                    )
                );

                const isIndoorTriple =
                    document.documentElement.classList.contains(
                        "v4-is-indoor-triple"
                    );

                const targetHeight =
                    isIndoorTriple ? 900 : 300;

                const y = Math.max(
                    0,
                    Math.min(
                        targetHeight - dragStart.height,
                        dragStart.y -
                        dy * dragStart.height / rect.height
                    )
                );

                svg.setAttribute(
                    "viewBox",
                    `${x} ${y} ${dragStart.width} ${dragStart.height}`
                );
            }
        );

        function finishIllustrationDrag(event) {
            if (
                !dragStart ||
                dragStart.pointerId !== event.pointerId
            ) {
                return;
            }

            if (dragStart.moved) {
                suppressClick = true;
            }

            dragStart = null;
        }

        svg.addEventListener(
            "pointerup",
            finishIllustrationDrag
        );

        svg.addEventListener(
            "pointercancel",
            finishIllustrationDrag
        );

        svg.addEventListener(
            "click",
            function (event) {
                if (suppressClick) {
                    suppressClick = false;
                    return;
                }

                const point =
                    getIllustrationPoint(event);

                if (!point) {
                    return;
                }

                /*
                 * 1回目：タップ位置を中心に拡大
                 */
                if (!isZoomed) {
                    isZoomed = true;

                    const zoomSize = 50;

                    const zoomX = Math.max(
                        0,
                        Math.min(
                            300 - zoomSize,
                            point.x - zoomSize / 2
                        )
                    );

                    const isIndoorTriple =
                        document.documentElement.classList.contains(
                            "v4-is-indoor-triple"
                        );

                    const targetHeight =
                        isIndoorTriple ? 900 : 300;

                    const zoomY = Math.max(
                        0,
                        Math.min(
                            targetHeight - zoomSize,
                            point.y - zoomSize / 2
                        )
                    );

                    svg.setAttribute(
                        "viewBox",
                        `${zoomX} ${zoomY} ${zoomSize} ${zoomSize}`
                    );

                    crosshair.style.display = "block";

                    updateIllustrationZoomButtons();

                    return;
                }

                /*
                 * 2回目：着弾位置を確定
                 */
                if (
                    typeof window.baikaAddIllustrationTargetArrow
                    !== "function"
                ) {
                    resetIllustrationZoom();
                    return;
                }

                /*
                 * 2回目：
                 * タップ位置ではなく、
                 * 画面中央の十字カーソル位置で確定する。
                 */
                const rect =
                    svg.getBoundingClientRect();

                const centerPoint =
                    getIllustrationPoint({
                        clientX:
                            rect.left + rect.width / 2,
                        clientY:
                            rect.top + rect.height / 2
                    });

                if (!centerPoint) {
                    return;
                }

                const added =
                    window.baikaAddIllustrationTargetArrow(
                        centerPoint.x,
                        centerPoint.y
                    );

                if (added) {
                    renderIllustrationPins(svg);
                    updateIllustrationZoomButtons();
                }
            }
        );

        function switchTargetSource(mode) {
            const isIllustration =
                mode === "illustration";

            resetIllustrationZoom();

            illustrationViewer.hidden = !isIllustration;
            photoViewer.hidden = isIllustration;

            if (isIllustration) {
                renderIllustrationPins(svg);
            }

            photoButton.classList.toggle(
                "is-active",
                !isIllustration
            );

            illustrationButton.classList.toggle(
                "is-active",
                isIllustration
            );

            photoButton.setAttribute(
                "aria-pressed",
                String(!isIllustration)
            );

            illustrationButton.setAttribute(
                "aria-pressed",
                String(isIllustration)
            );
        }

        photoButton.addEventListener(
            "click",
            function () {
                switchTargetSource("photo");
            }
        );

        illustrationButton.addEventListener(
            "click",
            function () {
                switchTargetSource("illustration");
            }
        );

        switchTargetSource("photo");
    }

    /*
     * 現在入力中の着弾位置を
     * イラスト的にも表示する。
     */
    function renderIllustrationPins(svg) {
        const SVG_NS =
            "http://www.w3.org/2000/svg";

        let pinsGroup = svg.querySelector(
            "#v4IllustrationPinsGroup"
        );

        if (!pinsGroup) {
            pinsGroup = document.createElementNS(
                SVG_NS,
                "g"
            );

            pinsGroup.setAttribute(
                "id",
                "v4IllustrationPinsGroup"
            );

            svg.appendChild(pinsGroup);
        }

        pinsGroup.innerHTML = "";

        if (
            typeof window.baikaGetIllustrationTargetArrows
            !== "function"
        ) {
            return;
        }

        const arrows =
            window.baikaGetIllustrationTargetArrows();

        arrows.forEach(function (arrow, index) {
            const x = Number(arrow.x);
            const y = Number(arrow.y);

            if (
                !Number.isFinite(x) ||
                !Number.isFinite(y)
            ) {
                return;
            }

            const pin = document.createElementNS(
                SVG_NS,
                "circle"
            );

            pin.setAttribute("cx", String(x));
            pin.setAttribute("cy", String(y));
            pin.setAttribute("r", "4");
            pin.setAttribute("fill", "#22c55e");
            pin.setAttribute("stroke", "#ffffff");
            pin.setAttribute("stroke-width", "1.2");

            pinsGroup.appendChild(pin);
        });
    }

    function drawIllustrationTarget(svg) {
        svg.innerHTML = "";

        const SVG_NS =
            "http://www.w3.org/2000/svg";

        const colors = [
            "#ffffff",
            "#ffffff",
            "#111827",
            "#111827",
            "#38bdf8",
            "#38bdf8",
            "#ef4444",
            "#ef4444",
            "#facc15",
            "#facc15"
        ];

        for (let score = 1; score <= 10; score++) {
            const circle = document.createElementNS(
                SVG_NS,
                "circle"
            );

            circle.setAttribute("cx", "150");
            circle.setAttribute("cy", "150");
            circle.setAttribute(
                "r",
                String((11 - score) * 15)
            );
            circle.setAttribute(
                "fill",
                colors[score - 1]
            );
            circle.setAttribute(
                "stroke",
                "#374151"
            );
            circle.setAttribute(
                "stroke-width",
                "0.6"
            );

            svg.appendChild(circle);
        }

        const xRing = document.createElementNS(
            SVG_NS,
            "circle"
        );

        xRing.setAttribute("cx", "150");
        xRing.setAttribute("cy", "150");
        xRing.setAttribute("r", "7.5");
        xRing.setAttribute("fill", "none");
        xRing.setAttribute("stroke", "#374151");
        xRing.setAttribute("stroke-width", "0.6");

        svg.appendChild(xRing);
    }

    /**
     * インドア縦3連的を描画する
     * 上段・中段・下段の6～10点帯
     */
    function drawIndoorTripleIllustration(svg) {
        svg.innerHTML = "";
        svg.setAttribute("viewBox", "0 0 300 900");

        const SVG_NS =
            "http://www.w3.org/2000/svg";

        const faces = [
            { cy: 150, label: "上段" },
            { cy: 450, label: "中段" },
            { cy: 750, label: "下段" }
        ];

        const rings = [
            { radius: 150, fill: "#38bdf8" },
            { radius: 120, fill: "#ef4444" },
            { radius: 90, fill: "#ef4444" },
            { radius: 60, fill: "#facc15" },
            { radius: 30, fill: "#facc15" }
        ];

        faces.forEach(function (face) {
            rings.forEach(function (ring) {
                const circle = document.createElementNS(
                    SVG_NS,
                    "circle"
                );

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
                    "#374151"
                );
                circle.setAttribute(
                    "stroke-width",
                    "0.6"
                );

                svg.appendChild(circle);
            });

            const xRing = document.createElementNS(
                SVG_NS,
                "circle"
            );

            xRing.setAttribute("cx", "150");
            xRing.setAttribute(
                "cy",
                String(face.cy)
            );
            xRing.setAttribute("r", "15");
            xRing.setAttribute("fill", "none");
            xRing.setAttribute("stroke", "#374151");
            xRing.setAttribute(
                "stroke-width",
                "0.6"
            );

            svg.appendChild(xRing);

            const label = document.createElementNS(
                SVG_NS,
                "text"
            );

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
    
})();