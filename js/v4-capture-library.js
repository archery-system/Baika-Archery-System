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

    const PHOTO_DB_NAME =
        "baika-archery-local";

    const PHOTO_DB_VERSION =
        2;

    const PHOTO_STORE_NAME =
        "targetPhotos";

    const PHOTO_STATUS_STORAGE_KEY =
        "baikaPhotoStatusV1";

    let photoDatabasePromise = null;

    let databasePromise = null;
    let objectUrls = [];

    let currentPhotoViewerUrl = null;

    document.addEventListener(
        "DOMContentLoaded",
        initializeCaptureLibrary
    );

    window.addEventListener(
        "pagehide",
        releaseObjectUrls
    );

    function initializeCaptureLibrary() {
        bindTargetPhotoViewer();

        loadTargetPhotos();
        loadFormVideos();
    }

    function bindTargetPhotoViewer() {
        const closeButton =
            document.getElementById(
                "targetPhotoViewerClose"
            );

        const backdrop =
            document.querySelector(
                "[data-photo-viewer-close]"
            );

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                closeTargetPhotoViewer
            );
        }

        if (backdrop) {
            backdrop.addEventListener(
                "click",
                closeTargetPhotoViewer
            );
        }

        document.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Escape"
                ) {
                    closeTargetPhotoViewer();
                }
            }
        );
    }

    function openTargetPhotoViewer(
        record,
        status
    ) {
        const viewer =
            document.getElementById(
                "targetPhotoViewer"
            );

        const image =
            document.getElementById(
                "targetPhotoViewerImage"
            );

        const title =
            document.getElementById(
                "targetPhotoViewerTitle"
            );

        const meta =
            document.getElementById(
                "targetPhotoViewerMeta"
            );

        if (
            !viewer ||
            !image ||
            !title ||
            !meta ||
            !record ||
            !(record.blob instanceof Blob)
        ) {
            return;
        }

        if (currentPhotoViewerUrl) {
            URL.revokeObjectURL(
                currentPhotoViewerUrl
            );

            currentPhotoViewerUrl = null;
        }

        currentPhotoViewerUrl =
            URL.createObjectURL(
                record.blob
            );

        image.src =
            currentPhotoViewerUrl;

        title.textContent =
            "🎯 " +
            (
                record.distance ||
                "距離未設定"
            );

        meta.textContent =
            (
                status === "complete"
                    ? "✅ 入力済み"
                    : "● 未入力"
            ) +
            " ・ " +
            formatDateTime(
                record.createdAt
            );

        viewer.hidden = false;

        document.body.style.overflow =
            "hidden";
    }

    function closeTargetPhotoViewer() {
        const viewer =
            document.getElementById(
                "targetPhotoViewer"
            );

        const image =
            document.getElementById(
                "targetPhotoViewerImage"
            );

        if (!viewer) {
            return;
        }

        viewer.hidden = true;

        if (image) {
            image.removeAttribute(
                "src"
            );
        }

        if (currentPhotoViewerUrl) {
            URL.revokeObjectURL(
                currentPhotoViewerUrl
            );

            currentPhotoViewerUrl = null;
        }

        document.body.style.overflow =
            "";
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

    function openPhotoDatabase() {
        if (photoDatabasePromise) {
            return photoDatabasePromise;
        }

        photoDatabasePromise =
            new Promise(function (
                resolve,
                reject
            ) {
                const request =
                    indexedDB.open(
                        PHOTO_DB_NAME,
                        PHOTO_DB_VERSION
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

        return photoDatabasePromise;
    }

    async function getAllTargetPhotos() {
        const db =
            await openPhotoDatabase();

        return new Promise(function (
            resolve,
            reject
        ) {
            const transaction =
                db.transaction(
                    PHOTO_STORE_NAME,
                    "readonly"
                );

            const request =
                transaction
                    .objectStore(
                        PHOTO_STORE_NAME
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

    function readPhotoStatusMap() {
        try {
            const parsed =
                JSON.parse(
                    localStorage.getItem(
                        PHOTO_STATUS_STORAGE_KEY
                    ) || "{}"
                );

            return (
                parsed &&
                    typeof parsed === "object"
                    ? parsed
                    : {}
            );
        } catch (error) {
            console.warn(
                "Photo status read failed:",
                error
            );

            return {};
        }
    }

    function getPhotoStatus(photo) {
        if (
            !photo ||
            photo.id == null
        ) {
            return "pending";
        }

        const map =
            readPhotoStatusMap();

        const saved =
            map[
            String(photo.id)
            ];

        if (
            saved === "complete" ||
            saved === "pending"
        ) {
            return saved;
        }

        return (
            photo.status === "complete"
                ? "complete"
                : "pending"
        );
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

    async function loadTargetPhotos() {
        const list =
            document.getElementById(
                "targetPhotoLibraryList"
            );

        if (!list) {
            return;
        }

        try {
            const photos =
                await getAllTargetPhotos();

            photos.sort(function (a, b) {
                return String(
                    b.createdAt || ""
                ).localeCompare(
                    String(
                        a.createdAt || ""
                    )
                );
            });

            renderTargetPhotos(
                list,
                photos
            );

        } catch (error) {
            console.error(
                "Target photo library load failed:",
                error
            );

            list.textContent =
                "的写真を読み込めませんでした。";
        }
    }

    function renderTargetPhotos(
        list,
        photos
    ) {
        list.replaceChildren();

        if (
            !Array.isArray(photos) ||
            photos.length === 0
        ) {
            const empty =
                document.createElement(
                    "p"
                );

            empty.textContent =
                "保存されている的写真はありません。";

            list.appendChild(
                empty
            );

            return;
        }

        photos.forEach(function (
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

            const status =
                getPhotoStatus(
                    record
                );

            title.textContent =
                "🎯 " +
                (
                    record.distance ||
                    "距離未設定"
                );

            const statusText =
                document.createElement(
                    "p"
                );

            statusText.className =
                "capture-library-photo-status";

            statusText.textContent =
                (
                    status === "complete"
                        ? "✅ 入力済み"
                        : "● 未入力"
                );

            const meta =
                document.createElement(
                    "p"
                );

            meta.className =
                "capture-library-photo-date";

            meta.textContent =
                formatDateTime(
                    record.createdAt
                );

            card.appendChild(
                title
            );

            card.appendChild(
                statusText
            );

            card.appendChild(
                meta
            );

            card.setAttribute(
                "role",
                "button"
            );

            card.tabIndex = 0;

            card.setAttribute(
                "aria-label",
                (
                    record.distance ||
                    "距離未設定"
                ) +
                "の的写真を開く"
            );

            card.addEventListener(
                "click",
                function () {
                    openTargetPhotoViewer(
                        record,
                        status
                    );
                }
            );

            card.addEventListener(
                "keydown",
                function (event) {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();

                        openTargetPhotoViewer(
                            record,
                            status
                        );
                    }
                }
            );

            list.appendChild(
                card
            );
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

    async function deleteFormVideo(
        videoId
    ) {
        const id =
            Number(videoId);

        if (
            !Number.isFinite(id) ||
            id <= 0
        ) {
            return;
        }

        const db =
            await openDatabase();

        return new Promise(function (
            resolve,
            reject
        ) {
            const transaction =
                db.transaction(
                    VIDEO_STORE_NAME,
                    "readwrite"
                );

            const request =
                transaction
                    .objectStore(
                        VIDEO_STORE_NAME
                    )
                    .delete(id);

            request.onsuccess =
                function () {
                    resolve();
                };

            request.onerror =
                function () {
                    reject(
                        request.error
                    );
                };
        });
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

            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.type =
                "button";

            deleteButton.className =
                "capture-library-delete-button";

            deleteButton.textContent =
                "🗑 削除";

            deleteButton.addEventListener(
                "click",
                async function () {
                    const confirmed =
                        window.confirm(
                            "このフォーム動画を削除しますか？\n\n削除すると元に戻せません。"
                        );

                    if (!confirmed) {
                        return;
                    }

                    deleteButton.disabled =
                        true;

                    deleteButton.textContent =
                        "削除中…";

                    try {
                        await deleteFormVideo(
                            record.id
                        );

                        await loadFormVideos();

                    } catch (error) {
                        console.error(
                            "Form video delete failed:",
                            error
                        );

                        window.alert(
                            "フォーム動画を削除できませんでした。"
                        );

                        deleteButton.disabled =
                            false;

                        deleteButton.textContent =
                            "🗑 削除";
                    }
                }
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

            card.appendChild(
                deleteButton
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