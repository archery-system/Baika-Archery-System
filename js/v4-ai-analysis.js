/**
 * Baika Archery System
 * Project Zero
 * AI Analysis
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

    let objectUrls =
        [];

    document.addEventListener(
        "DOMContentLoaded",
        initializeAiAnalysis
    );

    window.addEventListener(
        "pagehide",
        releaseObjectUrls
    );

    function initializeAiAnalysis() {
        loadFormVideosForAi();
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

    async function loadFormVideosForAi() {
        const list =
            document.getElementById(
                "aiFormVideoList"
            );

        if (!list) {
            return;
        }

        try {
            const videos =
                await getAllFormVideos();

            videos.sort(function (
                a,
                b
            ) {
                return (
                    new Date(
                        b.createdAt || 0
                    ).getTime() -
                    new Date(
                        a.createdAt || 0
                    ).getTime()
                );
            });

            renderFormVideosForAi(
                list,
                videos
            );

        } catch (error) {
            console.error(
                "AI form video load failed:",
                error
            );

            list.textContent =
                "フォーム動画を読み込めませんでした。";
        }
    }

    function renderFormVideosForAi(
        list,
        videos
    ) {
        releaseObjectUrls();

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

            const card =
                document.createElement(
                    "article"
                );

            card.style.padding =
                "16px";

            card.style.border =
                "1px solid rgba(79, 38, 131, 0.16)";

            card.style.borderRadius =
                "16px";

            card.style.background =
                "#fff";

            const video =
                document.createElement(
                    "video"
                );

            const videoUrl =
                URL.createObjectURL(
                    record.blob
                );

            objectUrls.push(
                videoUrl
            );

            video.src =
                videoUrl;

            video.controls =
                true;

            video.playsInline =
                true;

            video.preload =
                "metadata";

            video.style.width =
                "100%";

            video.style.borderRadius =
                "12px";

            const createdAt =
                document.createElement(
                    "p"
                );

            createdAt.style.margin =
                "10px 0 0";

            createdAt.style.color =
                "#625b6b";

            const createdDate =
                new Date(
                    record.createdAt || ""
                );

            createdAt.textContent =
                Number.isNaN(
                    createdDate.getTime()
                )
                    ? "撮影日時：不明"
                    : "撮影日時：" +
                    createdDate.toLocaleString(
                        "ja-JP"
                    );

            const selectButton =
                document.createElement(
                    "button"
                );

            selectButton.type =
                "button";

            selectButton.textContent =
                "🤖 この動画をAI評価";

            selectButton.style.width =
                "100%";

            selectButton.style.marginTop =
                "12px";

            selectButton.style.padding =
                "12px";

            selectButton.style.border =
                "0";

            selectButton.style.borderRadius =
                "12px";

            selectButton.style.color =
                "#fff";

            selectButton.style.background =
                "#4f2683";

            selectButton.disabled =
                false;

            selectButton.addEventListener(
                "click",
                function () {
                    extractFormVideoFramesForAi(
                        record
                    );
                }
            );

            card.appendChild(
                video
            );

            card.appendChild(
                createdAt
            );

            card.appendChild(
                selectButton
            );

            list.appendChild(
                card
            );
        });
    }

    async function extractFormVideoFramesForAi(
        record
    ) {
        if (
            !record ||
            !(record.blob instanceof Blob)
        ) {
            window.alert(
                "AI評価する動画を読み込めませんでした。"
            );

            return;
        }

        const analysisArea =
            document.getElementById(
                "aiFormVideoAnalysisArea"
            );

        const preview =
            document.getElementById(
                "aiFormVideoFramePreview"
            );

        const result =
            document.getElementById(
                "aiFormVideoResult"
            );

        if (
            !analysisArea ||
            !preview ||
            !result
        ) {
            return;
        }

        analysisArea.style.display =
            "block";

        preview.replaceChildren();

        result.textContent =
            "動画からAI分析用の静止画を取得しています…";

        const video =
            document.createElement(
                "video"
            );

        const videoUrl =
            URL.createObjectURL(
                record.blob
            );

        video.src =
            videoUrl;

        video.preload =
            "auto";

        video.muted =
            true;

        video.playsInline =
            true;

        try {
            await waitForVideoMetadata(
                video
            );

            const duration =
                Number(
                    video.duration || 0
                );

            if (
                !Number.isFinite(duration) ||
                duration <= 0
            ) {
                throw new Error(
                    "Video duration is invalid."
                );
            }

            const ratios =
                [
                    0.15,
                    0.35,
                    0.55,
                    0.75,
                    0.90
                ];

            const frames =
                [];

            for (
                const ratio of ratios
            ) {
                const targetTime =
                    duration * ratio;

                await seekVideo(
                    video,
                    targetTime
                );

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
                    continue;
                }

                context.drawImage(
                    video,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const image =
                    document.createElement(
                        "img"
                    );

                const frameDataUrl =
                    canvas.toDataURL(
                        "image/jpeg",
                        0.85
                    );

                frames.push(
                    frameDataUrl
                );

                image.src =
                    frameDataUrl;

                image.alt =
                    "AI分析用フォーム画像";

                image.style.width =
                    "100%";

                image.style.borderRadius =
                    "12px";

                preview.appendChild(
                    image
                );
            }

            result.textContent =
                "AIへフォーム画像を送信しています…";

            const analysisResponse =
                await sendFormVideoFramesToAi(
                    frames
                );

            if (
                !analysisResponse ||
                analysisResponse.success !==
                true
            ) {
                throw new Error(
                    analysisResponse &&
                        analysisResponse.message
                        ? analysisResponse.message
                        : "AI評価に失敗しました。"
                );
            }

            result.textContent =
                analysisResponse.analysis ||
                "フォーム画像を確認しました。";

            analysisArea.scrollIntoView({
                behavior:
                    "smooth",
                block:
                    "start"
            });

        } catch (error) {
            console.error(
                "Form video AI analysis failed:",
                error
            );

            result.textContent =
                error &&
                    error.message
                    ? error.message
                    : "フォーム動画のAI評価に失敗しました。";

        } finally {
            URL.revokeObjectURL(
                videoUrl
            );
        }
    }

    /**
 * 抽出したフォーム画像を
 * GASへ送信する。
 */
    async function sendFormVideoFramesToAi(
        frames
    ) {
        if (
            !Array.isArray(frames) ||
            frames.length === 0
        ) {
            throw new Error(
                "送信するフォーム画像がありません。"
            );
        }

        if (
            typeof V4_GAS_API_URL ===
            "undefined" ||
            !V4_GAS_API_URL
        ) {
            throw new Error(
                "GAS API URLが設定されていません。"
            );
        }

        const response =
            await fetch(
                V4_GAS_API_URL,
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify({
                            action:
                                "analyzeFormVideo",

                            frames:
                                frames
                        }),

                    cache:
                        "no-store"
                }
            );

        const data =
            await response.json();

        return data;
    }

    function waitForVideoMetadata(
        video
    ) {
        return new Promise(function (
            resolve,
            reject
        ) {
            if (
                video.readyState >= 1 &&
                Number.isFinite(
                    video.duration
                )
            ) {
                resolve();

                return;
            }

            video.addEventListener(
                "loadedmetadata",
                function () {
                    resolve();
                },
                {
                    once:
                        true
                }
            );

            video.addEventListener(
                "error",
                function () {
                    reject(
                        new Error(
                            "Video metadata load failed."
                        )
                    );
                },
                {
                    once:
                        true
                }
            );
        });
    }

    function seekVideo(
        video,
        time
    ) {
        return new Promise(function (
            resolve,
            reject
        ) {
            video.addEventListener(
                "seeked",
                function () {
                    resolve();
                },
                {
                    once:
                        true
                }
            );

            video.addEventListener(
                "error",
                function () {
                    reject(
                        new Error(
                            "Video seek failed."
                        )
                    );
                },
                {
                    once:
                        true
                }
            );

            video.currentTime =
                Math.max(
                    0,
                    Math.min(
                        time,
                        Math.max(
                            0,
                            video.duration -
                            0.05
                        )
                    )
                );
        });
    }

    function releaseObjectUrls() {
        objectUrls.forEach(function (
            url
        ) {
            URL.revokeObjectURL(
                url
            );
        });

        objectUrls =
            [];
    }
})();