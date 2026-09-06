/**
 * Baika Archery System
 * Project Zero
 * Equipment & Tuning Page
 */

(function () {
    "use strict";

    document.addEventListener(
        "DOMContentLoaded",
        initializeEquipmentPage
    );

    function initializeEquipmentPage() {
        const saveButton =
            document.getElementById(
                "equipmentSaveButton"
            );

        if (!saveButton) {
            return;
        }

        saveButton.addEventListener(
            "click",
            handleEquipmentSave
        );

        loadEquipmentSettings();

        loadEquipmentHistory();
    }

    async function loadEquipmentSettings() {
        const memberId =
            window.V4Session &&
                typeof window.V4Session.getLoggedInMemberId ===
                "function"
                ? window.V4Session.getLoggedInMemberId()
                : "";

        if (!memberId) {
            return;
        }

        try {
            const url =
                V4_GAS_API_URL +
                "?action=getEquipmentSettings" +
                "&memberId=" +
                encodeURIComponent(memberId);

            const response =
                await fetch(
                    url,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "弓具設定の取得に失敗しました。"
                );
            }

            const result =
                await response.json();

            if (
                !result ||
                result.success !== true
            ) {
                throw new Error(
                    result &&
                        result.message
                        ? result.message
                        : "弓具設定を取得できませんでした。"
                );
            }

            if (!result.equipment) {
                return;
            }

            setInputValue(
                "equipmentRiser",
                result.equipment.riser
            );

            setInputValue(
                "equipmentLimb",
                result.equipment.limb
            );

            setInputValue(
                "equipmentDisplayPoundage",
                result.equipment.displayPoundage
            );

            setInputValue(
                "equipmentPoundage",
                result.equipment.poundage
            );

            setInputValue(
                "equipmentArrowShaft",
                result.equipment.arrowShaft
            );

            setInputValue(
                "equipmentArrowSpine",
                result.equipment.arrowSpine
            );

            setInputValue(
                "equipmentPointWeight",
                result.equipment.pointWeight
            );

            setInputValue(
                "equipmentStringHeight",
                result.equipment.stringHeight
            );

            setInputValue(
                "equipmentTiller",
                result.equipment.tiller
            );

            setInputValue(
                "equipmentPlunger",
                result.equipment.plunger
            );
        } catch (error) {
            console.error(
                "[Baika Equipment] 読み込み失敗:",
                error
            );
        }
    }

    async function loadEquipmentHistory() {
        const memberId =
            window.V4Session &&
                typeof window.V4Session.getLoggedInMemberId ===
                "function"
                ? window.V4Session.getLoggedInMemberId()
                : "";

        if (!memberId) {
            return;
        }

        const message =
            document.getElementById(
                "equipmentHistoryMessage"
            );

        try {
            const url =
                V4_GAS_API_URL +
                "?action=getEquipmentHistory" +
                "&memberId=" +
                encodeURIComponent(memberId);

            const response =
                await fetch(
                    url,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "設定履歴の取得に失敗しました。"
                );
            }

            const result =
                await response.json();

            if (
                !result ||
                result.success !== true
            ) {
                throw new Error(
                    result &&
                        result.message
                        ? result.message
                        : "設定履歴を取得できませんでした。"
                );
            }

            console.log(
                "[Baika Equipment] 設定履歴",
                result.history
            );

            renderEquipmentHistory(
                result.history
            );

            if (message) {
                message.textContent =
                    Array.isArray(result.history) &&
                        result.history.length > 0
                        ? result.history.length +
                        "件の設定履歴があります。"
                        : "設定履歴はまだありません。";
            }
        } catch (error) {
            console.error(
                "[Baika Equipment] 履歴読み込み失敗:",
                error
            );

            if (message) {
                message.textContent =
                    "設定履歴を読み込めませんでした。";
            }
        }
    }

    function renderEquipmentHistory(history) {
        const list =
            document.getElementById(
                "equipmentHistoryList"
            );

        const message =
            document.getElementById(
                "equipmentHistoryMessage"
            );

        if (!list) {
            return;
        }

        if (
            !Array.isArray(history) ||
            history.length === 0
        ) {
            if (message) {
                message.textContent =
                    "設定履歴はまだありません。";
            }

            return;
        }

        list.innerHTML = "";

        history.forEach(function (record) {
            const item =
                document.createElement("article");

            item.className =
                "bas-equipment__history-item";

            const date =
                document.createElement("p");

            date.className =
                "bas-equipment__history-date";

            date.textContent =
                formatEquipmentHistoryDate(
                    record.savedAt
                );

            const details =
                document.createElement("div");

            details.className =
                "bas-equipment__history-details";

            const values = [
                ["ライザー", record.riser],
                ["リム", record.limb],
                [
                    "表示ポンド数",
                    record.displayPoundage
                ],
                [
                    "実質ポンド数",
                    record.poundage
                ],
                [
                    "シャフト",
                    record.arrowShaft
                ],
                [
                    "スパイン",
                    record.arrowSpine
                ],
                [
                    "ポイント重量",
                    record.pointWeight
                ],
                [
                    "ストリングハイト",
                    record.stringHeight
                ],
                [
                    "ティラー",
                    record.tiller
                ],
                [
                    "プランジャー",
                    record.plunger
                ]
            ];

            values.forEach(function (entry) {
                const detail =
                    document.createElement("p");

                detail.className =
                    "bas-equipment__history-detail";

                detail.textContent =
                    entry[0] +
                    "：" +
                    (
                        entry[1] === null ||
                            entry[1] === undefined ||
                            entry[1] === ""
                            ? "未設定"
                            : entry[1]
                    );

                details.appendChild(detail);
            });

            item.appendChild(date);
            item.appendChild(details);

            list.appendChild(item);
        });
    }

    function formatEquipmentHistoryDate(value) {
        if (!value) {
            return "保存日時不明";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(value);
        }

        return date.toLocaleString("ja-JP");
    }

    async function handleEquipmentSave() {
        const memberId =
            window.V4Session &&
                typeof window.V4Session.getLoggedInMemberId ===
                "function"
                ? window.V4Session.getLoggedInMemberId()
                : "";

        const equipment = {
            memberId: memberId,

            riser:
                getInputValue(
                    "equipmentRiser"
                ),

            limb:
                getInputValue(
                    "equipmentLimb"
                ),


            displayPoundage:
                getInputValue(
                    "equipmentDisplayPoundage"
                ),

            poundage:
                getInputValue(
                    "equipmentPoundage"
                ),

            arrowShaft:
                getInputValue(
                    "equipmentArrowShaft"
                ),

            arrowSpine:
                getInputValue(
                    "equipmentArrowSpine"
                ),

            pointWeight:
                getInputValue(
                    "equipmentPointWeight"
                ),

            stringHeight:
                getInputValue(
                    "equipmentStringHeight"
                ),

            tiller:
                getInputValue(
                    "equipmentTiller"
                ),

            plunger:
                getInputValue(
                    "equipmentPlunger"
                )
        };

        console.log(
            "[Baika Equipment] 入力内容",
            equipment
        );

        const saveButton =
            document.getElementById(
                "equipmentSaveButton"
            );

        const message =
            document.getElementById(
                "equipmentSaveMessage"
            );

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent =
                "保存中...";
        }

        if (message) {
            message.textContent =
                "弓具設定を保存しています。";

            delete message.dataset.messageType;
        }

        try {
            equipment.updatedAt =
                new Date().toISOString();

            const payload = {
                action:
                    "saveEquipmentSettings",

                record:
                    equipment
            };

            const response =
                await fetch(
                    V4_GAS_API_URL,
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "弓具設定の送信に失敗しました。"
                );
            }

            const result =
                await response.json();

            if (
                !result ||
                result.success !== true
            ) {
                throw new Error(
                    result &&
                        result.message
                        ? result.message
                        : "弓具設定を保存できませんでした。"
                );
            }

            if (message) {
                message.textContent =
                    "✅ 弓具設定を保存しました。";

                message.dataset.messageType =
                    "success";
            }
        } catch (error) {
            console.error(
                "[Baika Equipment] 保存失敗:",
                error
            );

            if (message) {
                message.textContent =
                    "弓具設定を保存できませんでした。";

                message.dataset.messageType =
                    "error";
            }
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent =
                    "弓具設定を保存";
            }
        }
    }

    function setInputValue(
        id,
        value
    ) {
        const input =
            document.getElementById(id);

        if (!input) {
            return;
        }

        input.value =
            value === null ||
                value === undefined
                ? ""
                : String(value);
    }

    function getInputValue(id) {
        const input =
            document.getElementById(id);

        if (!input) {
            return "";
        }

        return input.value.trim();
    }
})();