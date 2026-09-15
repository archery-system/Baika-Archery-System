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

    const AI_SCORE_HISTORY_KEY_PREFIX =
        "baika-ai-score-history-";

    let databasePromise =
        null;

    let objectUrls =
        [];

    /*
     * 直近のフォームAI解析結果を書き出すための一時データ。
     *
     * IndexedDB / localStorageには保存せず、
     * ページを閉じると破棄される。
     */
    let latestFormAiExportData =
        null;

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

        const exportButton =
            document.getElementById(
                "aiFormVideoExportButton"
            );

        if (exportButton) {
            exportButton.addEventListener(
                "click",
                async function () {
                    try {
                        exportButton.disabled =
                            true;

                        await shareLatestFormAiAnalysis();

                    } catch (error) {
                        console.error(
                            "Form AI export failed:",
                            error
                        );

                        alert(
                            error &&
                                error.message
                                ? error.message
                                : "AI分析結果を書き出せませんでした。"
                        );

                    } finally {
                        exportButton.disabled =
                            false;
                    }
                }
            );
        }
    }

    function getAiScoreHistoryStorageKey() {
        const memberId =
            window.V4Session &&
                typeof window.V4Session.getLoggedInMemberId ===
                "function"
                ? String(
                    window.V4Session.getLoggedInMemberId() ||
                    ""
                ).trim()
                : "";

        if (!memberId) {
            return (
                AI_SCORE_HISTORY_KEY_PREFIX +
                "unknown"
            );
        }

        return (
            AI_SCORE_HISTORY_KEY_PREFIX +
            memberId
        );
    }

    function loadPreviousAiScore() {
        try {
            const saved =
                localStorage.getItem(
                    getAiScoreHistoryStorageKey()
                );

            if (!saved) {
                return null;
            }

            const parsed =
                JSON.parse(
                    saved
                );

            const score =
                Number(
                    parsed &&
                    parsed.score
                );

            return Number.isFinite(
                score
            )
                ? score
                : null;

        } catch (error) {
            console.warn(
                "AI score history load failed:",
                error
            );

            return null;
        }
    }

    function saveCurrentAiScore(
        score
    ) {
        const normalizedScore =
            Number(
                score
            );

        if (
            !Number.isFinite(
                normalizedScore
            )
        ) {
            return;
        }

        try {
            localStorage.setItem(
                getAiScoreHistoryStorageKey(),
                JSON.stringify({
                    score:
                        normalizedScore,

                    savedAt:
                        new Date()
                            .toISOString()
                })
            );

        } catch (error) {
            console.warn(
                "AI score history save failed:",
                error
            );
        }
    }

    function extractOverallAiScore(
        analysisText
    ) {
        const normalizedText =
            String(
                analysisText || ""
            );

        const match =
            normalizedText.match(
                /【総合点】[\s\S]*?(\d{1,3})\s*\/\s*100点/
            );

        if (!match) {
            return null;
        }

        const score =
            Number(
                match[1]
            );

        if (
            !Number.isFinite(
                score
            ) ||
            score < 0 ||
            score > 100
        ) {
            return null;
        }

        return score;
    }

    function buildAiScoreComparisonText(
        previousScore,
        currentScore
    ) {
        const normalizedPreviousScore =
            previousScore === null ||
                previousScore === undefined ||
                previousScore === ""
                ? null
                : Number(
                    previousScore
                );

        const normalizedCurrentScore =
            Number(
                currentScore
            );

        if (
            !Number.isFinite(
                normalizedCurrentScore
            )
        ) {
            return "";
        }

        if (
            !Number.isFinite(
                normalizedPreviousScore
            )
        ) {
            return (
                "【前回との比較】\n\n" +
                "今回 " +
                normalizedCurrentScore +
                "点\n" +
                "初回評価のため比較なし"
            );
        }

        const difference =
            normalizedCurrentScore -
            normalizedPreviousScore;

        let differenceText =
            "±0";

        let direction =
            "→";

        if (difference > 0) {
            differenceText =
                "+" +
                difference;

            direction =
                "↑";
        } else if (difference < 0) {
            differenceText =
                String(
                    difference
                );

            direction =
                "↓";
        }

        return (
            "【前回との比較】\n\n" +
            "前回 " +
            normalizedPreviousScore +
            "点\n" +
            "今回 " +
            normalizedCurrentScore +
            "点\n" +
            "変化 " +
            differenceText +
            "点 " +
            direction
        );
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

    async function createFormVideoPosterForAi(
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
                "AI form video poster creation failed:",
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

            createFormVideoPosterForAi(
                record.blob
            ).then(function (
                poster
            ) {
                if (poster) {
                    video.poster =
                        poster;
                }
            });

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

            /*
 * フォーム動画を時系列で確認できるよう、
 * 約1秒間隔で静止画を抽出する。
 *
 * 長い動画では送信量が大きくなりすぎないよう、
 * 最大20枚に制限する。
 */
            const maximumFrameCount =
                20;

            const frameInterval =
                duration <=
                    maximumFrameCount
                    ? 1
                    : duration /
                    maximumFrameCount;

            const targetTimes =
                [];

            for (
                let targetTime =
                    Math.min(
                        0.5,
                        duration / 2
                    );
                targetTime <
                duration;
                targetTime +=
                frameInterval
            ) {
                targetTimes.push(
                    Math.min(
                        targetTime,
                        Math.max(
                            0,
                            duration - 0.05
                        )
                    )
                );

                if (
                    targetTimes.length >=
                    maximumFrameCount
                ) {
                    break;
                }
            }

            const frames =
                [];

            for (
                const targetTime of
                targetTimes
            ) {

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

                frames.push({
                    time:
                        Number(
                            targetTime.toFixed(
                                1
                            )
                        ),

                    image:
                        frameDataUrl
                });

                const frameContainer =
                    document.createElement(
                        "div"
                    );

                frameContainer.style.marginBottom =
                    "16px";

                const timeLabel =
                    document.createElement(
                        "div"
                    );

                timeLabel.textContent =
                    targetTime.toFixed(
                        1
                    ) +
                    " 秒";

                timeLabel.style.marginBottom =
                    "6px";

                timeLabel.style.fontWeight =
                    "700";

                timeLabel.style.color =
                    "#351c57";

                image.src =
                    frameDataUrl;

                image.alt =
                    targetTime.toFixed(
                        1
                    ) +
                    "秒のAI分析用フォーム画像";

                image.style.width =
                    "100%";

                image.style.borderRadius =
                    "12px";

                frameContainer.appendChild(
                    timeLabel
                );

                frameContainer.appendChild(
                    image
                );

                preview.appendChild(
                    frameContainer
                );
            }

            result.textContent =
                "AIへフォーム画像を送信しています…";

            const analysisResponse =
                await sendFormVideoFramesToAi(
                    frames
                );

            console.log(
                "AI analysis response:",
                analysisResponse
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

            const detailStartTime =
                Number(
                    analysisResponse
                        ? analysisResponse.detailStartTime
                        : NaN
                );

            const detailEndTime =
                Number(
                    analysisResponse
                        ? analysisResponse.detailEndTime
                        : NaN
                );

            console.log(
                "AI detail range from primary analysis:",
                {
                    detailStartTime:
                        detailStartTime,

                    detailEndTime:
                        detailEndTime
                }
            );

            let detailAnalysisText =
                "";

            let detailFramesForExport =
                [];

            if (
                Number.isFinite(
                    detailStartTime
                ) &&
                Number.isFinite(
                    detailEndTime
                ) &&
                detailEndTime >
                detailStartTime
            ) {
                const detailFrames =
                    await extractFormVideoDetailFramesForAi(
                        record,
                        detailStartTime,
                        detailEndTime
                    );

                detailFramesForExport =
                    detailFrames;

                console.log(
                    "AI detail frames:",
                    detailFrames.map(
                        function (
                            frame
                        ) {
                            return frame.time;
                        }
                    )
                );

                const detailAnalysisResponse =
                    await sendFormVideoDetailFramesToAi(
                        detailFrames
                    );

                console.log(
                    "AI detail analysis response:",
                    detailAnalysisResponse
                );

                if (
                    !detailAnalysisResponse ||
                    detailAnalysisResponse.success !== true
                ) {
                    throw new Error(
                        detailAnalysisResponse &&
                            detailAnalysisResponse.message
                            ? detailAnalysisResponse.message
                            : "詳細AI評価に失敗しました。"
                    );
                }

                detailAnalysisText =
                    detailAnalysisResponse.analysis ||
                    "";
            }

            const overallAnalysisText =
                analysisResponse.analysis ||
                "フォーム画像を確認しました。";

            const currentScore =
                extractOverallAiScore(
                    overallAnalysisText
                );

            const previousScore =
                loadPreviousAiScore();

            const comparisonText =
                buildAiScoreComparisonText(
                    previousScore,
                    currentScore
                );

            saveCurrentAiScore(
                currentScore
            );

            /*
             * 書き出し用データはメモリ上だけに保持する。
             * IndexedDB / localStorageには保存しない。
             */
            latestFormAiExportData = {
                analyzedAt:
                    new Date(),

                overallFrames:
                    frames,

                detailFrames:
                    detailFramesForExport,

                overallAnalysis:
                    overallAnalysisText,

                detailAnalysis:
                    detailAnalysisText,

                comparison:
                    comparisonText
            };

            const exportButton =
                document.getElementById(
                    "aiFormVideoExportButton"
                );

            if (exportButton) {
                exportButton.style.display =
                    "block";
            }

            result.textContent =
                comparisonText
                    ? comparisonText +
                    "\n\n" +
                    (
                        detailAnalysisText
                            ? "【射全体のAI評価】\n\n" +
                            overallAnalysisText +
                            "\n\n" +
                            "【リリース前後の詳細評価】\n\n" +
                            detailAnalysisText
                            : "【射全体のAI評価】\n\n" +
                            overallAnalysisText
                    )
                    : (
                        detailAnalysisText
                            ? "【射全体のAI評価】\n\n" +
                            overallAnalysisText +
                            "\n\n" +
                            "【リリース前後の詳細評価】\n\n" +
                            detailAnalysisText
                            : "【射全体のAI評価】\n\n" +
                            overallAnalysisText
                    );

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
     * 指定された時間帯だけを、
     * 約0.2秒間隔で詳細解析用に抽出する。
     */
    async function extractFormVideoDetailFramesForAi(
        record,
        startTime,
        endTime
    ) {
        if (
            !record ||
            !record.blob
        ) {
            throw new Error(
                "詳細解析するフォーム動画がありません。"
            );
        }

        const normalizedStartTime =
            Number(
                startTime
            );

        const normalizedEndTime =
            Number(
                endTime
            );

        if (
            !Number.isFinite(
                normalizedStartTime
            ) ||
            !Number.isFinite(
                normalizedEndTime
            ) ||
            normalizedStartTime < 0 ||
            normalizedEndTime <=
            normalizedStartTime
        ) {
            throw new Error(
                "詳細解析する時間帯が正しくありません。"
            );
        }

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
            "metadata";

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
                !Number.isFinite(
                    duration
                ) ||
                duration <= 0
            ) {
                throw new Error(
                    "Video duration is invalid."
                );
            }

            const detailStartTime =
                Math.max(
                    0,
                    normalizedStartTime
                );

            const detailEndTime =
                Math.min(
                    duration,
                    normalizedEndTime
                );

            if (
                detailEndTime <=
                detailStartTime
            ) {
                throw new Error(
                    "詳細解析できる時間帯がありません。"
                );
            }

            const detailFrameInterval =
                0.2;

            const maximumDetailFrameCount =
                20;

            const detailTargetTimes =
                [];

            for (
                let targetTime =
                    detailStartTime;
                targetTime <=
                detailEndTime;
                targetTime +=
                detailFrameInterval
            ) {
                detailTargetTimes.push(
                    Math.min(
                        targetTime,
                        Math.max(
                            0,
                            duration - 0.05
                        )
                    )
                );

                if (
                    detailTargetTimes.length >=
                    maximumDetailFrameCount
                ) {
                    break;
                }
            }

            const detailFrames =
                [];

            for (
                const targetTime of
                detailTargetTimes
            ) {
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

                const frameDataUrl =
                    canvas.toDataURL(
                        "image/jpeg",
                        0.85
                    );

                detailFrames.push({
                    time:
                        Number(
                            targetTime.toFixed(
                                1
                            )
                        ),

                    image:
                        frameDataUrl
                });
            }

            return detailFrames;

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

    async function readGasJsonResponse(
        response,
        actionName
    ) {
        const responseText =
            await response.text();

        const contentType =
            String(
                response.headers.get(
                    "content-type"
                ) || ""
            );

        console.log(
            "GAS response:",
            {
                action:
                    actionName,

                status:
                    response.status,

                contentType:
                    contentType
            }
        );

        if (
            !response.ok ||
            !contentType.includes(
                "application/json"
            )
        ) {
            console.error(
                "GAS non-JSON response:",
                actionName,
                response.status,
                responseText.slice(
                    0,
                    1000
                )
            );

            throw new Error(
                actionName +
                " の応答がJSONではありません。" +
                " HTTP " +
                response.status
            );
        }

        try {
            return JSON.parse(
                responseText
            );

        } catch (error) {
            console.error(
                "GAS JSON parse failed:",
                actionName,
                responseText.slice(
                    0,
                    1000
                ),
                error
            );

            throw new Error(
                actionName +
                " の応答を読み取れませんでした。" +
                " HTTP " +
                response.status
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

        const requestBody =
            JSON.stringify({
                action:
                    "analyzeFormVideo",

                frames:
                    frames
            });

        console.log(
            "analyzeFormVideo request:",
            {
                frameCount:
                    frames.length,

                payloadBytes:
                    new Blob([
                        requestBody
                    ]).size
            }
        );

        const response =
            await fetch(
                V4_GAS_API_URL,
                {
                    method:
                        "POST",

                    body:
                        requestBody,

                    cache:
                        "no-store"
                }
            );

        const data =
            await readGasJsonResponse(
                response,
                "analyzeFormVideo"
            );

        return data;
    }

    /**
     * 一次AI評価結果をGASへ送り、
     * 詳細解析する時間帯を取得する。
     */


    /**
     * リリース前後の詳細フォーム画像を
     * GASへ送信する。
     */
    async function sendFormVideoDetailFramesToAi(
        frames
    ) {
        if (
            !Array.isArray(frames) ||
            frames.length === 0
        ) {
            throw new Error(
                "送信する詳細フォーム画像がありません。"
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
                                "analyzeFormVideoDetail",

                            frames:
                                frames
                        }),

                    cache:
                        "no-store"
                }
            );

        const data =
            await readGasJsonResponse(
                response,
                "analyzeFormVideoDetail"
            );

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

    /**
     * 直近のフォームAI解析結果から、
     * 書き出し用テキストを作成する。
     */
    function buildFormAiExportText(
        exportData
    ) {
        if (
            !exportData ||
            typeof exportData !== "object"
        ) {
            return "";
        }

        const analyzedAt =
            exportData.analyzedAt instanceof Date
                ? exportData.analyzedAt
                : new Date(
                    exportData.analyzedAt
                );

        const analyzedAtText =
            Number.isNaN(
                analyzedAt.getTime()
            )
                ? ""
                : analyzedAt.toLocaleString(
                    "ja-JP"
                );

        const sections =
            [
                "Baika Archery System",
                "フォームAI分析結果"
            ];

        if (analyzedAtText) {
            sections.push(
                "解析日時：" +
                analyzedAtText
            );
        }

        const comparisonText =
            String(
                exportData.comparison ||
                ""
            ).trim();

        if (comparisonText) {
            sections.push(
                comparisonText
            );
        }

        const overallAnalysisText =
            String(
                exportData.overallAnalysis ||
                ""
            ).trim();

        if (overallAnalysisText) {
            sections.push(
                "【射全体のAI評価】\n\n" +
                overallAnalysisText
            );
        }

        const detailAnalysisText =
            String(
                exportData.detailAnalysis ||
                ""
            ).trim();

        if (detailAnalysisText) {
            sections.push(
                "【リリース前後の詳細評価】\n\n" +
                detailAnalysisText
            );
        }

        return sections.join(
            "\n\n"
        );
    }

    /**
     * Data URL形式の分割画像を、
     * 書き出し可能なFileへ変換する。
     */
    function createFormAiFrameFile(
        frame,
        fileName
    ) {
        if (
            !frame ||
            typeof frame !== "object"
        ) {
            return null;
        }

        const imageDataUrl =
            String(
                frame.image || ""
            );

        if (
            !imageDataUrl.startsWith(
                "data:image/"
            )
        ) {
            return null;
        }

        try {
            const parts =
                imageDataUrl.split(
                    ","
                );

            if (parts.length < 2) {
                return null;
            }

            const header =
                parts[0];

            const base64Data =
                parts
                    .slice(1)
                    .join(",");

            const mimeMatch =
                header.match(
                    /^data:([^;]+);base64$/
                );

            if (!mimeMatch) {
                return null;
            }

            const mimeType =
                mimeMatch[1];

            const binaryString =
                atob(
                    base64Data
                );

            const bytes =
                new Uint8Array(
                    binaryString.length
                );

            for (
                let index = 0;
                index < binaryString.length;
                index += 1
            ) {
                bytes[index] =
                    binaryString.charCodeAt(
                        index
                    );
            }

            return new File(
                [
                    bytes
                ],
                fileName,
                {
                    type:
                        mimeType
                }
            );

        } catch (error) {
            console.warn(
                "Form AI frame file creation failed:",
                error
            );

            return null;
        }
    }

    /**
     * フォームAI解析に使用した分割画像を、
     * 書き出し用File配列へまとめる。
     */
    function createFormAiFrameFilesForExport(
        exportData
    ) {
        if (
            !exportData ||
            typeof exportData !== "object"
        ) {
            return [];
        }

        const files =
            [];

        const overallFrames =
            Array.isArray(
                exportData.overallFrames
            )
                ? exportData.overallFrames
                : [];

        overallFrames.forEach(function (
            frame,
            index
        ) {
            const frameTime =
                Number(
                    frame &&
                    frame.time
                );

            const timeText =
                Number.isFinite(
                    frameTime
                )
                    ? frameTime.toFixed(1)
                    : String(
                        index + 1
                    );

            const file =
                createFormAiFrameFile(
                    frame,
                    "射全体_" +
                    String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    ) +
                    "_" +
                    timeText +
                    "秒.jpg"
                );

            if (file) {
                files.push(
                    file
                );
            }
        });

        const detailFrames =
            Array.isArray(
                exportData.detailFrames
            )
                ? exportData.detailFrames
                : [];

        detailFrames.forEach(function (
            frame,
            index
        ) {
            const frameTime =
                Number(
                    frame &&
                    frame.time
                );

            const timeText =
                Number.isFinite(
                    frameTime
                )
                    ? frameTime.toFixed(1)
                    : String(
                        index + 1
                    );

            const file =
                createFormAiFrameFile(
                    frame,
                    "リリース前後_" +
                    String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    ) +
                    "_" +
                    timeText +
                    "秒.jpg"
                );

            if (file) {
                files.push(
                    file
                );
            }
        });

        return files;
    }

    /**
     * AI分析結果テキストと分割画像を、
     * 書き出し用File配列へまとめる。
     */
    function createFormAiExportFiles(
        exportData
    ) {
        if (
            !exportData ||
            typeof exportData !== "object"
        ) {
            return [];
        }

        const files =
            [];

        const exportText =
            buildFormAiExportText(
                exportData
            );

        if (exportText) {
            const textFile =
                new File(
                    [
                        exportText
                    ],
                    "AI分析結果.txt",
                    {
                        type:
                            "text/plain;charset=utf-8"
                    }
                );

            files.push(
                textFile
            );
        }

        const frameFiles =
            createFormAiFrameFilesForExport(
                exportData
            );

        frameFiles.forEach(function (
            file
        ) {
            files.push(
                file
            );
        });

        return files;
    }

    /**
     * 直近のフォームAI解析結果を、
     * Web Share APIを使って端末へ書き出す。
     */
    async function shareLatestFormAiAnalysis() {
        if (!latestFormAiExportData) {
            throw new Error(
                "書き出せるAI分析結果がありません。"
            );
        }

        const files =
            createFormAiExportFiles(
                latestFormAiExportData
            );

        if (files.length === 0) {
            throw new Error(
                "書き出すファイルを作成できませんでした。"
            );
        }

        if (
            !navigator.share ||
            !navigator.canShare
        ) {
            throw new Error(
                "この端末では共有機能を利用できません。"
            );
        }

        const shareData = {
            title:
                "Baika Archery System フォームAI分析",
            files:
                files
        };

        if (
            !navigator.canShare(
                shareData
            )
        ) {
            throw new Error(
                "この端末ではAI分析結果と画像をまとめて共有できません。"
            );
        }

        try {
            await navigator.share(
                shareData
            );

        } catch (error) {
            if (
                error &&
                error.name ===
                "AbortError"
            ) {
                return;
            }

            throw error;
        }
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