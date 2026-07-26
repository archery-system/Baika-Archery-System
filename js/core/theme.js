/**
 * Baika Archery System
 * Theme Engine
 *
 * Organization Engineで設定されたテーマを読み取り、
 * HTMLへテーマ情報を反映します。
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

    let currentTheme = DEFAULT_THEME;

    /**
     * テーマ名が使用可能か確認します。
     */
    function isValidTheme(themeName) {
        return AVAILABLE_THEMES.includes(themeName);
    }

    /**
     * 現在設定されているテーマ名を取得します。
     */
    function getOrganizationTheme() {
        if (
            window.BASOrganization &&
            typeof window.BASOrganization.get === "function"
        ) {
            const organization = window.BASOrganization.get();

            if (
                organization &&
                isValidTheme(organization.theme)
            ) {
                return organization.theme;
            }
        }

        return DEFAULT_THEME;
    }

    /**
     * HTMLへテーマを適用します。
     */
    function applyTheme(themeName) {
        const selectedTheme = isValidTheme(themeName)
            ? themeName
            : DEFAULT_THEME;

        const rootElement = document.documentElement;

        AVAILABLE_THEMES.forEach(function (theme) {
            rootElement.classList.remove(
                "bas-theme-" + theme
            );
        });

        rootElement.classList.add(
            "bas-theme-" + selectedTheme
        );

        rootElement.dataset.basTheme = selectedTheme;

        currentTheme = selectedTheme;

        document.dispatchEvent(
            new CustomEvent("bas:theme-changed", {
                detail: {
                    theme: selectedTheme
                }
            })
        );

        return selectedTheme;
    }

    /**
     * Organization Engineの設定からテーマを適用します。
     */
    function applyOrganizationTheme() {
        return applyTheme(getOrganizationTheme());
    }

    /**
     * テーマを変更し、Organization Engineへ保存します。
     */
    function setTheme(themeName) {
        if (!isValidTheme(themeName)) {
            console.error(
                "存在しないテーマです。",
                themeName
            );

            return false;
        }

        if (
            window.BASOrganization &&
            typeof window.BASOrganization.update === "function"
        ) {
            window.BASOrganization.update({
                theme: themeName
            });
        }

        applyTheme(themeName);

        return true;
    }

    /**
     * 現在のテーマ名を取得します。
     */
    function getCurrentTheme() {
        return currentTheme;
    }

    /**
     * 使用可能なテーマ一覧を取得します。
     */
    function getAvailableThemes() {
        return [...AVAILABLE_THEMES];
    }

    /**
     * Organization設定変更時にテーマを再適用します。
     */
    document.addEventListener(
        "bas:organization-changed",
        function (event) {
            const organization = event.detail;

            if (
                organization &&
                isValidTheme(organization.theme)
            ) {
                applyTheme(organization.theme);
            }
        }
    );

    /**
     * HTML読み込み完了時にテーマを適用します。
     */
    function initializeTheme() {
        applyOrganizationTheme();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeTheme
        );
    } else {
        initializeTheme();
    }

    /**
     * 他のJavaScriptから利用できるように公開します。
     */
    window.BASTheme = {
        apply: applyTheme,
        applyOrganizationTheme: applyOrganizationTheme,
        set: setTheme,
        getCurrent: getCurrentTheme,
        getAvailable: getAvailableThemes,
        isValid: isValidTheme
    };
})();