/**
 * Baika Archery System
 * Project Zero
 * Home Page
 */

(function () {
    "use strict";

    function initialize() {

        initializeWelcome();

        initializeDashboard();
        initializeAiDashboard();
        initializeTodayPractice();
        initializeAiCoach();
    }

    function initializeDashboard() {
        if (
            window.BAS_DASHBOARD &&
            typeof window.BAS_DASHBOARD.initialize === "function"
        ) {
            window.BAS_DASHBOARD.initialize();
        }
    }

    function initializeAiDashboard() {
        if (
            window.BAS_AI_DASHBOARD &&
            typeof window.BAS_AI_DASHBOARD.initialize === "function"
        ) {
            window.BAS_AI_DASHBOARD.initialize();
        }
    }

    function initializeTodayPractice() {
        if (
            window.BAS_TODAY_PRACTICE &&
            typeof window.BAS_TODAY_PRACTICE.initialize === "function"
        ) {
            window.BAS_TODAY_PRACTICE.initialize();
        }
    }

    function initializeAiCoach() {
        if (
            window.BAS_AI_COACH &&
            typeof window.BAS_AI_COACH.initialize === "function"
        ) {
            window.BAS_AI_COACH.initialize();
        }
    }

    function initializeWelcome() {
    const userNameElement =
        document.getElementById("homeUserName");

    const organizationNameElement =
        document.getElementById("homeOrganizationName");

    const currentUser =
        typeof BAS_STATE !== "undefined"
            ? BAS_STATE.currentUser
            : null;

    const userName =
        currentUser &&
        typeof currentUser.name === "string" &&
        currentUser.name.trim() !== ""
            ? currentUser.name.trim()
            : "ゲストユーザー";

    if (userNameElement) {
        userNameElement.textContent = userName;
    }

    const organization =
        window.BASOrganization &&
        typeof window.BASOrganization.get === "function"
            ? window.BASOrganization.get()
            : null;

    const universityName =
        organization &&
        typeof organization.universityName === "string"
            ? organization.universityName.trim()
            : "";

    const clubName =
        organization &&
        typeof organization.clubName === "string"
            ? organization.clubName.trim()
            : "";

    const organizationName =
        [universityName, clubName]
            .filter(function (value) {
                return value !== "";
            })
            .join("");

    if (organizationNameElement) {
        organizationNameElement.textContent =
            organizationName ||
            "アーチェリー部";
    }

const greetingElement =
    document.getElementById("homeGreeting");

if (greetingElement) {

    const hour =
        new Date().getHours();

    let greeting =
        "こんばんは";

    if (hour < 10) {

        greeting =
            "おはようございます";

    } else if (hour < 17) {

        greeting =
            "こんにちは";
    }

    greetingElement.textContent =
        greeting;
}

}


    window.BAS_HOME = {
        initialize
    };
})();