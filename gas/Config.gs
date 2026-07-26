/**
 * Baika Archery System
 * Project Zero v2
 * GAS共通設定
 */

const SHEET_NAMES = {
  PRACTICE: "practice",
  MATCH: "match",
  METADATA: "metadata",
  MEMBERS: "members",
  PRACTICE_SESSIONS: "practiceSessions"
};

const ROLE_NAMES = {
  MEMBER: "member",
  ADMIN: "admin"
};

const DEFAULT_DATA = {
  MEMBERS: [
    {
      memberId: "mem_001",
      name: "部員A",
      displayName: "部員A",
      role: ROLE_NAMES.MEMBER,
      active: true
    },
    {
      memberId: "mem_002",
      name: "部員B",
      displayName: "部員B",
      role: ROLE_NAMES.MEMBER,
      active: true
    },
    {
      memberId: "mem_003",
      name: "部員C",
      displayName: "部員C",
      role: ROLE_NAMES.ADMIN,
      active: true
    }
  ],

  DEFAULT_PASSWORD: "baika"
};

/**
 * 部員情報を新形式へ統一する。
 *
 * 対応形式:
 *
 * 旧形式:
 * ["部員A", "部員B"]
 *
 * 新形式:
 * [
 *   {
 *     memberId: "mem_001",
 *     name: "部員A",
 *     displayName: "部員A",
 *     role: "member",
 *     active: true
 *   }
 * ]
 */
function normalizeMemberMaster(memberMaster) {
  if (!Array.isArray(memberMaster)) {
    return DEFAULT_DATA.MEMBERS.map(member => ({ ...member }));
  }

  return memberMaster
    .map((member, index) => {
      if (typeof member === "string") {
        return {
          memberId: createLegacyMemberId_(member, index),
          name: member,
          displayName: member,
          role: ROLE_NAMES.MEMBER,
          active: true
        };
      }

      if (!member || typeof member !== "object") {
        return null;
      }

      const name =
        String(
          member.name ||
          member.displayName ||
          member.memberName ||
          ""
        ).trim();

      if (!name) {
        return null;
      }

      return {
        memberId:
          String(member.memberId || "").trim() ||
          createLegacyMemberId_(name, index),

        name: name,

        displayName:
          String(member.displayName || "").trim() ||
          name,

        role:
          normalizeRole_(member.role),

        active:
          member.active !== false
      };
    })
    .filter(Boolean);
}

/**
 * 旧形式の部員に仮のmemberIdを付ける。
 *
 * 後で正式なUUIDへ移行可能。
 */
function createLegacyMemberId_(memberName, index) {
  const safeIndex = String(index + 1).padStart(3, "0");

  const source = String(memberName || "")
    .trim()
    .replace(/\s+/g, "_");

  return `legacy_${safeIndex}_${source}`;
}

/**
 * 権限名を安全な値へ統一する。
 */
function normalizeRole_(role) {
  return role === ROLE_NAMES.ADMIN
    ? ROLE_NAMES.ADMIN
    : ROLE_NAMES.MEMBER;
}

function testNormalizeMemberMaster() {
  const oldMembers = [
    "部員A",
    "部員B",
    "部員C"
  ];

  const result = normalizeMemberMaster(oldMembers);

  console.log(JSON.stringify(result, null, 2));
}