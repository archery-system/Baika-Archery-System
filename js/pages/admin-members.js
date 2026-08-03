/**
 * Baika Archery System
 * Project Zero
 * Administrator Member Management
 */

(function () {
    "use strict";

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdminMembersPage
    );

    /**
     * 部員管理画面を初期化する
     */
    async function initializeAdminMembersPage() {
        if (
            !window.V4Session ||
            typeof window.V4Session.requireAdmin !== "function" ||
            !window.V4Session.requireAdmin()
        ) {
            return;
        }

        initializeMemberAddForm();
        initializeMemberFormValidation();
        initializeMemberSave();

        renderLoadingRow();

try {
    const members = await loadMembers();

    renderMemberTable(members);
} catch (error) {

            console.error(
                "部員一覧の読み込みに失敗しました:",
                error
            );

            renderErrorRow(
                "部員情報を読み込めませんでした。"
            );
        }
    }

    /**
     * 部員追加フォームを準備する
     */
    function initializeMemberAddForm() {
        const toggleButton =
            document.getElementById(
                "toggleMemberAddForm"
            );

        const cancelButton =
            document.getElementById(
                "cancelMemberAdd"
            );

        const memberAddForm =
            document.getElementById(
                "memberAddForm"
            );

        if (!toggleButton || !memberAddForm) {
            return;
        }

        toggleButton.addEventListener(
            "click",
            function () {
                const shouldOpen =
                    memberAddForm.hidden;

                setMemberAddFormOpen(
                    shouldOpen
                );
            }
        );

              if (cancelButton) {
    cancelButton.addEventListener(
        "click",
        function () {
            memberAddForm.reset();

            const nameInput =
                document.getElementById(
                    "newMemberName"
                );

            if (nameInput) {
                nameInput.dispatchEvent(
                    new Event("input")
                );

                nameInput.focus();
            }
        }
    );
}
    }

    /**
     * 部員追加フォームの開閉状態を変更する
     */
    function setMemberAddFormOpen(isOpen) {
        const toggleButton =
            document.getElementById(
                "toggleMemberAddForm"
            );

        const memberAddForm =
            document.getElementById(
                "memberAddForm"
            );

        if (!toggleButton || !memberAddForm) {
            return;
        }

        memberAddForm.hidden = !isOpen;

        toggleButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        toggleButton.textContent =
            isOpen
                ? "追加フォームを閉じる"
                : "＋ 部員を追加";

        if (isOpen) {
            const nameInput =
                document.getElementById(
                    "newMemberName"
                );

            if (nameInput) {
                nameInput.focus();
            }
        }
    }

/**
 * 入力欄の状態を監視する
 */
function initializeMemberFormValidation() {

    const nameInput =
        document.getElementById(
            "newMemberName"
        );

    const passwordInput =
        document.getElementById(
            "newMemberPassword"
        );

    const saveButton =
        document.getElementById(
            "saveNewMember"
        );

    if (
        !nameInput ||
        !passwordInput ||
        !saveButton
    ) {
        return;
    }

    function updateButton() {

        const canSave =
            nameInput.value.trim() !== "" &&
            passwordInput.value.trim() !== "";

        saveButton.disabled = !canSave;

        saveButton.textContent =
            canSave
                ? "部員を登録"
                : "保存準備中";
    }

    nameInput.addEventListener(
        "input",
        updateButton
    );

    passwordInput.addEventListener(
        "input",
        updateButton
    );

    updateButton();
}

/**
 * 部員追加ボタンを準備する
 */
function initializeMemberSave() {
    const saveButton =
        document.getElementById(
            "saveNewMember"
        );

    if (!saveButton) {
        return;
    }

    saveButton.addEventListener(
        "click",
        saveNewMember
    );
}


/**
 * 新しい部員をGASへ登録する
 */
async function saveNewMember() {
    const nameInput =
        document.getElementById(
            "newMemberName"
        );

    const roleInput =
        document.getElementById(
            "newMemberRole"
        );

    const passwordInput =
        document.getElementById(
            "newMemberPassword"
        );

    const saveButton =
        document.getElementById(
            "saveNewMember"
        );

    const memberAddForm =
        document.getElementById(
            "memberAddForm"
        );

    if (
        !nameInput ||
        !roleInput ||
        !passwordInput ||
        !saveButton ||
        !memberAddForm
    ) {
        return;
    }

    const memberName =
        nameInput.value.trim();

    const role =
        roleInput.value === "admin"
            ? "admin"
            : "member";

    const password =
        passwordInput.value;

    if (!memberName) {
        alert("氏名を入力してください。");
        nameInput.focus();
        return;
    }

    if (!password) {
        alert(
            "初期パスワードを入力してください。"
        );
        passwordInput.focus();
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "登録中...";

    try {
    const result =
        await postAddMember({
            memberName: memberName,
            role: role,
            password: password
        });

    console.log(
        "部員登録API結果:",
        result
    );

    if (
        !result ||
        result.success !== true
    ) {
            throw new Error(
                result && result.message
                    ? result.message
                    : "部員を登録できませんでした。"
            );
        }

        renderMemberTable(
            Array.isArray(result.members)
                ? result.members
                : []
        );

        memberAddForm.reset();

        nameInput.dispatchEvent(
            new Event("input")
        );

        setMemberAddFormOpen(false);

        alert(
            result.message ||
            "部員を登録しました。"
        );
    } catch (error) {
        console.error(
            "部員登録に失敗しました:",
            error
        );

        alert(
            error && error.message
                ? error.message
                : "部員登録中にエラーが発生しました。"
        );
    } finally {
        nameInput.dispatchEvent(
            new Event("input")
        );
    }
}


/**
 * 部員追加APIへ送信する
 */
async function postAddMember(memberData) {
    if (
        typeof V4_GAS_API_URL !== "string" ||
        V4_GAS_API_URL.trim() === ""
    ) {
        throw new Error(
            "GAS API URLが設定されていません。"
        );
    }

    const response = await fetch(
        V4_GAS_API_URL,
        {
            method: "POST",
            body: JSON.stringify({
                action: "addMember",
                memberName:
                    memberData.memberName,
                role:
                    memberData.role,
                password:
                    memberData.password
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `部員登録に失敗しました。HTTP ${response.status}`
        );
    }

    const responseText =
        await response.text();

    if (!responseText) {
        throw new Error(
            "部員登録APIから応答がありません。"
        );
    }

    try {
        return JSON.parse(responseText);
    } catch (error) {
        console.error(
            "部員登録APIの応答:",
            responseText
        );

        throw new Error(
            "部員登録APIの応答形式が正しくありません。"
        );
    }
}

    /**
 * GASから正規化済みの部員一覧を取得する
 */
async function loadMembers() {
    if (
        typeof V4_GAS_API_URL !== "string" ||
        V4_GAS_API_URL.trim() === ""
    ) {
        throw new Error(
            "GAS API URLが設定されていません。"
        );
    }

    const separator =
        V4_GAS_API_URL.includes("?")
            ? "&"
            : "?";

    const requestUrl =
        `${V4_GAS_API_URL}${separator}action=getMembers`;

    const response = await fetch(
        requestUrl,
        {
            method: "GET",
            cache: "no-store"
        }
    );

    if (!response.ok) {
        throw new Error(
            `部員一覧の取得に失敗しました。HTTP ${response.status}`
        );
    }

    const result = await response.json();

    console.log(
        "部員一覧API取得結果:",
        result
    );

    if (
        !result ||
        result.success !== true ||
        !Array.isArray(result.members)
    ) {
        const message =
            result && result.message
                ? result.message
                : "部員一覧の応答形式が正しくありません。";

        throw new Error(message);
    }

    return result.members;
}

        /**
 * 部員一覧を表示する
 */
function renderMemberTable(members) {
    const tableBody =
        document.getElementById(
            "memberTableBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (
        !Array.isArray(members) ||
        members.length === 0
    ) {
        renderEmptyRow();
        return;
    }

    members.forEach(function (member, index) {
        const normalizedMember =
            normalizeMemberForDisplay(
                member,
                index
            );

        const row =
            document.createElement("tr");

        const memberId =
            createTableCell(
                normalizedMember.memberId
            );

        const name =
            createTableCell(
                normalizedMember.displayName
            );

        const role =
            createTableCell(
                formatRole(
                    normalizedMember.role
                )
            );

        const status =
    createTableCell(
        normalizedMember.active
            ? "利用中"
            : "利用停止"
    );

const actionCell =
    createMemberActionCell(
        normalizedMember
    );

row.appendChild(memberId);
row.appendChild(name);
row.appendChild(role);
row.appendChild(status);
row.appendChild(actionCell);

tableBody.appendChild(row);
    });
}

/**
 * 一覧表示用に部員情報を整える
 */
function normalizeMemberForDisplay(
    member,
    index
) {
    if (typeof member === "string") {
        return {
            memberId:
                `legacy_${String(index + 1).padStart(3, "0")}`,
            displayName: member,
            role: "member",
            active: true
        };
    }

    const memberData =
        member &&
        typeof member === "object"
            ? member
            : {};

    const displayName =
        memberData.displayName ||
        memberData.name ||
        memberData.memberName ||
        "氏名未設定";

    return {
        memberId:
            memberData.memberId ||
            `legacy_${String(index + 1).padStart(3, "0")}`,

        displayName: displayName,

        role:
            memberData.role || "member",

        active:
            memberData.active !== false
    };
}

/**
 * 部員一覧の操作セルを作成する
 */
function createMemberActionCell(member) {
    const cell =
        document.createElement("td");

    cell.style.padding = "12px";
    cell.style.borderBottom =
        "1px solid rgb(0 0 0 / 10%)";

    const editButton =
    document.createElement("button");

editButton.type = "button";
editButton.className =
    "bas-member-action-button";

editButton.textContent = "✏️";

editButton.style.display = "block";
editButton.style.margin = "0 auto";

editButton.title =
    `${member.displayName}さんを編集`;

editButton.setAttribute(
    "aria-label",
    `${member.displayName}さんを編集`
);

editButton.dataset.memberId =
    member.memberId;

    editButton.addEventListener(
        "click",
        function () {
            console.log(
                "編集対象の部員:",
                member
            );

            alert(
                `${member.displayName}さんの編集機能は準備中です。`
            );
        }
    );

    cell.appendChild(editButton);

    return cell;
}

    /**
     * テーブルのセルを作成する
     */
    function createTableCell(value) {
        const cell = document.createElement("td");

        cell.textContent = String(value || "");

        cell.style.width = "64px";
        cell.style.padding = "8px";
        cell.style.textAlign = "center";
        cell.style.verticalAlign = "middle";
        
        cell.style.borderBottom =
    "1px solid rgb(0 0 0 / 10%)";

        return cell;
    }

    /**
     * 権限を日本語表示へ変換する
     */
    function formatRole(role) {
        return role === "admin"
            ? "管理者"
            : "部員";
    }

    /**
     * 読み込み中の表示
     */
    function renderLoadingRow() {
        renderMessageRow(
            "部員情報を読み込んでいます。"
        );
    }

    /**
     * 部員が登録されていない場合の表示
     */
    function renderEmptyRow() {
        renderMessageRow(
            "登録されている部員がいません。"
        );
    }

    /**
     * エラー表示
     */
    function renderErrorRow(message) {
        renderMessageRow(message);
    }

    /**
     * テーブル全体を使って案内を表示する
     */
    function renderMessageRow(message) {
        const tableBody =
            document.getElementById("memberTableBody");

        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = "";

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = message;
        cell.style.padding = "20px";
        cell.style.textAlign = "center";

        row.appendChild(cell);
        tableBody.appendChild(row);
    }
})();