/**
 * Baika Archery System
 * Project Zero
 * Page Header Component
 */

(function () {
    "use strict";

    function createPageHeader(options) {
        const settings = options || {};

        const header =
            document.createElement("header");

        header.className =
            "bas-page-header";

        const main =
            document.createElement("div");

        main.className =
            "bas-page-header__main";

        if (settings.eyebrow) {
            const eyebrow =
                document.createElement("p");

            eyebrow.className =
                "bas-page-header__eyebrow";

            eyebrow.textContent =
                settings.eyebrow;

            main.append(eyebrow);
        }

        const title =
            document.createElement("h1");

        title.className =
            "bas-page-header__title";

        title.textContent =
            settings.title ||
            "Baika Archery System";

        main.append(title);

        if (settings.description) {
            const description =
                document.createElement("p");

            description.className =
                "bas-page-header__description";

            description.textContent =
                settings.description;

            main.append(description);
        }

        header.append(main);

        if (
            settings.actionHref &&
            settings.actionLabel
        ) {
            const action =
                document.createElement("a");

            action.className =
                "bas-page-header__action";

            action.href =
                settings.actionHref;

            action.target =
                "_blank";

            action.rel =
                "noopener noreferrer";

            action.textContent =
                settings.actionLabel;

            header.append(action);
        }

        return header;
    }

    function renderPageHeader(options) {
        const settings = options || {};
        const targetId =
            settings.targetId || "page-header";
        const target =
            document.getElementById(targetId);

        if (!target) {
            console.warn(
                "[Baika Page Header] 表示先が見つかりません:",
                targetId
            );

            return;
        }

        target.replaceChildren(
            createPageHeader(settings)
        );
    }

    window.BAS_PAGE_HEADER = {
        render: renderPageHeader
    };
})();