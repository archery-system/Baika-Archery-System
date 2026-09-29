/**
 * Baika Archery System
 * Project Zero
 * Form Video Frame Analysis
 */

(function () {
    "use strict";

    const DB_NAME =
        "baika-archery-form-video-local";

    const DB_VERSION =
        1;

    const VIDEO_STORE_NAME =
        "formVideos";

    let databasePromise =
        null;

    let currentVideoUrl =
        "";

    document.addEventListener(
        "DOMContentLoaded",
        initializeFrameAnalysis
    );

    async function initializeFrameAnalysis() {
        const list =
            document.getElementById(
                "frameAnalysisVideoList"
            );

        if (!list) {
            return;
        }

        bindFrameStepButtons();

        try {
            const videos =
                await getAllFormVideos();

            videos.sort(function (a, b) {
                return (
                    new Date(
                        b.createdAt || 0
                    ).getTime() -
                    new Date(
                        a.createdAt || 0
                    ).getTime()
                );
            });

            renderVideoList(
                list,
                videos
            );

        } catch (error) {
            console.error(
                "Frame analysis video load failed:",
                error
            );

            list.textContent =
                "フォーム動画を読み込めませんでした。";
        }
    }

    function openDatabase() {
        if (databasePromise) {
            return databasePromise;
        }

        databasePromise =
            new Promise(function (
                resolve,
                reject
            ) {
                const request =
                    indexedDB.open(
                        DB_NAME,
                        DB_VERSION
                    );

                request.onsuccess =
                    function () {
                        resolve(
                            request.result
                        );
                    };

                request.onerror =
                    function () {
                        reject(
                            request.error
                        );
                    };
            });

        return databasePromise;
    }

    async function getAllFormVideos() {
        const db =
            await openDatabase();

        return new Promise(function (
            resolve,
            reject
        ) {
            const transaction =
                db.transaction(
                    VIDEO_STORE_NAME,
                    "readonly"
                );

            const request =
                transaction
                    .objectStore(
                        VIDEO_STORE_NAME
                    )
                    .getAll();

            request.onsuccess =
                function () {
                    resolve(
                        Array.isArray(
                            request.result
                        )
                            ? request.result
                            : []
                    );
                };

            request.onerror =
                function () {
                    reject(
                        request.error
                    );
                };
        });
    }

    function renderVideoList(
        list,
        videos
    ) {
        list.replaceChildren();

        if (
            !Array.isArray(videos) ||
            videos.length === 0
        ) {
            list.textContent =
                "保存されているフォーム動画はありません。";

            return;
        }

        videos.forEach(function (
            record
        ) {
            if (
                !record ||
                !(record.blob instanceof Blob)
            ) {
                return;
            }

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.style.cssText = [
                "width: 100%",
                "padding: 14px 16px",
                "border: 1px solid rgba(79, 38, 131, 0.18)",
                "border-radius: 14px",
                "font: inherit",
                "text-align: left",
                "cursor: pointer",
                "color: #351c57",
                "background: #ffffff"
            ].join(";");

            const createdAt =
                formatDateTime(
                    record.createdAt
                );

            const size =
                formatFileSize(
                    record.size
                );

            button.innerHTML =
                "<strong>🎥 " +
                escapeHtml(createdAt) +
                "</strong>" +
                "<br>" +
                "<span style=\"" +
                "font-size: 0.9rem;" +
                "color: #6b5b7d;" +
                "\">" +
                escapeHtml(size) +
                "</span>";

            button.addEventListener(
                "click",
                function () {
                    showSelectedVideo(
                        record
                    );
                }
            );

            list.appendChild(
                button
            );
        });
    }

    function showSelectedVideo(
        record
    ) {
        const area =
            document.getElementById(
                "frameAnalysisArea"
            );

        const videoArea =
            document.getElementById(
                "frameAnalysisVideoArea"
            );

        const timeDisplay =
            document.getElementById(
                "frameAnalysisCurrentTime"
            );

        if (
            !area ||
            !videoArea ||
            !(record.blob instanceof Blob)
        ) {
            return;
        }

        releaseCurrentVideoUrl();

        currentVideoUrl =
            URL.createObjectURL(
                record.blob
            );

        const video =
            document.createElement(
                "video"
            );

        video.id =
            "frameAnalysisVideo";

        video.src =
            currentVideoUrl;

        video.controls =
            true;

        video.playsInline =
            true;

        video.preload =
            "metadata";

        video.style.cssText = [
            "display: block",
            "width: 100%",
            "max-width: 720px",
            "margin: 0 auto",
            "border-radius: 12px",
            "background: #000000"
        ].join(";");

        video.addEventListener(
            "loadedmetadata",
            function () {
                updateTimeDisplay(
                    video,
                    timeDisplay
                );
            }
        );

        video.addEventListener(
            "timeupdate",
            function () {
                updateTimeDisplay(
                    video,
                    timeDisplay
                );
            }
        );

        videoArea.replaceChildren(
            video
        );

        area.style.display =
            "block";

        if (timeDisplay) {
            timeDisplay.textContent =
                "0.0 秒";
        }

        area.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function bindFrameStepButtons() {
        const prevButton =
            document.getElementById(
                "frameAnalysisPrevButton"
            );

        const nextButton =
            document.getElementById(
                "frameAnalysisNextButton"
            );

        if (
            !prevButton ||
            !nextButton
        ) {
            return;
        }

        prevButton.addEventListener(
            "click",
            function () {
                stepVideoTime(-0.1);
            }
        );

        nextButton.addEventListener(
            "click",
            function () {
                stepVideoTime(0.1);
            }
        );
    }

    function stepVideoTime(
        seconds
    ) {
        const video =
            document.getElementById(
                "frameAnalysisVideo"
            );

        const timeDisplay =
            document.getElementById(
                "frameAnalysisCurrentTime"
            );

        if (!video) {
            return;
        }

        video.pause();

        const currentTime =
            Number(
                video.currentTime || 0
            );

        const duration =
            Number(
                video.duration
            );

        let nextTime =
            currentTime +
            Number(seconds || 0);

        nextTime =
            Math.max(
                0,
                nextTime
            );

        if (
            Number.isFinite(duration) &&
            duration > 0
        ) {
            nextTime =
                Math.min(
                    duration,
                    nextTime
                );
        }

        /*
         * 小数計算による
         * 0.30000000000000004 のような
         * 誤差を抑える。
         */
        nextTime =
            Math.round(
                nextTime * 10
            ) / 10;

        video.currentTime =
            nextTime;

        updateTimeDisplay(
            video,
            timeDisplay
        );
    }


    function updateTimeDisplay(
        video,
        element
    ) {
        if (
            !video ||
            !element
        ) {
            return;
        }

        const currentTime =
            Number(
                video.currentTime || 0
            );

        const duration =
            Number(
                video.duration || 0
            );

        element.textContent =
            currentTime.toFixed(1) +
            " 秒 / " +
            (
                Number.isFinite(duration)
                    ? duration.toFixed(1)
                    : "0.0"
            ) +
            " 秒";
    }

    function releaseCurrentVideoUrl() {
        if (!currentVideoUrl) {
            return;
        }

        URL.revokeObjectURL(
            currentVideoUrl
        );

        currentVideoUrl =
            "";
    }

    function formatDateTime(
        value
    ) {
        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "日時不明";
        }

        return date.toLocaleString(
            "ja-JP"
        );
    }

    function formatFileSize(
        value
    ) {
        const bytes =
            Number(value || 0);

        if (
            !Number.isFinite(bytes) ||
            bytes <= 0
        ) {
            return "サイズ不明";
        }

        if (bytes < 1024) {
            return (
                bytes +
                " B"
            );
        }

        if (
            bytes <
            1024 * 1024
        ) {
            return (
                (
                    bytes /
                    1024
                ).toFixed(1) +
                " KB"
            );
        }

        return (
            (
                bytes /
                (
                    1024 *
                    1024
                )
            ).toFixed(1) +
            " MB"
        );
    }

    function escapeHtml(
        value
    ) {
        return String(
            value == null
                ? ""
                : value
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    window.addEventListener(
        "pagehide",
        releaseCurrentVideoUrl
    );

})();