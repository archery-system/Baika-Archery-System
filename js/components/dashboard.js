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

    async function renderLastPractice() {
    if (
        !window.BAS_CLOUD ||
        typeof window.BAS_CLOUD.loadPracticeRecords !==
            "function"
    ) {
        console.error(
            "[Baika Dashboard] クラウド機能を読み込めません。"
        );

        renderEmptyLastPractice();
        return;
    }

    if (
        !window.V4Session ||
        typeof window.V4Session.getLoggedInMemberData !==
            "function"
    ) {
        console.error(
            "[Baika Dashboard] ログイン情報を取得できません。"
        );

        renderEmptyLastPractice();
        return;
    }

    setTextContent(
        "homeLastPracticeDate",
        "読込中..."
    );

    try {
        const records =
            await window.BAS_CLOUD.loadPracticeRecords();

        const loginMember =
            window.V4Session.getLoggedInMemberData();

        if (
            !Array.isArray(records) ||
            !loginMember
        ) {
            renderEmptyLastPractice();
            return;
        }

        const memberId =
            typeof loginMember.memberId === "string"
                ? loginMember.memberId.trim()
                : "";

        const memberName =
            typeof loginMember.memberName === "string"
                ? loginMember.memberName.trim()
                : "";

        const myRecords =
            records.filter(function (record) {
                if (!record) {
                    return false;
                }

                const recordMemberId =
                    typeof record.memberId === "string"
                        ? record.memberId.trim()
                        : "";

                const recordMemberName =
                    typeof record.memberName === "string"
                        ? record.memberName.trim()
                        : "";

                if (
                    memberId !== "" &&
                    recordMemberId === memberId
                ) {
                    return true;
                }

                return (
                    recordMemberId === "" &&
                    memberName !== "" &&
                    recordMemberName === memberName
                );
            });

        if (myRecords.length === 0) {
            renderEmptyLastPractice();
            return;
        }

        const latestDate =
            myRecords
                .map(function (record) {
                    return typeof record.date === "string"
                        ? record.date.trim()
                        : "";
                })
                .filter(function (date) {
                    return date !== "";
                })
                .sort()
                .at(-1);

        if (!latestDate) {
            renderEmptyLastPractice();
            return;
        }

        const latestRecords =
            myRecords.filter(function (record) {
                return record.date === latestDate;
            });

        let totalScore = 0;
        let arrowCount = 0;

        latestRecords.forEach(function (record) {
            [
                "a1",
                "a2",
                "a3",
                "a4",
                "a5",
                "a6"
            ].forEach(function (key) {
                const rawValue = record[key];

                if (
                    rawValue === "" ||
                    rawValue === null ||
                    typeof rawValue === "undefined"
                ) {
                    return;
                }

                const score = Number(rawValue);

                if (!Number.isFinite(score)) {
                    return;
                }

                totalScore += score;
                arrowCount += 1;
            });
        });

        const averageScore =
            arrowCount > 0
                ? totalScore / arrowCount
                : null;

        const distances =
            Array.from(
                new Set(
                    latestRecords
                        .map(function (record) {
                            return typeof record.distance ===
                                "string"
                                ? record.distance.trim()
                                : "";
                        })
                        .filter(function (distance) {
                            return distance !== "";
                        })
                )
            );

        const memoRecord =
            latestRecords
                .slice()
                .reverse()
                .find(function (record) {
                    return (
                        typeof record.memo === "string" &&
                        record.memo.trim() !== ""
                    );
                });

        setTextContent(
            "homeLastPracticeDate",
            formatPracticeDate(latestDate)
        );

        setTextContent(
            "homeLastPracticeDistance",
            distances.length > 0
                ? distances.join(" / ")
                : "-"
        );

        setTextContent(
            "homeLastPracticeScore",
            arrowCount > 0
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
            arrowCount > 0
                ? String(arrowCount)
                : "-"
        );

        setTextContent(
            "homeLastMemo",
            memoRecord
                ? memoRecord.memo.trim()
                : "前回の練習メモはありません。"
        );

        console.log(
            "[Baika Dashboard] 最新練習を表示しました。",
            {
                memberId: memberId,
                memberName: memberName,
                latestDate: latestDate,
                endCount: latestRecords.length,
                totalScore: totalScore,
                averageScore: averageScore,
                arrowCount: arrowCount
            }
        );
    } catch (error) {
        console.error(
            "[Baika Dashboard] 最新練習の読込に失敗しました。",
            error
        );

        renderEmptyLastPractice();
    }
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

    async function initializeDashboard() {
    renderCurrentUser();
    renderHomeCards();

    await renderLastPractice();

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