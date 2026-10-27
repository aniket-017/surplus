import { fileToPart, generateJson } from "./gemini.js";
import { createLogger, describeUploadFile } from "./logger.js";
import { parseServiceCategory } from "./serviceCategories.js";
import {
  SERVICE_CAPABILITIES_PROMPT,
  SERVICE_DRAFT_PROMPT,
  SERVICE_PHOTO_PROMPT,
  SERVICE_QUALITY_PROMPT,
} from "./servicePrompt.js";

const log = createLogger("service-ai");

const MAX_CAPABILITIES = 12;
const MAX_INPUT_CHARS = 2000;
const SERVICE_MODES = new Set(["workshop", "onsite", "both"]);
const QUALITY_FIELDS = new Set([
  "title",
  "description",
  "capabilities",
  "pricing",
  "experience",
  "turnaround",
  "photos",
]);

function clip(value, max = MAX_INPUT_CHARS) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeTags(raw, exclude = []) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set(exclude.map((item) => String(item).toLowerCase()));
  const tags = [];

  for (const item of raw) {
    const tag = String(item ?? "").trim().slice(0, 40);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= MAX_CAPABILITIES) break;
  }

  return tags;
}

export async function draftServiceFromText({ text, category, title, description }) {
  const input = clip(text);
  const currentTitle = clip(title, 200);
  const currentDescription = clip(description);

  if (!input && !currentTitle && !currentDescription) {
    throw new Error("Describe your work first");
  }

  const context = [
    input ? `Seller's description:\n${input}` : "",
    category ? `Category already chosen by seller: ${category}` : "",
    currentTitle ? `Current title: ${currentTitle}` : "",
    currentDescription ? `Current description:\n${currentDescription}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  log.info("Drafting service from text", { inputLength: input.length, category });

  const raw = await generateJson([SERVICE_DRAFT_PROMPT, context], { json: true });
  const serviceMode = String(raw.serviceMode || "").trim().toLowerCase();

  const draft = {
    category: parseServiceCategory(category) || parseServiceCategory(raw.category) || "Others",
    title: String(raw.title || "").trim().slice(0, 120),
    description: String(raw.description || "").trim(),
    capabilities: normalizeTags(raw.capabilities),
    turnaround: String(raw.turnaround || "").trim().slice(0, 60),
    serviceMode: SERVICE_MODES.has(serviceMode) ? serviceMode : "",
  };

  if (!draft.title || !draft.description) {
    log.warn("Service draft missing required fields", { raw });
    throw new Error("AI could not draft this service. Try adding a bit more detail.");
  }

  return draft;
}

export async function analyzeServicePhotos(files) {
  log.info("Analyzing service photos", {
    imageCount: files.length,
    images: files.map((file, index) => describeUploadFile(file, index)),
  });

  const raw = await generateJson(
    [SERVICE_PHOTO_PROMPT, ...files.map(fileToPart), "Respond with JSON only."],
    { json: true },
  );

  const analysis = {
    category: parseServiceCategory(raw.category) || "Others",
    title: String(raw.title || "").trim().slice(0, 120),
    caption: String(raw.caption || "").trim(),
    visibleProcesses: normalizeTags(raw.visibleProcesses),
  };

  if (!analysis.title && !analysis.caption) {
    log.warn("Service photo analysis empty", { raw });
    throw new Error("AI could not identify the service from these photos");
  }

  return analysis;
}

export async function suggestServiceCapabilities({ category, title, description, existing }) {
  const existingTags = Array.isArray(existing) ? existing.map(String) : [];
  const context = [
    `Category: ${clip(category, 100) || "Unknown"}`,
    `Title: ${clip(title, 200)}`,
    `Description: ${clip(description)}`,
    `Seller already has: ${existingTags.join(", ") || "none"}`,
  ].join("\n");

  const raw = await generateJson([SERVICE_CAPABILITIES_PROMPT, context], { json: true });
  return normalizeTags(raw.suggestions, existingTags).slice(0, 10);
}

export async function checkServiceQuality(form) {
  const summary = {
    category: clip(form?.category, 100),
    title: clip(form?.title, 200),
    description: clip(form?.description),
    capabilities: Array.isArray(form?.capabilities) ? form.capabilities.slice(0, 20) : [],
    priceType: clip(form?.priceType, 20),
    hasRate: Boolean(Number(form?.price) > 0),
    experienceYears: clip(form?.experienceYears, 10),
    turnaround: clip(form?.turnaround, 60),
    serviceMode: clip(form?.serviceMode, 20),
    photoCount: Number(form?.photoCount) || 0,
  };

  const raw = await generateJson(
    [SERVICE_QUALITY_PROMPT, `Listing:\n${JSON.stringify(summary, null, 2)}`],
    { json: true },
  );

  if (!Array.isArray(raw.issues)) return [];

  return raw.issues
    .filter((item) => item?.message)
    .slice(0, 5)
    .map((item) => ({
      field: QUALITY_FIELDS.has(item.field) ? item.field : "description",
      message: String(item.message).trim().slice(0, 200),
    }));
}
