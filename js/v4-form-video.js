/**
 * Baika Archery System
 * Project Zero
 * Form Video
 */

(function () {
    "use strict";

    let cameraStream = null;

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

    function stopCamera() {
        if (!cameraStream) {
            return;
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