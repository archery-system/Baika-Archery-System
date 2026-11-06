/**
 * Baika Archery System
 * 練習モード切り替え
 */

(function () {
    "use strict";

    function initializePracticeMode() {
        const modeSelect =
            document.getElementById(
                "v4PracticeMode"
            );

        const scorePanel =
            document.getElementById(
                "v4ScoreSessionPanel"
            );

                if (!modeSelect || !scorePanel) {
            return;
        }

        const startButton =
            document.getElementById(
                "v4StartScoreSession"
            );

        const finishButton =
            document.getElementById(
                "v4FinishScoreSession"
            );

        const statusElement =
            document.getElementById(
                "v4ScoreSessionStatus"
            );

        const memberId =
            window.V4Session &&
            typeof window.V4Session.getLoggedInMemberId === "function"
                ? window.V4Session.getLoggedInMemberId()
                : "";

        if (
            !startButton ||
            !finishButton ||
            !statusElement ||
            !memberId
        ) {
            return;
        }

        const storageKey =
            "baika-score-session-" + memberId;

        /*
         * 終了済みの点取りセッションを
         * 部員ごとに履歴保存するためのキー。
         */
        const historyStorageKey =
            "baika-score-session-history-" + memberId;

        /*
         * 練習記録の保存処理から
         * 点取りセッションを参照するための窓口。
         */
        window.BAS_SCORE_SESSION = {
            getActiveSession: function () {
                const session = loadSession();

                if (
                    !session ||
                    session.status !== "active" ||
                    session.memberId !== memberId
                ) {
                    return null;
                }

                return {
                    ...session
                };
            },

            recordSavedEnd: function (
                sessionId,
                recordId,
                arrowCount,
                endTotal
            ) {
                const session = loadSession();

                if (
                    !session ||
                    session.status !== "active" ||
                    session.id !== sessionId
                ) {
                    return false;
                }

                const recordIds =
                    Array.isArray(session.recordIds)
                        ? session.recordIds
                        : [];

                if (recordIds.includes(recordId)) {
                    return true;
                }

                if (
                    !recordId ||
                    !Number.isInteger(arrowCount) ||
                    arrowCount <= 0 ||
                    !Number.isFinite(endTotal)
                ) {
                    return false;
                }

                session.recordIds = [
                    ...recordIds,
                    recordId
                ];

                session.arrowCount =
                    (session.arrowCount || 0) +
                    arrowCount;

                session.total =
                    (session.total || 0) +
                    endTotal;

                session.endNumber =
                    (session.endNumber || 0) + 1;

                try {
                    localStorage.setItem(
                        storageKey,
                        JSON.stringify(session)
                    );
                } catch (error) {
                    console.error(
                        "点取り集計の保存に失敗:",
                        error
                    );
                    return false;
                }

                updateSessionDisplay();

                return true;
            }
        };

        function loadSession() {
            try {
                const saved =
                    localStorage.getItem(storageKey);

                return saved
                    ? JSON.parse(saved)
                    : null;
            } catch (error) {
                console.error(
                    "点取りセッションの読み込みに失敗:",
                    error
                );
                return null;
            }
        }

        function updateSessionDisplay() {
            const session = loadSession();

            /*
             * 点取りセッションの射数・累計得点を表示する。
             */
            const arrowCountElement =
                document.getElementById(
                    "v4ScoreSessionArrowCount"
                );

            const totalElement =
                document.getElementById(
                    "v4ScoreSessionTotal"
                );

            if (arrowCountElement) {
                arrowCountElement.textContent =
                    String(session?.arrowCount ?? 0);
            }

            if (totalElement) {
                totalElement.textContent =
                    String(session?.total ?? 0);
            }

            const indicator =
                document.getElementById(
                    "v4PracticeModeIndicator"
                );

            const indicatorText =
                document.getElementById(
                    "v4PracticeModeIndicatorText"
                );

            if (indicator && indicatorText) {
                const isScoreMode =
                    modeSelect.value === "score";

                const isActiveSession =
                    session &&
                    session.status === "active";

                indicator.classList.remove(
                    "is-normal",
                    "is-waiting",
                    "is-active"
                );

                if (!isScoreMode) {
                    indicatorText.textContent =
                        "通常練習";

                    indicator.classList.add(
                        "is-normal"
                    );
                } else if (isActiveSession) {
                    indicatorText.textContent =
                        "点取り中";

                    indicator.classList.add(
                        "is-active"
                    );
                } else {
                    indicatorText.textContent =
                        "点取り開始前";

                    indicator.classList.add(
                        "is-waiting"
                    );
                }
            }

            const isActive =
                session &&
                session.status === "active";

            statusElement.textContent =
                isActive
                    ? "点取り中"
                    : "点取り開始前";

            startButton.disabled =
                Boolean(isActive);

            finishButton.disabled =
                !isActive;

            /*
             * 点取り中は練習モードを固定する。
             * 点取り終了後は再び切り替え可能にする。
             */
            modeSelect.disabled =
                Boolean(isActive);

            if (isActive) {
                modeSelect.value = "score";
                scorePanel.hidden = false;
            }
        }

        startButton.addEventListener(
            "click",
            function () {
                const previousSession =
                    loadSession();

                if (previousSession?.status === "active") {
                    return;
                }

                /*
                 * 終了済みセッションが履歴に保存されているか
                 * 確認してから新しい点取りを開始する。
                 */
                if (previousSession) {
                    try {
                        const savedHistory =
                            localStorage.getItem(
                                historyStorageKey
                            );

                        const history =
                            savedHistory === null
                                ? []
                                : JSON.parse(savedHistory);

                        if (
                            !Array.isArray(history) ||
                            !history.some(function (item) {
                                return (
                                    item &&
                                    item.id === previousSession.id
                                );
                            })
                        ) {
                            throw new Error(
                                "前回の点取り履歴を確認できません。"
                            );
                        }
                    } catch (error) {
                        console.error(
                            "前回の点取り履歴の確認に失敗:",
                            error
                        );

                        window.alert(
                            "前回の点取り履歴を確認できないため、" +
                            "新しい点取りを開始できません。"
                        );

                        return;
                    }
                }

                const session = {
                    id:
                        crypto.randomUUID(),
                    memberId: memberId,
                    status: "active",
                    arrowCount: 0,
                    total: 0,
                    endNumber: 0,
                    recordIds: [],
                    startedAt:
                        new Date().toISOString()
                };

                try {
                    localStorage.setItem(
                        storageKey,
                        JSON.stringify(session)
                    );
                } catch (error) {
                    console.error(
                        "点取りセッションの保存に失敗:",
                        error
                    );
                    window.alert(
                        "点取りを開始できませんでした。"
                    );
                    return;
                }

                updateSessionDisplay();
            }
        );

        finishButton.addEventListener(
            "click",
            function () {
                const session = loadSession();

                if (
                    !session ||
                    session.status !== "active"
                ) {
                    return;
                }

                /*
                 * クラウド送信中は点取り終了を保留する。
                 * 送信中に再送処理を重複起動しない。
                 */
                const isSaveRunning =
                    window.BAS_IS_PRACTICE_SAVE_RUNNING;

                if (typeof isSaveRunning !== "function") {
                    window.alert(
                        "クラウド送信状態を確認できません。" +
                        "点取りを終了せず、記録を保持します。"
                    );
                    return;
                }

                if (isSaveRunning()) {
                    window.alert(
                        "クラウドへ記録を送信中です。" +
                        "送信が終わってから、もう一度終了してください。"
                    );
                    return;
                }

                /*
                 * 現在の点取りセッションに
                 * 保存待ちの記録がないか確認する。
                 */
                const checkPending =
                    window.BAS_CHECK_PENDING_PRACTICE_RECORDS;

                if (typeof checkPending !== "function") {
                    window.alert(
                        "保存待ち記録を確認できないため、" +
                        "点取りを終了できません。"
                    );
                    return;
                }

                const pendingRecords =
                    checkPending();

                if (pendingRecords === null) {
                    window.alert(
                        "保存待ち記録の確認に失敗しました。" +
                        "点取りを終了せず、記録を確認してください。"
                    );
                    return;
                }

                const hasPendingSessionRecords =
                    pendingRecords.some(function (item) {
                        return (
                            item &&
                            item.record &&
                            item.record.scoreSessionId === session.id
                        );
                    });

                if (hasPendingSessionRecords) {
                    const retry =
                        window.BAS_RETRY_PENDING_PRACTICE_RECORDS;

                    if (typeof retry !== "function") {
                        window.alert(
                            "クラウド再送処理を利用できません。" +
                            "点取りを終了せず、記録を保持します。"
                        );
                        return;
                    }

                    const confirmedRetry =
                        window.confirm(
                            "この点取り練習にはクラウド保存待ちの記録があります。" +
                            "今から再送しますか？"
                        );

                    if (confirmedRetry) {
                        retry().then(function () {
                            const remainingRecords =
                                checkPending();

                            if (remainingRecords === null) {
                                window.alert(
                                    "再送後の記録確認に失敗しました。" +
                                    "点取りは終了せず、記録を保持します。"
                                );
                                return;
                            }

                            const stillPending =
                                remainingRecords.some(
                                    function (item) {
                                        return (
                                            item &&
                                            item.record &&
                                            item.record.scoreSessionId ===
                                                session.id
                                        );
                                    }
                                );

                            if (stillPending) {
                                window.alert(
                                    "クラウド保存待ちの記録が残っています。" +
                                    "通信状態を確認してください。"
                                );
                            } else {
                                window.alert(
                                    "この点取り練習の保存待ち記録はなくなりました。" +
                                    "もう一度、点取り終了ボタンを押してください。"
                                );
                            }
                        }).catch(function (error) {
                            console.error(
                                "点取り記録の再送確認に失敗:",
                                error
                            );

                            window.alert(
                                "再送処理を確認できませんでした。" +
                                "点取りは終了せず、記録を保持します。"
                            );
                        });
                    }

                    return;
                }

                const confirmed =
                    window.confirm(
                        "点取り練習を終了しますか？"
                    );

                if (!confirmed) {
                    return;
                }

                session.status = "finished";
                session.finishedAt =
                    new Date().toISOString();

                /*
                 * 終了した点取りセッションを
                 * 履歴へ追加する。
                 */
                try {
                    const savedHistory =
                        localStorage.getItem(
                            historyStorageKey
                        );

                    const history =
                        savedHistory === null
                            ? []
                            : JSON.parse(savedHistory);

                    if (!Array.isArray(history)) {
                        throw new Error(
                            "点取り履歴の形式が正しくありません。"
                        );
                    }

                    const existingIndex =
                        history.findIndex(
                            function (item) {
                                return (
                                    item &&
                                    item.id === session.id
                                );
                            }
                        );

                    if (existingIndex >= 0) {
                        history[existingIndex] = session;
                    } else {
                        history.push(session);
                    }

                    localStorage.setItem(
                        historyStorageKey,
                        JSON.stringify(history)
                    );
                } catch (error) {
                    console.error(
                        "点取り履歴の保存に失敗:",
                        error
                    );

                    window.alert(
                        "点取り履歴を保存できませんでした。" +
                        "点取りは終了せず、記録を保持します。"
                    );

                    return;
                }

                try {
                    localStorage.setItem(
                        storageKey,
                        JSON.stringify(session)
                    );
                } catch (error) {
                    console.error(
                        "点取り終了状態の保存に失敗:",
                        error
                    );
                    window.alert(
                        "点取りを終了できませんでした。"
                    );
                    return;
                }

                updateSessionDisplay();

                window.alert(
                    "点取り練習を終了しました。"
                );
            }
        );

        updateSessionDisplay();

        function updateModeDisplay() {
            const isScoreMode =
                modeSelect.value === "score";

            scorePanel.hidden =
                !isScoreMode;

            updateSessionDisplay();
        }

        modeSelect.addEventListener(
            "change",
            updateModeDisplay
        );

        updateModeDisplay();

        /*
         * 点取りモードの初期化完了後に、
         * 保存待ち記録の集計漏れを復旧する。
         *
         * この段階ではクラウド再送は行わない。
         */
        if (
            typeof window.BAS_CHECK_PENDING_PRACTICE_RECORDS ===
            "function"
        ) {
            const pendingRecords =
                window.BAS_CHECK_PENDING_PRACTICE_RECORDS();

            if (pendingRecords === null) {
                console.warn(
                    "[点取り練習] 保存待ち記録の復旧に失敗しました。"
                );
            }
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializePracticeMode
        );
    } else {
        initializePracticeMode();
    }
})();