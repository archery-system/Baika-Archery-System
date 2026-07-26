/**
 * Baika Archery System
 * Project Zero
 * Dashboard Component
 */

(function () {
    "use strict";

    const HOME_CARDS = [
        {
            icon: "📝",
            title: "練習入力",
            description: "得点や着弾位置を記録します。",
            body:
                "的タップ、キーパッド、写真を使った入力へ進みます。",
            status: {
                label: "利用可能",
                type: "ready"
            },
            interactive: true,
            actions: [
                {
                    label: "練習入力を開く",
                    href: "practice.html",
                    className: "bas-button--primary"
                }
            ]
        },
        {
            icon: "📷",
            title: "撮影専用モード",
            description: "練習中の的写真を素早く撮影します。",
            body:
                "距離を選択し、撮影ガイドに合わせて写真を保存します。",
            status: {
                label: "開発中",
                type: "development"
            },
            interactive: true,
            actions: [
                {
                    label: "撮影画面を開く",
                    href: "camera-center.html",
                    className: "bas-button--secondary"
                }
            ]
        },
        {
            icon: "📊",
            title: "分析",
            description:
                "練習記録やグルーピングを振り返ります。",
            body:
                "得点推移、着弾傾向、将来のAIフォーム分析をまとめます。",
            status: {
                label: "開発中",
                type: "development"
            },
            interactive: true,
            actions: [
                {
                    label: "分析画面を開く",
                    href: "analysis.html",
                    className: "bas-button--outline"
                }
            ]
        },
        {
            icon: "🏆",
            title: "大会記録",
            description:
                "大会結果とラウンド記録を管理します。",
            body:
                "大会別の得点、順位、振り返りを保存できるようにします。",
            status: {
                label: "準備中",
                type: "planned"
            },
            interactive: true
        },
        {
            icon: "⚙️",
            title: "設定",
            description:
                "部員情報やシステム設定を管理します。",
            body:
                "ログイン、パスワード、表示設定などを扱う予定です。",
            status: {
                label: "準備中",
                type: "planned"
            },
            interactive: true
        }
    ];

    function setTextContent(id, value) {
        const element = document.getElementById(id);

        if (!element) {
            console.warn(
                `[Baika Dashboard] 表示場所がありません: ${id}`
            );

            return;
        }

        element.textContent = value;
    }

    function getCurrentUserName() {
        if (
            typeof BAS_STATE === "undefined" ||
            !BAS_STATE.currentUser
        ) {
            return "ゲストユーザー";
        }

        const currentUser = BAS_STATE.currentUser;

        if (
            typeof currentUser.name === "string" &&
            currentUser.name.trim() !== ""
        ) {
            return currentUser.name.trim() + " さん";
        }

        return "ゲストユーザー";
    }

    function renderCurrentUser() {
        setTextContent(
            "homeUserName",
            getCurrentUserName()
        );
    }

    function formatPracticeDate(dateValue) {
        if (
            typeof dateValue !== "string" ||
            dateValue.trim() === ""
        ) {
            return "記録なし";
        }

        const date =
            new Date(dateValue + "T00:00:00");

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(date);
    }

    function renderEmptyLastPractice() {
        setTextContent(
            "homeLastPracticeDate",
            "記録なし"
        );

        setTextContent(
            "homeLastPracticeDistance",
            "-"
        );

        setTextContent(
            "homeLastPracticeScore",
            "-"
        );

        setTextContent(
            "homeLastPracticeAverage",
            "-"
        );

        setTextContent(
            "homeLastPracticeArrowCount",
            "-"
        );

        setTextContent(
            "homeLastMemo",
            "前回の練習メモはありません。"
        );
    }

    function renderLastPractice() {
        const lastPractice =
            typeof BAS_STATE !== "undefined"
                ? BAS_STATE.lastPractice
                : null;

        if (!lastPractice) {
            renderEmptyLastPractice();
            return;
        }

        const totalScore =
            Number(lastPractice.totalScore);

        const averageScore =
            Number(lastPractice.averageScore);

        const arrowCount =
            Number(lastPractice.arrowCount);

        setTextContent(
            "homeLastPracticeDate",
            formatPracticeDate(lastPractice.date)
        );

        setTextContent(
            "homeLastPracticeDistance",
            lastPractice.distance || "-"
        );

        setTextContent(
            "homeLastPracticeScore",
            Number.isFinite(totalScore)
                ? String(totalScore)
                : "-"
        );

        setTextContent(
            "homeLastPracticeAverage",
            Number.isFinite(averageScore)
                ? averageScore.toFixed(2)
                : "-"
        );

        setTextContent(
            "homeLastPracticeArrowCount",
            Number.isFinite(arrowCount)
                ? String(arrowCount)
                : "-"
        );

        setTextContent(
            "homeLastMemo",
            typeof lastPractice.memo === "string" &&
            lastPractice.memo.trim() !== ""
                ? lastPractice.memo.trim()
                : "前回の練習メモはありません。"
        );
    }

    function renderHomeCards() {
        if (
            !window.BAS_CARD ||
            typeof window.BAS_CARD.renderAll !==
                "function"
        ) {
            console.error(
                "[Baika Dashboard] Cardコンポーネントを読み込めません。"
            );

            return;
        }

        window.BAS_CARD.renderAll({
            targetId: "homeFeatureCards",
            cards: HOME_CARDS
        });
    }

    function initializeDashboard() {
        renderCurrentUser();
        renderLastPractice();
        renderHomeCards();

        console.log(
            "[Baika Dashboard] ダッシュボードを初期化しました。"
        );
    }

    window.BAS_DASHBOARD = {
        initialize: initializeDashboard,
        renderCurrentUser: renderCurrentUser,
        renderLastPractice: renderLastPractice,
        renderHomeCards: renderHomeCards
    };
})();