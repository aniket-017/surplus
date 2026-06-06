import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PRODUCT_ANALYSIS_PROMPT } from "./productPrompt.js";

function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });
}

function fileToPart(file) {
  const data = fs.readFileSync(file.path);
  return {
    inlineData: {
      data: data.toString("base64"),
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

  return JSON.parse(cleaned);
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

  return {
    title: String(raw.title || "").trim(),
    category: String(raw.category || "").trim(),
    subCategory: String(raw.subCategory || "").trim(),
    description: String(raw.description || "").trim(),
    quantityUnit: String(raw.quantityUnit || "").trim(),
    attributes,
  };
}

export async function analyzeProductImages(files) {
  const model = getModel();
  const imageParts = files.map(fileToPart);

  const result = await model.generateContent([
    PRODUCT_ANALYSIS_PROMPT,
    ...imageParts,
    "Respond with JSON only.",
  ]);

  const text = result.response.text();
  const parsed = parseJsonResponse(text);
  const analysis = normalizeAnalysis(parsed);

  if (!analysis.title || !analysis.category) {
    throw new Error("AI analysis did not return enough product details");
  }

  return analysis;
}
