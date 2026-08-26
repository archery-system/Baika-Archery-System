/**
 * Baika Archery System
 * Project Zero
 * Form Video
 */

(function () {
    "use strict";

    let cameraStream = null;

    let mediaRecorder = null;
    let recordedChunks = [];
    let recordedVideoUrl = null;

    document.addEventListener(
        "DOMContentLoaded",
        initializeFormVideo
    );

    function initializeFormVideo() {
        const elements =
            getElements();

        if (
            !elements.preview ||
            !elements.startCameraButton
        ) {
            console.warn(
                "フォーム動画撮影の画面要素を確認できません。"
            );
            return;
        }

        elements.startCameraButton.addEventListener(
            "click",
            startCamera
        );

        elements.startRecordingButton.addEventListener(
            "click",
            startRecording
        );

        elements.stopRecordingButton.addEventListener(
            "click",
            stopRecording
        );

        /*
         * ページを離れるときは
         * カメラを停止する。
         */
        window.addEventListener(
            "pagehide",
            stopCamera
        );
    }

    async function startCamera() {
        const elements =
            getElements();

        if (
            !navigator.mediaDevices ||
            typeof navigator.mediaDevices.getUserMedia !==
            "function"
        ) {
            updateStatus(
                "このブラウザではカメラを使用できません。"
            );
            return;
        }

        elements.startCameraButton.disabled =
            true;

        updateStatus(
            "カメラを起動しています…"
        );

        try {
            stopCamera();

            cameraStream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: {
                            ideal: "environment"
                        }
                    },
                    audio: true
                });

            elements.preview.srcObject =
                cameraStream;

            await elements.preview.play();

            elements.startRecordingButton.disabled =
                false;

            elements.startCameraButton.textContent =
                "🔄 カメラを再起動";

            updateStatus(
                "カメラを起動しました。"
            );
        } catch (error) {
            console.error(
                "Form video camera failed:",
                error
            );

            updateStatus(
                "カメラを起動できませんでした。カメラとマイクの使用許可を確認してください。"
            );
        } finally {
            elements.startCameraButton.disabled =
                false;
        }
    }

    function startRecording() {
        const elements =
            getElements();

        if (!cameraStream) {
            updateStatus(
                "先にカメラを起動してください。"
            );
            return;
        }

        if (
            typeof MediaRecorder ===
            "undefined"
        ) {
            updateStatus(
                "このブラウザでは動画録画を使用できません。"
            );
            return;
        }

        recordedChunks = [];

        try {
            mediaRecorder =
                new MediaRecorder(
                    cameraStream
                );

            mediaRecorder.addEventListener(
                "dataavailable",
                function (event) {
                    if (
                        event.data &&
                        event.data.size > 0
                    ) {
                        recordedChunks.push(
                            event.data
                        );
                    }
                }
            );

            mediaRecorder.addEventListener(
                "stop",
                handleRecordingStop
            );

            mediaRecorder.start();

            elements.startRecordingButton.disabled =
                true;

            elements.stopRecordingButton.disabled =
                false;

            elements.startCameraButton.disabled =
                true;

            updateStatus(
                "🔴 録画中です。"
            );

        } catch (error) {
            console.error(
                "Form video recording start failed:",
                error
            );

            updateStatus(
                "録画を開始できませんでした。"
            );
        }
    }

    function stopRecording() {
        const elements =
            getElements();

        if (
            !mediaRecorder ||
            mediaRecorder.state ===
            "inactive"
        ) {
            return;
        }

        elements.stopRecordingButton.disabled =
            true;

        updateStatus(
            "録画を停止しています…"
        );

        mediaRecorder.stop();
    }

    function handleRecordingStop() {
        const elements =
            getElements();

        if (
            recordedVideoUrl
        ) {
            URL.revokeObjectURL(
                recordedVideoUrl
            );

            recordedVideoUrl = null;
        }

        const mimeType =
            mediaRecorder &&
                mediaRecorder.mimeType
                ? mediaRecorder.mimeType
                : "video/webm";

        const videoBlob =
            new Blob(
                recordedChunks,
                {
                    type: mimeType
                }
            );

        recordedVideoUrl =
            URL.createObjectURL(
                videoBlob
            );

        elements.playback.src =
            recordedVideoUrl;

        elements.playback.hidden =
            false;

        elements.empty.hidden =
            true;

        elements.startRecordingButton.disabled =
            false;

        elements.stopRecordingButton.disabled =
            true;

        elements.startCameraButton.disabled =
            false;

        updateStatus(
            "録画が完了しました。下の動画で確認できます。"
        );

        mediaRecorder = null;
    }

    function stopCamera() {
        if (!cameraStream) {
            return;
        }

        if (
            mediaRecorder &&
            mediaRecorder.state !==
            "inactive"
        ) {
            try {
                mediaRecorder.stop();
            } catch (error) {
                console.warn(
                    "録画停止に失敗しました:",
                    error
                );
            }
        }

        cameraStream
            .getTracks()
            .forEach(function (track) {
                track.stop();
            });

        cameraStream = null;

        const elements =
            getElements();

        if (elements.preview) {
            elements.preview.srcObject =
                null;
        }

        if (elements.startRecordingButton) {
            elements.startRecordingButton.disabled =
                true;
        }

        if (elements.stopRecordingButton) {
            elements.stopRecordingButton.disabled =
                true;
        }
    }

    function updateStatus(message) {
        const elements =
            getElements();

        if (!elements.status) {
            return;
        }

        elements.status.textContent =
            message;
    }

    function getElements() {
        return {
            preview:
                document.getElementById(
                    "formVideoPreview"
                ),

            startCameraButton:
                document.getElementById(
                    "formVideoStartCamera"
                ),

            startRecordingButton:
                document.getElementById(
                    "formVideoStartRecording"
                ),

            stopRecordingButton:
                document.getElementById(
                    "formVideoStopRecording"
                ),

            status:
                document.getElementById(
                    "formVideoStatus"
                ),

            playback:
                document.getElementById(
                    "formVideoPlayback"
                ),

            empty:
                document.getElementById(
                    "formVideoEmpty"
                )
        };
    }
})();