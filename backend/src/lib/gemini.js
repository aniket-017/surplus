import { GoogleGenerativeAI } from "@google/generative-ai";
import { normalizeCategory, suggestCategoryIcon } from "./category.js";
import { createLogger, describeUploadFile } from "./logger.js";
import { PRODUCT_ANALYSIS_PROMPT } from "./productPrompt.js";

const log = createLogger("gemini-analyze");

function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    log.error("GEMINI_API_KEY is not configured", new Error("GEMINI_API_KEY is not configured"));
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  log.info("Using Gemini model", { model: modelName });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: modelName });
}

function fileToPart(file) {
  if (!file.buffer) {
    throw new Error("Uploaded image buffer is missing");
  }

  return {
    inlineData: {
      data: file.buffer.toString("base64"),
      mimeType: file.mimetype,
    },
  };
}

function parseJsonResponse(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    log.error("Failed to parse Gemini JSON response", error);
    log.info("Raw Gemini response text", { text: cleaned.slice(0, 2000) });
    throw new Error("AI returned invalid JSON");
  }
}

function normalizeAnalysis(raw) {
  const attributes = Array.isArray(raw.attributes)
    ? raw.attributes
        .filter((item) => item?.key && item?.value)
        .slice(0, 10)
        .map((item) => ({
          key: String(item.key).trim(),
          value: String(item.value).trim(),
        }))
    : [];

  const category = normalizeCategory(raw.category);

  return {
    title: String(raw.title || "").trim(),
    category,
    subCategory: String(raw.subCategory || "").trim(),
    categoryIcon: suggestCategoryIcon(category),
    description: String(raw.description || "").trim(),
    quantityUnit: String(raw.quantityUnit || "").trim(),
    attributes,
  };
}

export async function analyzeProductImages(files) {
  log.info("Starting product image analysis", {
    imageCount: files.length,
    images: files.map((file, index) => describeUploadFile(file, index)),
  });

  const model = getModel();
  const imageParts = files.map(fileToPart);

  let result;
  try {
    result = await model.generateContent([
      PRODUCT_ANALYSIS_PROMPT,
      ...imageParts,
      "Respond with JSON only.",
    ]);
  } catch (error) {
    log.error("Gemini generateContent failed", error);
    throw new Error(error.message || "Gemini API request failed");
  }

  let text;
  try {
    text = result.response.text();
  } catch (error) {
    log.error("Gemini response.text() failed", error);
    log.info("Gemini response metadata", {
      candidates: result.response.candidates?.length ?? 0,
      promptFeedback: result.response.promptFeedback ?? null,
    });
    throw new Error(error.message || "Gemini returned an empty response");
  }

  log.info("Gemini response received", { textLength: text.length });

  const parsed = parseJsonResponse(text);
  const analysis = normalizeAnalysis(parsed);

  if (!analysis.title || !analysis.category) {
    log.warn("Gemini analysis missing required fields", { analysis, parsed });
    throw new Error("AI analysis did not return enough product details");
  }

  log.info("Product image analysis succeeded", {
    title: analysis.title,
    category: analysis.category,
    subCategory: analysis.subCategory,
    categoryIcon: analysis.categoryIcon,
  });

  return analysis;
}
