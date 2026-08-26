/**
 * Baika Archery System
 * Project Zero
 * Capture Library
 */

(function () {
    "use strict";

    const DB_NAME =
        "baika-archery-form-video-local";

    const DB_VERSION =
        1;

    const VIDEO_STORE_NAME =
        "formVideos";

    let databasePromise = null;
    let objectUrls = [];

    document.addEventListener(
        "DOMContentLoaded",
        initializeCaptureLibrary
    );

    window.addEventListener(
        "pagehide",
        releaseObjectUrls
    );

    function initializeCaptureLibrary() {
        loadFormVideos();
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

                request.onupgradeneeded =
                    function () {
                        const db =
                            request.result;

                        if (
                            !db.objectStoreNames
                                .contains(
                                    VIDEO_STORE_NAME
                                )
                        ) {
                            const store =
                                db.createObjectStore(
                                    VIDEO_STORE_NAME,
                                    {
                                        keyPath: "id",
                                        autoIncrement: true
                                    }
                                );

                            store.createIndex(
                                "createdAt",
                                "createdAt",
                                {
                                    unique: false
                                }
                            );
                        }
                    };

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

    async function loadFormVideos() {
        const list =
            document.getElementById(
                "formVideoLibraryList"
            );

        if (!list) {
            return;
        }

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

            renderFormVideos(
                list,
                videos
            );

        } catch (error) {
            console.error(
                "Form video library load failed:",
                error
            );

            list.textContent =
                "フォーム動画を読み込めませんでした。";
        }
    }

    function renderFormVideos(
        list,
        videos
    ) {
        releaseObjectUrls();

        list.replaceChildren();

        if (
            !Array.isArray(videos) ||
            videos.length === 0
        ) {
            const empty =
                document.createElement(
                    "p"
                );

            empty.textContent =
                "保存されているフォーム動画はありません。";

            list.appendChild(
                empty
            );

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

            const title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                formatDateTime(
                    record.createdAt
                );

            const video =
                document.createElement(
                    "video"
                );

            const url =
                URL.createObjectURL(
                    record.blob
                );

            objectUrls.push(
                url
            );

            video.src =
                url;

            video.controls =
                true;

            video.playsInline =
                true;

            video.preload =
                "metadata";

            video.style.width =
                "100%";

            const meta =
                document.createElement(
                    "p"
                );

            meta.textContent =
                formatFileSize(
                    record.size
                );

            card.appendChild(
                title
            );

            card.appendChild(
                video
            );

            card.appendChild(
                meta
            );

            list.appendChild(
                card
            );
        });
    }

    function formatDateTime(value) {
        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "撮影日時不明";
        }

        return date.toLocaleString(
            "ja-JP"
        );
    }

    function formatFileSize(value) {
        const bytes =
            Number(value);

        if (
            !Number.isFinite(bytes) ||
            bytes <= 0
        ) {
            return "サイズ不明";
        }

        if (bytes < 1024 * 1024) {
            return (
                Math.round(
                    bytes / 1024
                ) +
                " KB"
            );
        }

        return (
            (
                bytes /
                1024 /
                1024
            ).toFixed(1) +
            " MB"
        );
    }

    function releaseObjectUrls() {
        objectUrls.forEach(function (
            url
        ) {
            URL.revokeObjectURL(
                url
            );
        });

        objectUrls = [];
    }
})();