/**
 * Baika Archery System
 * Project Zero
 * Header Component
 */

(function () {
    "use strict";

    const LOGIN_STORAGE_KEY = "baikaArcheryVer4Login";

        const HEADER_ITEMS = [
        {
            route: "home",
            label: "ホーム",
            icon: "🏠",
            href: "project-zero-home.html"
        },
        {
            route: "practice",
            label: "練習入力",
            icon: "📝",
            href: "practice.html"
        },
        {
            route: "records",
            label: "記録",
            icon: "📚",
            href: "project-zero-record-center.html"
        },
        {
            route: "analysis",
            label: "分析",
            icon: "📊",
            href: "analysis.html"
        },
        {
            route: "cameraCenter",
            label: "撮影",
            icon: "📷",
            href: "camera-center.html"
        }
    ];

const ADMIN_HEADER_ITEM = {
    route: "admin",
    label: "管理",
    icon: "⚙️",
    href: "project-zero-admin.html"
};

    function createNavigationLink(item, currentRoute) {
        const link = document.createElement("a");

        link.className = "bas-header__nav-link";
        link.href = item.href;

        if (item.route === currentRoute) {
            link.setAttribute("aria-current", "page");
        }

        const icon = document.createElement("span");

        icon.className = "bas-header__nav-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = item.icon;

        const label = document.createElement("span");

        label.textContent = item.label;

        link.append(icon, label);

        return link;
    }

    function getLoggedInMember() {
        if (
            window.V4Session &&
            typeof window.V4Session.getLoggedInMember === "function"
        ) {
            return window.V4Session.getLoggedInMember();
        }

        try {
            const savedData = localStorage.getItem(LOGIN_STORAGE_KEY);

            if (!savedData) {
                return "";
            }

            const loginData = JSON.parse(savedData);

            return (
                loginData &&
                typeof loginData.member === "string"
                    ? loginData.member.trim()
                    : ""
            );
        } catch (error) {
            console.warn(
                "[Baika Header] ログイン情報を取得できませんでした:",
                error
            );

            localStorage.removeItem(LOGIN_STORAGE_KEY);

            return "";
        }
    }

function isAdminLoggedIn() {
    if (
        window.V4Session &&
        typeof window.V4Session.isAdmin === "function"
    ) {
        return window.V4Session.isAdmin();
    }

    try {
        const savedData =
            localStorage.getItem(LOGIN_STORAGE_KEY);

        if (!savedData) {
            return false;
        }

        const loginData = JSON.parse(savedData);

        return (
            loginData &&
            String(loginData.role || "").trim() === "admin"
        );
    } catch (error) {
        console.warn(
            "管理者権限を確認できませんでした:",
            error
        );

        return false;
    }
}

    function logout() {
        localStorage.removeItem(LOGIN_STORAGE_KEY);
        window.location.href = "index.html";
    }

    function createAccountArea() {
        const accountArea = document.createElement("div");

        accountArea.className = "bas-header__account";

        const memberName = document.createElement("span");

        memberName.className = "bas-header__member";

        const loggedInMember = getLoggedInMember();

        memberName.textContent = loggedInMember
            ? `👤 ${loggedInMember}`
            : "👤 未ログイン";

        const logoutButton = document.createElement("button");

        logoutButton.className = "bas-header__logout";
        logoutButton.type = "button";
        logoutButton.textContent = "ログアウト";
        logoutButton.setAttribute("aria-label", "ログアウト");
        logoutButton.addEventListener("click", logout);

        accountArea.append(memberName, logoutButton);

        return accountArea;
    }

    function createHeader(currentRoute) {
        const header = document.createElement("header");

        header.className = "bas-header";

        const inner = document.createElement("div");

        inner.className = "bas-header__inner";

        const brand = document.createElement("a");

        brand.className = "bas-header__brand";
        brand.href = "project-zero-home.html";

        const mark = document.createElement("span");

        mark.className = "bas-header__mark";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = "🏹";

        const brandText = document.createElement("span");

        brandText.className = "bas-header__brand-text";

        const title = document.createElement("span");

        title.className = "bas-header__title";
        title.textContent = "Baika Archery System";

        const subtitle = document.createElement("span");

        subtitle.className = "bas-header__subtitle";
        subtitle.textContent =
            "梅花女子大学アーチェリー部 練習支援システム";

        brandText.append(title, subtitle);
        brand.append(mark, brandText);

        const navigation = document.createElement("nav");

        navigation.className = "bas-header__nav";
        navigation.setAttribute("aria-label", "主要メニュー");

const navigationItems = [
    ...HEADER_ITEMS,
    ADMIN_HEADER_ITEM
];

navigationItems.forEach(function (item) {
    navigation.append(
        createNavigationLink(item, currentRoute)
    );
});

        const rightArea = document.createElement("div");

        rightArea.className = "bas-header__right";
        rightArea.append(
            navigation,
            createAccountArea()
        );

        inner.append(brand, rightArea);
        header.append(inner);

        return header;
    }

    function renderHeader(options) {
        const settings = options || {};
        const targetId = settings.targetId || "app-header";
        const target = document.getElementById(targetId);

        if (!target) {
            console.warn(
                "[Baika Header] ヘッダー表示先が見つかりません:",
                targetId
            );

            return;
        }

        const currentRoute =
            settings.currentRoute ||
            (
                window.BAS_ROUTER &&
                typeof window.BAS_ROUTER.detectCurrentRoute ===
                    "function"
                    ? window.BAS_ROUTER.detectCurrentRoute()
                    : "home"
            );

        target.replaceChildren(createHeader(currentRoute));
    }

    window.BAS_HEADER = {
        render: renderHeader,
        getLoggedInMember: getLoggedInMember,
        logout: logout
    };
})();
