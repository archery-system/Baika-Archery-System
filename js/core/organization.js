/**
 * Baika Archery System
 * Organization Engine
 *
 * 大学名、部活動名、システム名、テーマなど、
 * 組織固有の情報を一元管理します。
 */

(function () {
    "use strict";

    const STORAGE_KEY = "bas-organization";

    /**
     * 初期組織設定
     *
     * 将来、他大学やクラブで使用する場合も、
     * この設定を変更することで表示内容を切り替えられます。
     */
    const DEFAULT_ORGANIZATION = {
        id: "baika-womens-university",

        universityName: "梅花女子大学",

        clubName: "アーチェリー部",

        systemName: "Baika Archery System",

        subtitle: "梅花女子大学アーチェリー部 練習支援システム",

        shortName: "BAS",

        theme: "baika-pink",

        logoUrl: "",

        backgroundImageUrl: "",

        footerText: "Baika Archery System"
    };

    let organization = loadOrganization();

    /**
     * 保存済み設定を読み込みます。
     */
    function loadOrganization() {
        try {
            const savedOrganization = localStorage.getItem(STORAGE_KEY);

            if (!savedOrganization) {
                return { ...DEFAULT_ORGANIZATION };
            }

            const parsedOrganization = JSON.parse(savedOrganization);

            return {
                ...DEFAULT_ORGANIZATION,
                ...parsedOrganization
            };
        } catch (error) {
            console.error(
                "組織設定の読み込みに失敗しました。",
                error
            );

            return { ...DEFAULT_ORGANIZATION };
        }
    }

    /**
     * 現在の組織設定を取得します。
     */
    function getOrganization() {
        return { ...organization };
    }

    /**
     * 組織設定を更新します。
     */
    function updateOrganization(newSettings) {
        if (
            !newSettings ||
            typeof newSettings !== "object" ||
            Array.isArray(newSettings)
        ) {
            console.error(
                "組織設定にはオブジェクトを指定してください。"
            );

            return false;
        }

        organization = {
            ...organization,
            ...newSettings
        };

        saveOrganization();

        document.dispatchEvent(
            new CustomEvent("bas:organization-changed", {
                detail: getOrganization()
            })
        );

        return true;
    }

    /**
     * 組織設定をlocalStorageへ保存します。
     */
    function saveOrganization() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(organization)
            );

            return true;
        } catch (error) {
            console.error(
                "組織設定の保存に失敗しました。",
                error
            );

            return false;
        }
    }

    /**
     * 組織設定を初期状態へ戻します。
     */
    function resetOrganization() {
        organization = { ...DEFAULT_ORGANIZATION };

        saveOrganization();

        document.dispatchEvent(
            new CustomEvent("bas:organization-changed", {
                detail: getOrganization()
            })
        );

        return getOrganization();
    }

    /**
     * 他のJavaScriptファイルから利用できるように公開します。
     */
    window.BASOrganization = {
        get: getOrganization,
        update: updateOrganization,
        reset: resetOrganization,
        defaults: { ...DEFAULT_ORGANIZATION }
    };
})();