import { DEFAULT_PRIVACY_POLICY, DEFAULT_TERMS_OF_SERVICE } from "./legalDefaults.js";
import { prisma } from "./prisma.js";

export const DEFAULT_SHARE_APP_MESSAGE = [
  "Buy and sell industrial surplus — machines, materials and services — on Surplus!",
  "",
  "Android:",
  "https://play.google.com/store/apps/details?id=com.surplus.surplus",
  "",
  "iPhone:",
  "https://apps.apple.com/in/app/surplus-to-value/id6804191126",
  "",
  "Or visit:",
  "https://surplustovalue.com",
].join("\n");

/** Admin-editable settings, keyed by the field name used in API payloads. */
export const APP_SETTINGS = {
  shareAppMessage: {
    key: "share_app_message",
    label: "Share message",
    maxLength: 2000,
    defaultValue: DEFAULT_SHARE_APP_MESSAGE,
  },
  termsOfService: {
    key: "terms_of_service",
    label: "Terms of Service",
    maxLength: 30000,
    defaultValue: DEFAULT_TERMS_OF_SERVICE,
  },
  privacyPolicy: {
    key: "privacy_policy",
    label: "Privacy Policy",
    maxLength: 30000,
    defaultValue: DEFAULT_PRIVACY_POLICY,
  },
};

const FIELDS = Object.keys(APP_SETTINGS);

/** Returns `{ [field]: { value, updatedAt } }`, using defaults for unset or blank rows. */
async function readSettings(fields = FIELDS) {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: fields.map((field) => APP_SETTINGS[field].key) } },
    select: { key: true, value: true, updatedAt: true },
  });
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return Object.fromEntries(
    fields.map((field) => {
      const row = byKey.get(APP_SETTINGS[field].key);
      const custom = row?.value?.trim() ? row : null;
      return [
        field,
        {
          value: custom ? custom.value : APP_SETTINGS[field].defaultValue,
          updatedAt: custom ? custom.updatedAt : null,
        },
      ];
    }),
  );
}

export async function getAppConfig() {
  const { shareAppMessage } = await readSettings(["shareAppMessage"]);
  return { shareAppMessage: shareAppMessage.value, updatedAt: shareAppMessage.updatedAt };
}

export async function getLegalConfig() {
  const { termsOfService, privacyPolicy } = await readSettings(["termsOfService", "privacyPolicy"]);
  return {
    termsOfService: { content: termsOfService.value, updatedAt: termsOfService.updatedAt },
    privacyPolicy: { content: privacyPolicy.value, updatedAt: privacyPolicy.updatedAt },
  };
}

export function getLegalDefaults() {
  return {
    termsOfService: { content: DEFAULT_TERMS_OF_SERVICE, updatedAt: null },
    privacyPolicy: { content: DEFAULT_PRIVACY_POLICY, updatedAt: null },
  };
}

export async function getAdminAppSettings() {
  const settings = await readSettings();
  return {
    settings,
    defaults: Object.fromEntries(FIELDS.map((field) => [field, APP_SETTINGS[field].defaultValue])),
    limits: Object.fromEntries(FIELDS.map((field) => [field, APP_SETTINGS[field].maxLength])),
  };
}

/**
 * Validates a PATCH body. Returns `{ error }` or `{ updates }` where updates
 * maps field names to trimmed values.
 */
export function parseSettingsUpdate(body) {
  const updates = {};
  for (const field of FIELDS) {
    if (body?.[field] === undefined) continue;
    const { label, maxLength } = APP_SETTINGS[field];
    const value = body[field];
    if (typeof value !== "string") return { error: `${label} must be text` };
    const trimmed = value.trim();
    if (!trimmed) return { error: `${label} cannot be empty` };
    if (trimmed.length > maxLength) {
      return { error: `${label} must be at most ${maxLength} characters` };
    }
    updates[field] = trimmed;
  }

  if (!Object.keys(updates).length) return { error: "No fields to update" };
  return { updates };
}

export async function updateAppSettings(updates, updatedBy) {
  for (const [field, value] of Object.entries(updates)) {
    const { key } = APP_SETTINGS[field];
    await prisma.appSetting.upsert({
      where: { key },
      create: { key, value, updatedBy },
      update: { value, updatedBy },
    });
  }
  return getAdminAppSettings();
}
