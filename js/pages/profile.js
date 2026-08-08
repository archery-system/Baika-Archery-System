/**
 * Baika Archery System
 * Project Zero
 * Profile Page
 */

(function () {
    "use strict";

    /**
     * 要素をIDから取得する。
     *
     * @param {string} id
     * @returns {HTMLElement|null}
     */
    function getElement(id) {
        return document.getElementById(id);
    }

    /**
     * 入力欄へ安全に文字列を設定する。
     *
     * @param {string} elementId
     * @param {*} value
     */
    function setInputValue(elementId, value) {
        const element = getElement(elementId);

        if (!element) {
            console.warn(
                "[Baika Profile] 入力欄が見つかりません:",
                elementId
            );

            return;
        }

        element.value = String(
            value === null || value === undefined
                ? ""
                : value
        );
    }

    /**
     * 権限コードを画面表示用の日本語へ変換する。
     *
     * @param {string} role
     * @returns {string}
     */
    function getRoleLabel(role) {
        const normalizedRole =
            String(role || "").trim();

        if (normalizedRole === "admin") {
            return "管理者";
        }

        if (normalizedRole === "coach") {
            return "監督";
        }

        if (normalizedRole === "member") {
            return "部員";
        }

        return normalizedRole || "部員";
    }

    /**
     * GAS API URLを取得する。
     *
     * @returns {string}
     */
    function getApiUrl() {
        if (
            typeof V4_GAS_API_URL === "string" &&
            V4_GAS_API_URL.trim()
        ) {
            return V4_GAS_API_URL.trim();
        }

        if (
            typeof GAS_API_URL === "string" &&
            GAS_API_URL.trim()
        ) {
            return GAS_API_URL.trim();
        }

        return "";
    }

    /**
     * membersシート上の最新プロフィールを取得する。
     *
     * @param {string} memberId
     * @returns {Promise<Object>}
     */
    async function loadMyProfile(memberId) {
        const apiUrl = getApiUrl();

        if (!apiUrl) {
            throw new Error(
                "GAS API URLが設定されていません。"
            );
        }

        const normalizedMemberId =
            String(memberId || "").trim();

        if (!normalizedMemberId) {
            throw new Error(
                "ログイン中の部員IDを確認できませんでした。"
            );
        }

        const separator =
            apiUrl.includes("?")
                ? "&"
                : "?";

        const requestUrl =
            `${apiUrl}${separator}` +
            "action=getMyProfile" +
            `&memberId=${encodeURIComponent(
                normalizedMemberId
            )}`;

        const controller =
            new AbortController();

        const timeoutId =
            window.setTimeout(
                function () {
                    controller.abort();
                },
                15000
            );

        let response;

        try {
            response = await fetch(
                requestUrl,
                {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal
                }
            );
        } finally {
            window.clearTimeout(timeoutId);
        }

        if (!response.ok) {
            throw new Error(
                `プロフィール取得に失敗しました。HTTP ${response.status}`
            );
        }

        const responseText =
            await response.text();

        if (!responseText) {
            throw new Error(
                "プロフィール取得結果が空です。"
            );
        }

        let result;

        try {
            result = JSON.parse(responseText);
        } catch (error) {
            console.error(
                "[Baika Profile] JSON変換失敗:",
                responseText
            );

            throw new Error(
                "プロフィール取得結果を読み取れませんでした。"
            );
        }

        if (
            !result ||
            result.success !== true ||
            !result.member
        ) {
            throw new Error(
                result && result.message
                    ? result.message
                    : "プロフィールを取得できませんでした。"
            );
        }

        return result.member;
    }

/**
 * プロフィール基本情報を更新する。
 *
 * @param {Object} profileData
 * @returns {Promise<Object>}
 */
async function updateMyProfile(profileData) {
    const apiUrl = getApiUrl();

    if (!apiUrl) {
        throw new Error(
            "GAS API URLが設定されていません。"
        );
    }

    const response = await fetch(
        apiUrl,
        {
            method: "POST",
            body: JSON.stringify({
                action: "updateMyProfile",
                memberId:
                    String(
                        profileData.memberId || ""
                    ).trim(),
                displayName:
                    String(
                        profileData.displayName || ""
                    ).trim(),
                nickname:
                    String(
                        profileData.nickname || ""
                    ).trim(),
                currentPassword:
                    String(
                        profileData.currentPassword || ""
                    )
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `プロフィール保存に失敗しました。HTTP ${response.status}`
        );
    }

    const responseText =
        await response.text();

    if (!responseText) {
        throw new Error(
            "プロフィール保存結果が空です。"
        );
    }

    let result;

    try {
        result =
            JSON.parse(responseText);
    } catch (error) {
        console.error(
            "[Baika Profile] 保存結果JSON変換失敗:",
            responseText
        );

        throw new Error(
            "プロフィール保存結果を読み取れませんでした。"
        );
    }

    if (
        !result ||
        result.success !== true ||
        !result.member
    ) {
        throw new Error(
            result && result.message
                ? result.message
                : "プロフィールを保存できませんでした。"
        );
    }

    return result.member;
}

/**
 * ログイン中の部員のパスワードを変更する。
 *
 * @param {Object} passwordData
 * @returns {Promise<Object>}
 */
async function changeMyPassword(
    passwordData
) {
    const apiUrl = getApiUrl();

    if (!apiUrl) {
        throw new Error(
            "GAS API URLが設定されていません。"
        );
    }

    const response = await fetch(
        apiUrl,
        {
            method: "POST",
            body: JSON.stringify({
                action:
                    "changeMyPassword",

                memberId:
                    String(
                        passwordData.memberId ||
                        ""
                    ).trim(),

                currentPassword:
                    String(
                        passwordData
                            .currentPassword ||
                        ""
                    ),

                newPassword:
                    String(
                        passwordData.newPassword ||
                        ""
                    ),

                confirmPassword:
                    String(
                        passwordData
                            .confirmPassword ||
                        ""
                    )
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `パスワード変更に失敗しました。HTTP ${response.status}`
        );
    }

    const responseText =
        await response.text();

    if (!responseText) {
        throw new Error(
            "パスワード変更結果が空です。"
        );
    }

    let result;

    try {
        result =
            JSON.parse(responseText);
    } catch (error) {
        console.error(
            "[Baika Profile] パスワード変更結果JSON変換失敗:",
            responseText
        );

        throw new Error(
            "パスワード変更結果を読み取れませんでした。"
        );
    }

    if (
        !result ||
        result.success !== true
    ) {
        throw new Error(
            result && result.message
                ? result.message
                : "パスワードを変更できませんでした。"
        );
    }

    return result;
}

    /**
     * 基本情報欄へログイン中の部員情報を表示する。
     *
     * @param {Object} loginData
     */
    function renderBasicInformation(loginData) {
        setInputValue(
            "profileMemberId",
            loginData.memberId
        );

        setInputValue(
            "profileOfficialName",
            loginData.memberName
        );

        setInputValue(
            "profileDisplayName",
            loginData.displayName
        );

        /*
         * nicknameは現在の部員マスターと
         * ログインセッションにはまだ存在しない。
         *
         * GASとmembersシートへ正式に追加するまでは
         * 空欄として表示する。
         */
        setInputValue(
            "profileNickname",
            loginData.nickname || ""
        );

        setInputValue(
            "profileRole",
            getRoleLabel(loginData.role)
        );
    }

    /**
     * 基本情報欄の案内メッセージを表示する。
     *
     * @param {string} message
     * @param {string} type
     */
    function showBasicMessage(
        message,
        type = ""
    ) {
        const messageElement =
            getElement("profileBasicMessage");

        if (!messageElement) {
            return;
        }

        messageElement.textContent = message;

        messageElement.dataset.messageType =
            String(type || "");
    }

/**
 * パスワード変更欄の案内メッセージを表示する。
 *
 * @param {string} message
 * @param {string} type
 */
function showPasswordMessage(
    message,
    type = ""
) {
    const messageElement =
        getElement(
            "profilePasswordMessage"
        );

    if (!messageElement) {
        return;
    }

    messageElement.textContent =
        message;

    messageElement.dataset.messageType =
        String(type || "");
}

/**
 * 基本情報フォームを初期化する。
 *
 * @param {Object} loginData
 */
function initializeBasicForm(loginData) {
    const form =
        getElement("profileBasicForm");

    const saveButton =
        getElement(
            "profileBasicSaveButton"
        );

    if (
        !form ||
        !saveButton
    ) {
        return;
    }

    form.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            const displayNameInput =
                getElement(
                    "profileDisplayName"
                );

            const nicknameInput =
                getElement(
                    "profileNickname"
                );

            const passwordInput =
                getElement(
                    "profileBasicCurrentPassword"
                );

            if (
                !displayNameInput ||
                !nicknameInput ||
                !passwordInput
            ) {
                showBasicMessage(
                    "入力欄を確認できませんでした。",
                    "error"
                );

                return;
            }

            const displayName =
                displayNameInput.value.trim();

            const nickname =
                nicknameInput.value.trim();

            const currentPassword =
                passwordInput.value;

            if (!displayName) {
                showBasicMessage(
                    "表示名を入力してください。",
                    "error"
                );

                displayNameInput.focus();

                return;
            }

            if (!currentPassword) {
                showBasicMessage(
                    "現在のパスワードを入力してください。",
                    "error"
                );

                passwordInput.focus();

                return;
            }

            saveButton.disabled = true;
            saveButton.textContent =
                "保存中...";

            showBasicMessage(
                "プロフィールを保存しています。",
                "information"
            );

            try {
                const updatedMember =
                    await updateMyProfile({
                        memberId:
                            loginData.memberId,
                        displayName:
                            displayName,
                        nickname:
                            nickname,
                        currentPassword:
                            currentPassword
                    });

                renderBasicInformation(
                    updatedMember
                );

                if (
                    window.V4Session &&
                    typeof window.V4Session
                        .updateLoggedInMemberData ===
                        "function"
                ) {
                    window.V4Session
                        .updateLoggedInMemberData(
                            updatedMember
                        );
                }

                passwordInput.value = "";

                showBasicMessage(
                    "プロフィールを保存しました。",
                    "success"
                );
            } catch (error) {
                console.error(
                    "[Baika Profile] 保存失敗:",
                    error
                );

                showBasicMessage(
                    error && error.message
                        ? error.message
                        : "プロフィールを保存できませんでした。",
                    "error"
                );
            } finally {
                saveButton.disabled = false;
                saveButton.textContent =
                    "基本情報を保存";
            }
        }
    );
}

/**
 * パスワード変更フォームを初期化する。
 *
 * @param {Object} loginData
 */
function initializePasswordForm(
    loginData
) {
    const form =
        getElement(
            "profilePasswordForm"
        );

    const saveButton =
        getElement(
            "profilePasswordSaveButton"
        );

    if (
        !form ||
        !saveButton
    ) {
        return;
    }

    form.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            const currentPasswordInput =
                getElement(
                    "profileCurrentPassword"
                );

            const newPasswordInput =
                getElement(
                    "profileNewPassword"
                );

            const confirmPasswordInput =
                getElement(
                    "profileConfirmPassword"
                );

            if (
                !currentPasswordInput ||
                !newPasswordInput ||
                !confirmPasswordInput
            ) {
                showPasswordMessage(
                    "入力欄を確認できませんでした。",
                    "error"
                );

                return;
            }

            const currentPassword =
                currentPasswordInput.value;

            const newPassword =
                newPasswordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;

            if (!currentPassword) {
                showPasswordMessage(
                    "現在のパスワードを入力してください。",
                    "error"
                );

                currentPasswordInput.focus();

                return;
            }

            if (!newPassword) {
                showPasswordMessage(
                    "新しいパスワードを入力してください。",
                    "error"
                );

                newPasswordInput.focus();

                return;
            }

            if (!confirmPassword) {
                showPasswordMessage(
                    "確認用パスワードを入力してください。",
                    "error"
                );

                confirmPasswordInput.focus();

                return;
            }

            if (
                newPassword !==
                confirmPassword
            ) {
                showPasswordMessage(
                    "新しいパスワードと確認用パスワードが一致しません。",
                    "error"
                );

                confirmPasswordInput.focus();

                return;
            }

            if (
                newPassword ===
                currentPassword
            ) {
                showPasswordMessage(
                    "新しいパスワードは現在のパスワードと異なるものを設定してください。",
                    "error"
                );

                newPasswordInput.focus();

                return;
            }

            saveButton.disabled = true;
            saveButton.textContent =
                "変更中...";

            showPasswordMessage(
                "パスワードを変更しています。",
                "information"
            );

            try {
                await changeMyPassword({
                    memberId:
                        loginData.memberId,
                    currentPassword:
                        currentPassword,
                    newPassword:
                        newPassword,
                    confirmPassword:
                        confirmPassword
                });

                currentPasswordInput.value =
                    "";

                newPasswordInput.value =
                    "";

                confirmPasswordInput.value =
                    "";

                showPasswordMessage(
                    "パスワードを変更しました。",
                    "success"
                );
            } catch (error) {
                console.error(
                    "[Baika Profile] パスワード変更失敗:",
                    error
                );

                showPasswordMessage(
                    error && error.message
                        ? error.message
                        : "パスワードを変更できませんでした。",
                    "error"
                );
            } finally {
                saveButton.disabled = false;
                saveButton.textContent =
                    "パスワードを変更";
            }
        }
    );
}

    /**
     * プロフィール画面を初期化する。
     */
    async function initialize() {
        if (
            !window.V4Session ||
            typeof window.V4Session
                .getLoggedInMemberData !== "function"
        ) {
            console.error(
                "[Baika Profile] セッション管理を読み込めません。"
            );

            showBasicMessage(
                "ログイン情報を取得できませんでした。",
                "error"
            );

            return;
        }

        const loginData =
            window.V4Session.getLoggedInMemberData();

        if (
            !loginData ||
            typeof loginData !== "object"
        ) {
            console.warn(
                "[Baika Profile] ログイン情報がありません。"
            );

            showBasicMessage(
                "ログイン情報が見つかりませんでした。",
                "error"
            );

            return;
        }

        /*
         * API取得中も画面が空にならないよう、
         * 先にログインセッションの情報を表示する。
         */
            renderBasicInformation(loginData);

            initializeBasicForm(loginData);
            initializePasswordForm(loginData);

            showBasicMessage(
            "最新のプロフィール情報を読み込んでいます。",
            "information"
        );

        try {
            const profileData =
                await loadMyProfile(
                    loginData.memberId
                );

            renderBasicInformation(profileData);

            showBasicMessage(
                "最新のプロフィール情報を表示しています。表示名とニックネームを変更できます。",
                "information"
            );
        } catch (error) {
            console.error(
                "[Baika Profile] プロフィール取得失敗:",
                error
            );

            showBasicMessage(
                error && error.name === "AbortError"
                    ? "プロフィール情報の取得がタイムアウトしました。ログイン時の情報を表示しています。"
                    : (
                        error && error.message
                            ? `${error.message} ログイン時の情報を表示しています。`
                            : "最新情報を取得できなかったため、ログイン時の情報を表示しています。"
                    ),
                "error"
            );
        }
    }

    window.BAS_PROFILE = {
        initialize
    };
})();