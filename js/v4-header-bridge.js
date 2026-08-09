/**
 * Baika Archery System
 * Project Zero
 * Ver4 Practice Header Bridge
 *
 * 既存のVer4ヘッダー構造を維持したまま、
 * Project Zeroのメニュー構成へ寄せます。
 */

(function () {
    "use strict";

    const BASE_ITEMS = [
        {
            label: "ホーム",
            icon: "🏠",
            href: "project-zero-home.html"
        },
        {
            label: "練習入力",
            icon: "📝",
            href: "practice.html",
            active: true
        },
        {
            label: "記録",
            icon: "📚",
            href: "project-zero-record-center.html"
        },
        {
            label: "分析",
            icon: "📊",
            href: "analysis.html"
        },
        {
            label: "撮影",
            icon: "📷",
            href: "camera-center.html"
        },
        {
            label: "管理",
            icon: "⚙️",
            href: "project-zero-admin.html"
        }
    ];
        
    function getNavigationItems() {
        return BASE_ITEMS.map(function (item) {
            return { ...item };
        });
    }

    function createLink(item) {
        const link = document.createElement("a");

        link.href = item.href;

        if (item.active) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }

        const icon = document.createElement("span");

        icon.className = "v4-header-nav-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = item.icon;

        const label = document.createElement("span");

        label.className = "v4-header-nav-label";
        label.textContent = item.label;

        link.append(icon, label);

        return link;
    }

    function renderNavigation() {
        const navigation =
            document.querySelector(".v4-nav");

        if (!navigation) {
            console.warn(
                "[Practice Header] .v4-nav が見つかりません。"
            );

            return false;
        }

        const items = getNavigationItems();

        navigation.replaceChildren(
            ...items.map(createLink)
        );

        return true;
    }

    function createAccountArea() {
    const accountArea = document.createElement("div");

    accountArea.className = "v4-header-account";

    const memberName = document.createElement("span");

    memberName.className = "v4-header-member";

    const loggedInMember =
        window.V4Session &&
        typeof window.V4Session.getLoggedInMember === "function"
            ? window.V4Session.getLoggedInMember()
            : "";

    memberName.textContent = loggedInMember
        ? `👤 ${loggedInMember}`
        : "👤 未ログイン";

    const logoutButton =
        document.createElement("button");

    logoutButton.type = "button";
    logoutButton.className =
        "v4-header-logout";
    logoutButton.textContent =
        "ログアウト";

    logoutButton.addEventListener(
        "click",
        function () {
            if (
                window.V4Session &&
                typeof window.V4Session.clearSession ===
                    "function"
            ) {
                window.V4Session.clearSession();
            }

            window.location.href = "index.html";
        }
    );

    accountArea.append(
        memberName,
        logoutButton
    );

    return accountArea;
}

function renderAccountArea() {
    const header =
        document.querySelector(".v4-header");

    const navigation =
        header
            ? header.querySelector(".v4-nav")
            : null;

    if (!header || !navigation) {
        return false;
    }

    let rightArea =
        header.querySelector(
            ".v4-header-right"
        );

    if (!rightArea) {
        rightArea =
            document.createElement("div");

        rightArea.className =
            "v4-header-right";

        header.append(rightArea);
    }

    const oldAccount =
        header.querySelector(
            ".v4-header-account"
        );

    if (oldAccount) {
        oldAccount.remove();
    }

    if (
        navigation.parentElement !==
        rightArea
    ) {
        rightArea.append(navigation);
    }

    rightArea.append(
        createAccountArea()
    );

    return true;
}

  window.BAS_V4_HEADER_BRIDGE = {
    render: function () {
        renderNavigation();
        renderAccountArea();
    },
    renderNavigation: renderNavigation,
    renderAccountArea: renderAccountArea,
    getNavigationItems: getNavigationItems
   };
})();