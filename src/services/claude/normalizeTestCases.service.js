import anthropic from "../../config/anthropic.js";



//helper for stripping md fencing

function stripMarkdownCodeFence(text) {
  if (!text || typeof text !== "string") {
    return text;
  }

  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}


function extractTextFromClaudeResponse(response) {
  if (!response?.content || !Array.isArray(response.content)) {
    return "";
  }

  return response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

function buildNormalizationPrompt(parsedContent, suiteType) {
  return `
You are a software QA test case normalization assistant.

Your job is to convert uploaded test case content into a strict JSON array.

Rules:
1. Return ONLY valid JSON.
2. Do not wrap the response in markdown or code fences.
3. Output must be an array.
4. Each object must follow this exact structure:

[
  {
    "title": "string",
    "testType": "${suiteType}",
    "pageScope": "string",
    "steps": ["step 1", "step 2"],
    "expectedResult": "string",
    "assertionType": "string",
    "priority": "low | medium | high | critical"
  }
]

Normalization rules:
- title: short clear test case title
- testType: must stay "${suiteType}"
- pageScope: infer route/page if available, else empty string
- steps: always array of strings
- expectedResult: concise expected outcome
- assertionType: use one of:
  "ui_flow", "visual_check", "content_check", "api_check", "accessibility_check", "functional_check"
- priority: infer as low/medium/high/critical, default to medium if unclear

If input contains multiple test cases, return multiple objects in the array.
If input is messy, infer structure carefully.
Return only JSON.

Input:
${typeof parsedContent === "string" ? parsedContent : JSON.stringify(parsedContent, null, 2)}
`;
}

export async function normalizeTestCasesWithClaude({ parsedContent, suiteType }) {
  try {
    const prompt = buildNormalizationPrompt(parsedContent, suiteType);

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
      max_tokens: 4000,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = extractTextFromClaudeResponse(response).trim();
    const cleanedText = stripMarkdownCodeFence(rawText);
    let normalizedJson;
    try {
      normalizedJson = JSON.parse(cleanedText);
    } catch (parseError) {
      return {
        success: false,
        message: "Claude returned invalid JSON",
        rawResponse: rawText,
        cleanedResponse: cleanedText,
        error: parseError.message,
      };
    }

    if (!Array.isArray(normalizedJson)) {
      return {
        success: false,
        message: "Claude response is not an array",
        rawResponse: rawText,
        cleanedResponse: cleanedText,
      };
      
    }

    return {
      success: true,
      normalizedTestCases: normalizedJson,
      rawResponse: rawText,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to normalize test cases with Claude",
      error: error.message,
    };
  }
}