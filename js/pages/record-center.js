/**
 * Baika Archery System
 * Project Zero
 * Record Center Page
 */

(function () {
    "use strict";

    function initialize() {
        if (
            window.V4Session &&
            typeof window.V4Session.requireLogin ===
                "function"
        ) {
            window.V4Session.requireLogin();
        }

        console.log(
            "[Baika Record Center] 初期化しました。"
        );
    }

    window.BAS_RECORD_CENTER = {
        initialize: initialize
    };
})();