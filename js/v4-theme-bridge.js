/**
 * Baika Archery System
 * Project Zero
 * Ver4 Practice Theme Bridge
 *
 * Organization Engineのテーマ設定を読み取り、
 * Ver4練習入力用のテーマクラスだけをHTMLへ反映します。
 */

(function () {
    "use strict";

    const DEFAULT_THEME = "baika-pink";

    const AVAILABLE_THEMES = [
        "baika-pink",
        "blue",
        "green",
        "dark"
    ];

    function normalizeTheme(themeName) {
        return AVAILABLE_THEMES.includes(themeName)
            ? themeName
            : DEFAULT_THEME;
    }

    function getOrganizationTheme() {
        if (
            window.BASOrganization &&
            typeof window.BASOrganization.get === "function"
        ) {
            const organization =
                window.BASOrganization.get();

            if (
                organization &&
                typeof organization.theme === "string"
            ) {
                return normalizeTheme(
                    organization.theme
                );
            }
        }

        return DEFAULT_THEME;
    }

    function applyTheme(themeName) {
        const selectedTheme =
            normalizeTheme(themeName);

        const root =
            document.documentElement;

        AVAILABLE_THEMES.forEach(function (theme) {
            root.classList.remove(
                "bas-theme-" + theme
            );
        });

        root.classList.add(
            "bas-theme-" + selectedTheme
        );

        root.dataset.basTheme =
            selectedTheme;

        return selectedTheme;
    }

    function applyOrganizationTheme() {
        return applyTheme(
            getOrganizationTheme()
        );
    }

    document.addEventListener(
        "bas:organization-changed",
        function (event) {
            if (
                event.detail &&
                typeof event.detail.theme === "string"
            ) {
                applyTheme(
                    event.detail.theme
                );
            }
        }
    );

    window.BAS_V4_THEME_BRIDGE = {
        apply: applyTheme,
        applyOrganizationTheme:
            applyOrganizationTheme
    };
})();