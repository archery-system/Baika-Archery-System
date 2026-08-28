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

    const PHOTO_ANALYSIS_STORE_NAME =
        "targetPhotoAnalysis";

    const PHOTO_PINS_STORE_NAME =
        "targetPhotoPins";

    const PHOTO_STATUS_STORAGE_KEY =
        "baikaPhotoStatusV1";

    let photoDatabasePromise = null;

    let databasePromise = null;
    let objectUrls = [];

    let currentPhotoViewerUrl = null;
    let currentTargetPhotos = [];
    let currentPhotoViewerIndex = -1;
    let currentImportFiles = [];
    let currentImportIndex = -1;
    let currentImportPreviewUrl = null;
    let isTargetPhotoSelectMode = false;

    const selectedTargetPhotoIds =
        new Set();

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
        bindTargetPhotoImport();
        bindTargetPhotoSelectionMode();

        loadTargetPhotos();
        loadFormVideos();
    }

    function createTargetPhotoShareFile(
        record,
        index
    ) {
        if (
            !record ||
            !(record.blob instanceof Blob)
        ) {
            return null;
        }

        const type =
            record.blob.type ||
            "image/jpeg";

        let extension = ".jpg";

        if (type === "image/png") {
            extension = ".png";
        } else if (
            type === "image/webp"
        ) {
            extension = ".webp";
        }

        let fileName =
            String(
                record.fileName || ""
            ).trim();

        if (!fileName) {
            fileName =
                "target-photo-" +
                (index + 1) +
                extension;
        }

        const createdTime =
            new Date(
                record.createdAt || ""
            ).getTime();

        const lastModified =
            Number.isFinite(createdTime)
                ? createdTime
                : Date.now();

        return new File(
            [record.blob],
            fileName,
            {
                type: type,
                lastModified: lastModified
            }
        );
    }

    function createTargetPhotoMetadataFile(
        records,
        photoFiles
    ) {
        const photos =
            records.map(
                function (
                    record,
                    index
                ) {
                    const photoFile =
                        photoFiles[index];

                    return {
                        fileName:
                            photoFile
                                ? photoFile.name
                                : String(
                                    record.fileName ||
                                    ""
                                ),

                        createdAt:
                            record.createdAt ||
                            "",

                        practiceDate:
                            record.practiceDate ||
                            "",

                        memberName:
                            record.memberName ||
                            "",

                        distance:
                            record.distance ||
                            "",

                        weather:
                            record.weather ||
                            "",

                        windStrength:
                            record.windStrength ||
                            "",

                        windDirection:
                            record.windDirection ||
                            "",

                        endNumber:
                            record.endNumber ??
                            null,

                        status:
                            record.status ||
                            "pending"
                    };
                }
            );

        const metadata = {
            format:
                "baika-archery-target-photo",

            version: 1,

            exportedAt:
                new Date().toISOString(),

            photos: photos
        };

        const json =
            JSON.stringify(
                metadata,
                null,
                2
            );

        return new File(
            [json],
            "baika-target-photo-info.json",
            {
                type:
                    "application/json"
            }
        );
    }

    function updateTargetPhotoSelectionUi() {
        const selectionBar =
            document.getElementById(
                "targetPhotoSelectionBar"
            );

        const count =
            document.getElementById(
                "targetPhotoSelectionCount"
            );

        const selectAllButton =
            document.getElementById(
                "targetPhotoSelectAllButton"
            );

        const shareButton =
            document.getElementById(
                "targetPhotoShareButton"
            );

        if (selectionBar) {
            selectionBar.hidden =
                !isTargetPhotoSelectMode;
        }

        if (count) {
            count.textContent =
                selectedTargetPhotoIds.size +
                "枚選択中";
        }

        if (shareButton) {
            shareButton.disabled =
                selectedTargetPhotoIds.size === 0;
        }

        if (selectAllButton) {
            const selectableCount =
                currentTargetPhotos.filter(
                    function (record) {
                        return (
                            record &&
                            record.id != null &&
                            record.blob instanceof Blob
                        );
                    }
                ).length;

            selectAllButton.textContent =
                selectableCount > 0 &&
                    selectedTargetPhotoIds.size ===
                    selectableCount
                    ? "すべて解除"
                    : "すべて選択";
        }
    }

    function bindTargetPhotoSelectionMode() {
        const selectButton =
            document.getElementById(
                "targetPhotoSelectButton"
            );

        if (!selectButton) {
            return;
        }

        selectButton.addEventListener(
            "click",
            function () {
                isTargetPhotoSelectMode =
                    !isTargetPhotoSelectMode;

                if (
                    !isTargetPhotoSelectMode
                ) {
                    selectedTargetPhotoIds.clear();
                }

                selectButton.textContent =
                    isTargetPhotoSelectMode
                        ? "✕ 選択を終了"
                        : "☑ 写真を選択";

                updateTargetPhotoSelectionUi();

                renderTargetPhotos(
                    document.getElementById(
                        "targetPhotoLibraryList"
                    ),
                    currentTargetPhotos
                );
            }
        );

        const selectAllButton =
            document.getElementById(
                "targetPhotoSelectAllButton"
            );

        if (selectAllButton) {
            selectAllButton.addEventListener(
                "click",
                function () {
                    const selectablePhotos =
                        currentTargetPhotos.filter(
                            function (record) {
                                return (
                                    record &&
                                    record.id != null &&
                                    record.blob instanceof Blob
                                );
                            }
                        );

                    const allSelected =
                        selectablePhotos.length > 0 &&
                        selectedTargetPhotoIds.size ===
                        selectablePhotos.length;

                    selectedTargetPhotoIds.clear();

                    if (!allSelected) {
                        selectablePhotos.forEach(
                            function (record) {
                                selectedTargetPhotoIds.add(
                                    record.id
                                );
                            }
                        );
                    }

                    updateTargetPhotoSelectionUi();

                    renderTargetPhotos(
                        document.getElementById(
                            "targetPhotoLibraryList"
                        ),
                        currentTargetPhotos
                    );
                }
            );

            const shareButton =
                document.getElementById(
                    "targetPhotoShareButton"
                );

            if (shareButton) {
                shareButton.addEventListener(
                    "click",
                    function () {
                        const selectedPhotos =
                            currentTargetPhotos.filter(
                                function (record) {
                                    return (
                                        record &&
                                        record.id != null &&
                                        record.blob instanceof Blob &&
                                        selectedTargetPhotoIds.has(
                                            record.id
                                        )
                                    );
                                }
                            );

                        if (
                            selectedPhotos.length === 0
                        ) {
                            return;
                        }

                        const photoFiles =
                            selectedPhotos
                                .map(
                                    function (
                                        record,
                                        index
                                    ) {
                                        return createTargetPhotoShareFile(
                                            record,
                                            index
                                        );
                                    }
                                )
                                .filter(Boolean);

                        const metadataFile =
                            createTargetPhotoMetadataFile(
                                selectedPhotos,
                                photoFiles
                            );

                        const files = [
                            ...photoFiles,
                            metadataFile
                        ];

                        if (
                            photoFiles.length === 0
                        ) {
                            window.alert(
                                "共有できる写真がありません。"
                            );

                            return;
                        }

                        if (
                            typeof navigator.share !==
                            "function"
                        ) {
                            window.alert(
                                "この端末では写真共有機能を利用できません。"
                            );

                            return;
                        }

                        if (
                            typeof navigator.canShare ===
                            "function"
                        ) {
                            let canShareFiles = false;

                            try {
                                canShareFiles =
                                    navigator.canShare({
                                        files: files
                                    });
                            } catch (error) {
                                canShareFiles = false;
                            }

                            if (!canShareFiles) {
                                window.alert(
                                    "この端末では複数写真を共有できません。"
                                );

                                return;
                            }
                        }

                        navigator.share({
                            title:
                                "Baika Archery System 的写真",
                            files: files
                        }).catch(
                            function (error) {
                                if (
                                    error &&
                                    error.name ===
                                    "AbortError"
                                ) {
                                    return;
                                }

                                console.error(
                                    "Target photo share failed:",
                                    error
                                );

                                window.alert(
                                    "写真を共有できませんでした。"
                                );
                            }
                        );
                    }
                );
            }

        }

    }

    function bindTargetPhotoImport() {
        const button =
            document.getElementById(
                "targetPhotoImportButton"
            );

        const input =
            document.getElementById(
                "targetPhotoImportInput"
            );

        if (
            !button ||
            !input
        ) {
            return;
        }

        button.addEventListener(
            "click",
            function () {
                input.click();
            }
        );

        input.addEventListener(
            "change",
            function () {
                const files =
                    input.files
                        ? Array.from(
                            input.files
                        )
                        : [];

                if (files.length === 0) {
                    return;
                }

                currentImportFiles =
                    files.slice();

                currentImportIndex =
                    0;

                const file =
                    currentImportFiles[
                    currentImportIndex
                    ];

                const countText =
                    document.getElementById(
                        "targetPhotoImportCount"
                    );

                if (countText) {
                    countText.textContent =
                        files.length === 1
                            ? "1枚の写真を選択しました。"
                            : files.length + "枚の写真を選択しました。";
                }

                if (
                    !file.type ||
                    !file.type.startsWith(
                        "image/"
                    )
                ) {
                    window.alert(
                        "画像ファイルを選択してください。"
                    );

                    input.value = "";
                    return;
                }

                const viewer =
                    document.getElementById(
                        "targetPhotoImportViewer"
                    );

                const preview =
                    document.getElementById(
                        "targetPhotoImportPreview"
                    );

                if (
                    !viewer ||
                    !preview
                ) {
                    return;
                }

                if (
                    !viewer ||
                    !preview
                ) {
                    return;
                }

                renderImportPreview();

                viewer.hidden =
                    false;

                document.body.style.overflow =
                    "hidden";
            }
        );

        const prevButton =
            document.getElementById(
                "targetPhotoImportPrev"
            );

        const nextButton =
            document.getElementById(
                "targetPhotoImportNext"
            );

        const closeButton =
            document.getElementById(
                "targetPhotoImportClose"
            );

        const backdrop =
            document.querySelector(
                "[data-photo-import-close]"
            );

        const saveButton =
            document.getElementById(
                "targetPhotoImportSave"
            );

        const distanceSelect =
            document.getElementById(
                "targetPhotoImportDistance"
            );

        const weatherSelect =
            document.getElementById(
                "targetPhotoImportWeather"
            );

        const windStrengthSelect =
            document.getElementById(
                "targetPhotoImportWindStrength"
            );

        const windDirectionSelect =
            document.getElementById(
                "targetPhotoImportWindDirection"
            );

        if (saveButton) {
            saveButton.addEventListener(
                "click",
                function () {
                    if (
                        currentImportFiles.length === 0
                    ) {
                        return;
                    }

                    const conditions = {
                        distance:
                            distanceSelect
                                ? distanceSelect.value
                                : "",
                        weather:
                            weatherSelect
                                ? weatherSelect.value
                                : "",
                        windStrength:
                            windStrengthSelect
                                ? windStrengthSelect.value
                                : "",
                        windDirection:
                            windDirectionSelect
                                ? windDirectionSelect.value
                                : ""
                    };

                    saveButton.disabled = true;
                    saveButton.textContent =
                        "取り込み中…";

                    createImportedTargetPhotoRecords(
                        currentImportFiles,
                        conditions
                    )
                        .then(function (
                            records
                        ) {
                            return addImportedTargetPhotos(
                                records
                            ).then(function () {
                                return records;
                            });
                        })
                        .then(function (
                            records
                        ) {
                            closeImportViewer();

                            return loadTargetPhotos()
                                .then(function () {
                                    window.alert(
                                        records.length +
                                        "枚の写真を取り込みました。"
                                    );
                                });
                        })
                        .catch(function (
                            error
                        ) {
                            console.error(
                                "Target photo import failed:",
                                error
                            );

                            window.alert(
                                "写真を取り込めませんでした。"
                            );
                        })
                        .finally(function () {
                            saveButton.disabled = false;
                            saveButton.textContent =
                                "📥 選択した写真をまとめて取り込む";
                        });
                }
            );
        }

        function closeImportViewer() {
            const viewer =
                document.getElementById(
                    "targetPhotoImportViewer"
                );

            const preview =
                document.getElementById(
                    "targetPhotoImportPreview"
                );

            if (currentImportPreviewUrl) {
                URL.revokeObjectURL(
                    currentImportPreviewUrl
                );

                currentImportPreviewUrl = null;
            }

            if (viewer) {
                viewer.hidden = true;
            }

            if (preview) {
                preview.removeAttribute(
                    "src"
                );
            }

            currentImportFiles = [];
            currentImportIndex = -1;

            input.value = "";

            document.body.style.overflow =
                "";
        }

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                closeImportViewer
            );
        }

        if (backdrop) {
            backdrop.addEventListener(
                "click",
                closeImportViewer
            );
        }

        function renderImportPreview() {
            const preview =
                document.getElementById(
                    "targetPhotoImportPreview"
                );

            const countText =
                document.getElementById(
                    "targetPhotoImportCount"
                );

            if (
                !preview ||
                currentImportIndex < 0 ||
                currentImportIndex >= currentImportFiles.length
            ) {
                return;
            }

            if (currentImportPreviewUrl) {
                URL.revokeObjectURL(
                    currentImportPreviewUrl
                );

                currentImportPreviewUrl =
                    null;
            }

            const file =
                currentImportFiles[
                currentImportIndex
                ];

            currentImportPreviewUrl =
                URL.createObjectURL(
                    file
                );

            preview.src =
                currentImportPreviewUrl;

            if (countText) {
                countText.textContent =
                    (currentImportIndex + 1) +
                    " / " +
                    currentImportFiles.length +
                    "枚目";
            }

            if (prevButton) {
                prevButton.disabled =
                    currentImportIndex <= 0;
            }

            if (nextButton) {
                nextButton.disabled =
                    currentImportIndex >=
                    currentImportFiles.length - 1;
            }
        }

        if (prevButton) {
            prevButton.addEventListener(
                "click",
                function () {
                    if (currentImportIndex <= 0) {
                        return;
                    }

                    currentImportIndex -= 1;
                    renderImportPreview();
                }
            );
        }

        if (nextButton) {
            nextButton.addEventListener(
                "click",
                function () {
                    if (
                        currentImportIndex >=
                        currentImportFiles.length - 1
                    ) {
                        return;
                    }

                    currentImportIndex += 1;
                    renderImportPreview();
                }
            );
        }

    }

    function bindTargetPhotoViewer() {
        const prevButton =
            document.getElementById(
                "targetPhotoViewerPrev"
            );

        const nextButton =
            document.getElementById(
                "targetPhotoViewerNext"
            );

        const closeButton =
            document.getElementById(
                "targetPhotoViewerClose"
            );

        const deleteButton =
            document.getElementById(
                "targetPhotoViewerDelete"
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

        if (prevButton) {
            prevButton.addEventListener(
                "click",
                function () {
                    showPreviousTargetPhoto();
                }
            );
        }

        if (nextButton) {
            nextButton.addEventListener(
                "click",
                function () {
                    showNextTargetPhoto();
                }
            );
        }

        if (deleteButton) {
            deleteButton.addEventListener(
                "click",
                function () {
                    const confirmed =
                        window.confirm(
                            "この写真を削除しますか？\n" +
                            "登録済みの得点・グルーピング記録は削除されません。"
                        );

                    if (!confirmed) {
                        return;
                    }

                    const record =
                        currentTargetPhotos[
                        currentPhotoViewerIndex
                        ];

                    if (
                        !record ||
                        record.id == null
                    ) {
                        return;
                    }

                    deleteTargetPhoto(
                        record.id
                    )
                        .then(function () {
                            currentTargetPhotos.splice(
                                currentPhotoViewerIndex,
                                1
                            );

                            const list =
                                document.getElementById(
                                    "targetPhotoLibraryList"
                                );

                            if (list) {
                                renderTargetPhotos(
                                    list,
                                    currentTargetPhotos
                                );
                            }

                            if (
                                currentTargetPhotos.length === 0
                            ) {
                                closeTargetPhotoViewer();
                                return;
                            }

                            if (
                                currentPhotoViewerIndex >=
                                currentTargetPhotos.length
                            ) {
                                currentPhotoViewerIndex =
                                    currentTargetPhotos.length - 1;
                            }

                            renderCurrentTargetPhoto();
                        })
                        .catch(function (error) {
                            console.error(
                                "Target photo delete failed:",
                                error
                            );

                            window.alert(
                                "写真を削除できませんでした。"
                            );
                        });
                }
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
        record
    ) {
        if (!record) {
            return;
        }

        const index =
            currentTargetPhotos.findIndex(
                function (item) {
                    return (
                        item &&
                        item.id === record.id
                    );
                }
            );

        if (index < 0) {
            return;
        }

        currentPhotoViewerIndex =
            index;

        renderCurrentTargetPhoto();

        const viewer =
            document.getElementById(
                "targetPhotoViewer"
            );

        if (!viewer) {
            return;
        }

        viewer.hidden = false;

        document.body.style.overflow =
            "hidden";
    }

    function renderCurrentTargetPhoto() {
        const record =
            currentTargetPhotos[
            currentPhotoViewerIndex
            ];

        if (
            !record ||
            !(record.blob instanceof Blob)
        ) {
            return;
        }

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

        const prevButton =
            document.getElementById(
                "targetPhotoViewerPrev"
            );

        const nextButton =
            document.getElementById(
                "targetPhotoViewerNext"
            );

        if (
            !image ||
            !title ||
            !meta
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

        const status =
            getPhotoStatus(
                record
            );

        title.textContent =
            formatDateTime(
                record.createdAt
            );

        meta.textContent =
            "🎯 " +
            (
                record.distance ||
                "距離未設定"
            ) +
            " ・ " +
            (
                status === "complete"
                    ? "✅ 入力済み"
                    : "● 未入力"
            );

        if (prevButton) {
            prevButton.disabled =
                currentPhotoViewerIndex <= 0;
        }

        if (nextButton) {
            nextButton.disabled =
                currentPhotoViewerIndex >=
                currentTargetPhotos.length - 1;
        }
    }

    function showPreviousTargetPhoto() {
        if (
            currentPhotoViewerIndex <= 0
        ) {
            return;
        }

        currentPhotoViewerIndex -= 1;

        renderCurrentTargetPhoto();
    }

    function showNextTargetPhoto() {
        if (
            currentPhotoViewerIndex >=
            currentTargetPhotos.length - 1
        ) {
            return;
        }

        currentPhotoViewerIndex += 1;

        renderCurrentTargetPhoto();
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

                request.onupgradeneeded =
                    function () {
                        const db =
                            request.result;

                        if (
                            !db.objectStoreNames
                                .contains(
                                    PHOTO_STORE_NAME
                                )
                        ) {
                            const store =
                                db.createObjectStore(
                                    PHOTO_STORE_NAME,
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

                            store.createIndex(
                                "status",
                                "status",
                                {
                                    unique: false
                                }
                            );
                        }

                        if (
                            !db.objectStoreNames
                                .contains(
                                    PHOTO_ANALYSIS_STORE_NAME
                                )
                        ) {
                            db.createObjectStore(
                                PHOTO_ANALYSIS_STORE_NAME,
                                {
                                    keyPath: "photoId"
                                }
                            );
                        }

                        if (
                            !db.objectStoreNames
                                .contains(
                                    PHOTO_PINS_STORE_NAME
                                )
                        ) {
                            db.createObjectStore(
                                PHOTO_PINS_STORE_NAME,
                                {
                                    keyPath: "photoId"
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

        return photoDatabasePromise;
    }

    function getImportedTargetPhotoDimensions(
        file
    ) {
        return new Promise(function (
            resolve,
            reject
        ) {
            const objectUrl =
                URL.createObjectURL(
                    file
                );

            const image =
                new Image();

            image.onload =
                function () {
                    const dimensions = {
                        width:
                            image.naturalWidth,
                        height:
                            image.naturalHeight
                    };

                    URL.revokeObjectURL(
                        objectUrl
                    );

                    resolve(
                        dimensions
                    );
                };

            image.onerror =
                function () {
                    URL.revokeObjectURL(
                        objectUrl
                    );

                    reject(
                        new Error(
                            "画像サイズを取得できませんでした。"
                        )
                    );
                };

            image.src =
                objectUrl;
        });
    }

    function createImportedTargetPhotoRecord(
        file,
        conditions
    ) {
        const createdAt =
            file.lastModified
                ? new Date(
                    file.lastModified
                )
                : new Date();

        return {
            blob: file,
            sessionId: "",
            endNumber: null,
            fileName:
                file.name ||
                (
                    "imported-target-" +
                    createdAt.getTime() +
                    ".jpg"
                ),
            createdAt:
                createdAt.toISOString(),
            memberName: "",
            practiceDate:
                createdAt
                    .toISOString()
                    .slice(0, 10),
            distance:
                conditions.distance || "",
            weather:
                conditions.weather || "",
            windStrength:
                conditions.windStrength || "",
            windDirection:
                conditions.windDirection || "",
            status: "pending",
            guide: null,
            width: null,
            height: null
        };
    }

    async function createImportedTargetPhotoRecords(
        files,
        conditions
    ) {
        const records = [];

        for (
            const file
            of files
        ) {
            const record =
                createImportedTargetPhotoRecord(
                    file,
                    conditions
                );

            const dimensions =
                await getImportedTargetPhotoDimensions(
                    file
                );

            record.width =
                dimensions.width;

            record.height =
                dimensions.height;

            records.push(
                record
            );
        }

        return records;
    }

    async function addImportedTargetPhotos(
        records
    ) {
        if (
            !Array.isArray(records) ||
            records.length === 0
        ) {
            return;
        }

        const db =
            await openPhotoDatabase();

        return new Promise(function (
            resolve,
            reject
        ) {
            const transaction =
                db.transaction(
                    PHOTO_STORE_NAME,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    PHOTO_STORE_NAME
                );

            records.forEach(function (
                record
            ) {
                store.add(record);
            });

            transaction.oncomplete =
                function () {
                    resolve();
                };

            transaction.onerror =
                function () {
                    reject(
                        transaction.error
                    );
                };

            transaction.onabort =
                function () {
                    reject(
                        transaction.error
                    );
                };
        });
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

    async function deleteTargetPhoto(id) {
        const db =
            await openPhotoDatabase();

        return new Promise(function (
            resolve,
            reject
        ) {
            const transaction =
                db.transaction(
                    [
                        PHOTO_STORE_NAME,
                        PHOTO_ANALYSIS_STORE_NAME,
                        PHOTO_PINS_STORE_NAME
                    ],
                    "readwrite"
                );

            transaction
                .objectStore(
                    PHOTO_STORE_NAME
                )
                .delete(id);

            transaction
                .objectStore(
                    PHOTO_ANALYSIS_STORE_NAME
                )
                .delete(id);

            transaction
                .objectStore(
                    PHOTO_PINS_STORE_NAME
                )
                .delete(id);

            transaction.oncomplete =
                function () {
                    resolve();
                };

            transaction.onerror =
                function () {
                    reject(
                        transaction.error
                    );
                };

            transaction.onabort =
                function () {
                    reject(
                        transaction.error
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

            currentTargetPhotos =
                photos.slice();

            renderTargetPhotos(
                list,
                currentTargetPhotos
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

            if (
                isTargetPhotoSelectMode &&
                selectedTargetPhotoIds.has(
                    record.id
                )
            ) {
                card.classList.add(
                    "is-selected"
                );

                const selectedLabel =
                    document.createElement(
                        "span"
                    );

                selectedLabel.className =
                    "capture-library-photo-selected-label";

                selectedLabel.textContent =
                    "✓ 選択中";

                card.appendChild(
                    selectedLabel
                );
            }

            const title =
                document.createElement(
                    "h3"
                );

            const status =
                getPhotoStatus(
                    record
                );

            title.textContent =
                formatDateTime(
                    record.createdAt
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
                "🎯 " +
                (
                    record.distance ||
                    "距離未設定"
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
                    if (
                        isTargetPhotoSelectMode
                    ) {
                        if (
                            selectedTargetPhotoIds.has(
                                record.id
                            )
                        ) {
                            selectedTargetPhotoIds.delete(
                                record.id
                            );
                        } else {
                            selectedTargetPhotoIds.add(
                                record.id
                            );
                        }

                        updateTargetPhotoSelectionUi();

                        renderTargetPhotos(
                            list,
                            photos
                        );

                        return;
                    }

                    openTargetPhotoViewer(
                        record
                    );
                }
            );

            card.addEventListener(
                "keydown",
                function (event) {
                    if (
                        event.key !== "Enter" &&
                        event.key !== " "
                    ) {
                        return;
                    }

                    event.preventDefault();

                    if (
                        isTargetPhotoSelectMode
                    ) {
                        if (
                            selectedTargetPhotoIds.has(
                                record.id
                            )
                        ) {
                            selectedTargetPhotoIds.delete(
                                record.id
                            );
                        } else {
                            selectedTargetPhotoIds.add(
                                record.id
                            );
                        }

                        updateTargetPhotoSelectionUi();

                        renderTargetPhotos(
                            list,
                            photos
                        );

                        return;

                        return;
                    }

                    openTargetPhotoViewer(
                        record
                    );
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