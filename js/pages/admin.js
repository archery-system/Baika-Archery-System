/**
 * Baika Archery System
 * Project Zero
 * Administrator Page
 */

(function () {
    "use strict";

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdminPage
    );

    /**
     * 管理者画面を初期化する
     */
    function initializeAdminPage() {
    if (
        !window.V4Session ||
        typeof window.V4Session
            .getLoggedInMemberData !== "function"
    ) {
        console.error(
            "ログイン情報の確認機能を読み込めませんでした。"
        );

        window.location.replace("index.html");
        return;
    }

    const loginData =
        window.V4Session.getLoggedInMemberData();

    if (!loginData) {
        window.location.replace("index.html");
        return;
    }

    renderHeader();
    renderAdminInformation();
    updateAdminOnlyMenu(loginData);
    initializeAdminMenu();
}

    /**
     * 管理者専用メニューの表示状態を更新する。
     *
     * @param {Object} loginData
     */
    function updateAdminOnlyMenu(loginData) {
        const adminOnlyMenu =
            document.getElementById(
                "adminOnlyMenu"
            );

        if (!adminOnlyMenu) {
            return;
        }

        const role =
            String(
                loginData &&
                loginData.role
                    ? loginData.role
                    : ""
            ).trim();

        adminOnlyMenu.hidden =
            role !== "admin";
    }

    /**
     * 共通ヘッダーを表示する
     */
    function renderHeader() {
        if (
            !window.BAS_HEADER ||
            typeof window.BAS_HEADER.render !== "function"
        ) {
            console.warn(
                "共通ヘッダーを読み込めませんでした。"
            );

            return;
        }

        window.BAS_HEADER.render({
            targetId: "app-header",
            currentRoute: "admin"
        });
    }

    /**
     * ログイン中の管理者情報を表示する
     */
    function renderAdminInformation() {
        const loginData =
            window.V4Session.getLoggedInMemberData();

        if (!loginData) {
            window.location.replace("index.html");
            return;
        }

        setText(
            "adminMemberName",
            loginData.displayName ||
                loginData.memberName ||
                loginData.member ||
                "未設定"
        );

        setText(
            "adminMemberId",
            loginData.memberId || "未設定"
        );

        setText(
            "adminMemberRole",
            loginData.role === "admin"
                ? "管理者"
                : (
                    loginData.role === "coach"
                        ? "監督"
                        : (
                            loginData.role === "member"
                                ? "部員"
                                : loginData.role || "未設定"
                        )
                )
        );
    }

/**
 * 管理メニューのボタンを準備する
 */
function initializeAdminMenu() {
    const memberManagerButton =
        document.getElementById("openMemberManager");

    const recordManagerButton =
        document.getElementById("openRecordManager");

    if (memberManagerButton) {
        memberManagerButton.addEventListener(
            "click",
            function () {
                window.location.href =
                    "project-zero-admin-members.html";
            }
        );
    }

    if (recordManagerButton) {
        recordManagerButton.addEventListener(
            "click",
            function () {
                window.location.href =
                    "project-zero-admin-records.html";
            }
        );
    }
}

    /**
     * 指定した要素へ文字を表示する
     */
    function setText(elementId, value) {
        const element = document.getElementById(elementId);

        if (!element) {
            return;
        }

        element.textContent = String(value);
    }
})();