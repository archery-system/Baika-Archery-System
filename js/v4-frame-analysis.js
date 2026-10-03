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

    let frameStepTimer =
        null;

    let frameStepStarted =
        false;

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

    async function createFormVideoPoster(
        blob
    ) {
        if (!(blob instanceof Blob)) {
            return "";
        }

        const video =
            document.createElement(
                "video"
            );

        const videoUrl =
            URL.createObjectURL(
                blob
            );

        try {
            video.src =
                videoUrl;

            video.preload =
                "auto";

            video.muted =
                true;

            video.playsInline =
                true;

            await new Promise(function (
                resolve,
                reject
            ) {
                if (
                    video.readyState >= 2 &&
                    video.videoWidth > 0 &&
                    video.videoHeight > 0
                ) {
                    resolve();

                    return;
                }

                video.addEventListener(
                    "loadeddata",
                    resolve,
                    {
                        once:
                            true
                    }
                );

                video.addEventListener(
                    "error",
                    reject,
                    {
                        once:
                            true
                    }
                );

                video.load();
            });

            const duration =
                Number(
                    video.duration || 0
                );

            const targetTime =
                Number.isFinite(duration) &&
                    duration > 0
                    ? Math.min(
                        0.5,
                        Math.max(
                            0,
                            duration / 2
                        )
                    )
                    : 0;

            if (targetTime > 0) {
                await new Promise(function (
                    resolve,
                    reject
                ) {
                    video.addEventListener(
                        "seeked",
                        resolve,
                        {
                            once:
                                true
                        }
                    );

                    video.addEventListener(
                        "error",
                        reject,
                        {
                            once:
                                true
                        }
                    );

                    video.currentTime =
                        targetTime;
                });
            }

            if (
                !video.videoWidth ||
                !video.videoHeight
            ) {
                return "";
            }

            const canvas =
                document.createElement(
                    "canvas"
                );

            canvas.width =
                video.videoWidth;

            canvas.height =
                video.videoHeight;

            const context =
                canvas.getContext(
                    "2d"
                );

            if (!context) {
                return "";
            }

            context.drawImage(
                video,
                0,
                0,
                canvas.width,
                canvas.height
            );

            return canvas.toDataURL(
                "image/jpeg",
                0.8
            );

        } catch (error) {
            console.warn(
                "Frame analysis poster creation failed:",
                error
            );

            return "";

        } finally {
            video.removeAttribute(
                "src"
            );

            video.load();

            URL.revokeObjectURL(
                videoUrl
            );
        }
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

            const thumbnail =
                document.createElement(
                    "img"
                );

            thumbnail.alt =
                "フォーム動画のサムネイル";

            thumbnail.style.cssText = [
                "display: none",
                "width: 100%",
                "max-height: 320px",
                "margin-bottom: 10px",
                "border-radius: 10px",
                "object-fit: contain",
                "background: #000000"
            ].join(";");

            const info =
                document.createElement(
                    "div"
                );

            info.innerHTML =
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

            button.appendChild(
                thumbnail
            );

            button.appendChild(
                info
            );

            createFormVideoPoster(
                record.blob
            ).then(function (
                poster
            ) {
                if (!poster) {
                    return;
                }

                thumbnail.src =
                    poster;

                thumbnail.style.display =
                    "block";
            });

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
            false;

        video.playsInline =
            true;

        video.preload =
            "metadata";

        video.disablePictureInPicture =
            true;

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

        bindFrameStepButton(
            prevButton,
            -0.1
        );

        bindFrameStepButton(
            nextButton,
            0.1
        );
    }

    function bindFrameStepButton(
        button,
        seconds
    ) {
        button.addEventListener(
            "pointerdown",
            function (event) {
                event.preventDefault();

                stopFrameStep();

                frameStepStarted =
                    false;

                /*
                 * タップした瞬間は
                 * 今までどおり0.1秒移動する。
                 */
                stepVideoTime(
                    seconds
                );

                /*
                 * 長押し開始まで少し待つ。
                 */
                frameStepTimer =
                    window.setTimeout(
                        function () {
                            frameStepStarted =
                                true;

                            startAcceleratingFrameStep(
                                seconds,
                                0
                            );
                        },
                        350
                    );
            }
        );

        button.addEventListener(
            "pointerup",
            stopFrameStep
        );

        button.addEventListener(
            "pointercancel",
            stopFrameStep
        );

        button.addEventListener(
            "pointerleave",
            function (event) {
                if (
                    event.pointerType ===
                    "mouse"
                ) {
                    stopFrameStep();
                }
            }
        );

        /*
         * iPhoneの長押し時に
         * テキスト選択などが起きるのを防ぐ。
         */
        button.style.touchAction =
            "none";

        button.style.userSelect =
            "none";

        button.style.webkitUserSelect =
            "none";
    }

    function startAcceleratingFrameStep(
        seconds,
        repeatCount
    ) {
        if (!frameStepStarted) {
            return;
        }

        stepVideoTime(
            seconds
        );

        /*
         * 押し続けるほど待ち時間を短くする。
         *
         * 0～4回   : 240ms
         * 5～9回   : 180ms
         * 10～17回 : 130ms
         * 18回以降 : 90ms
         */
        let delay =
            240;

        if (repeatCount >= 18) {
            delay =
                90;

        } else if (repeatCount >= 10) {
            delay =
                130;

        } else if (repeatCount >= 5) {
            delay =
                180;
        }

        frameStepTimer =
            window.setTimeout(
                function () {
                    startAcceleratingFrameStep(
                        seconds,
                        repeatCount + 1
                    );
                },
                delay
            );
    }

    function stopFrameStep() {
        if (
            frameStepTimer !==
            null
        ) {
            window.clearTimeout(
                frameStepTimer
            );

            window.clearInterval(
                frameStepTimer
            );

            frameStepTimer =
                null;
        }

        frameStepStarted =
            false;
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