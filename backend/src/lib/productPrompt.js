export const PRODUCT_ANALYSIS_PROMPT = `You are an expert industrial surplus marketplace analyst for India.
Analyze the provided product image(s) and identify the industrial material or equipment shown.

Return ONLY valid JSON with this exact shape:
{
  "title": "string",
  "category": "string",
  "subCategory": "string",
  "description": "string",
  "quantityUnit": "string",
  "attributes": [{ "key": "string", "value": "string" }]
}

Rules:
- category must be exactly one of: Metals, Plastics, Piping, Machinery, Electronics, Chemicals, Rubber, Packaging, Construction, Textiles, Wood & Agro, Minerals, Energy, Safety, Others
- subCategory should be specific (e.g. Copper Scrap, HDPE Granules, MS Pipe, Industrial Solenoid Valve)
- description: 2-3 sentences, factual, suitable for a B2B listing
- quantityUnit: use kg, ton, meter, piece, lot, bag, drum, or similar
- attributes: 3-10 material-relevant key/value pairs using camelCase keys
- For metals include purity, grade, scrapType, insulation, color when visible
- For plastics include polymerType, color, mfi, density, virginOrRecycled when relevant
- For piping include diameter, length, thickness, material, coating when visible
- For machinery include make, model, capacity, powerRating when visible
- For electronics include voltage, phase, brand, condition when visible
- For chemicals include grade, purity, packaging, hazardClass when relevant
- Do not invent precise numbers unless reasonably visible or inferable
- Do not include markdown or extra text outside JSON`;

export const PRODUCT_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    category: { type: "string" },
    subCategory: { type: "string" },
    description: { type: "string" },
    quantityUnit: { type: "string" },
    attributes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "string" },
        },
        required: ["key", "value"],
      },
    },
  },
  required: ["title", "category", "subCategory", "description", "quantityUnit", "attributes"],
};
