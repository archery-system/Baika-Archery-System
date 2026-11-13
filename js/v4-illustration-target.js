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

        drawIllustrationTarget(svg);

        /*
         * イラスト的の2段階ズームと着弾入力
         */
        let isZoomed = false;

        function resetIllustrationZoom() {
            isZoomed = false;

            svg.setAttribute(
                "viewBox",
                "0 0 300 300"
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

            return {
                x: Math.max(
                    0,
                    Math.min(300, result.x)
                ),
                y: Math.max(
                    0,
                    Math.min(300, result.y)
                )
            };
        }

        svg.addEventListener(
            "click",
            function (event) {
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

                    const zoomY = Math.max(
                        0,
                        Math.min(
                            300 - zoomSize,
                            point.y - zoomSize / 2
                        )
                    );

                    svg.setAttribute(
                        "viewBox",
                        `${zoomX} ${zoomY} ${zoomSize} ${zoomSize}`
                    );

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

                const added =
                    window.baikaAddIllustrationTargetArrow(
                        point.x,
                        point.y
                    );

                if (added) {
                    resetIllustrationZoom();
                }
            }
        );

        function switchTargetSource(mode) {
            const isIllustration =
                mode === "illustration";

            resetIllustrationZoom();

            illustrationViewer.hidden = !isIllustration;
            photoViewer.hidden = isIllustration;

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
})();