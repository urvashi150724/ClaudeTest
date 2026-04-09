import anthropic from "../../config/anthropic.js";

function extractTextFromClaudeResponse(response) {
  if (!response?.content || !Array.isArray(response.content)) {
    return "";
  }

  return response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

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

function buildExecutionPlanningPrompt(testCase, pages) {
  return `
You are an AI test execution planner.

Your responsibilities:
1. Select the best matching page from the available pages for this test case.
2. Convert the test case into executable browser steps.
3. Return only valid JSON.
4. Do not wrap the response in markdown or code fences.

Return JSON in this exact format:
{
  "matchedPage": {
    "url": "string",
    "title": "string"
  },
  "steps": [
    { "action": "goto", "value": "string" },
    { "action": "fill", "selector": "string", "value": "string" },
    { "action": "click", "selector": "string" },
    { "action": "assert_url_contains", "value": "string" },
    { "action": "assert_text_contains", "value": "string" }
  ]
}

Allowed actions:
- goto
- fill
- click
- assert_url_contains
- assert_text_contains

Rules:
- First step should usually be "goto"
- Use the matched page url in goto
- Prefer common stable selectors such as:
  - input[name="email"]
  - input[name="username"]
  - input[name="password"]
  - button[type="submit"]
  - button:has-text("Login")
- If exact selector is unknown, make the best practical guess
- Keep steps minimal and executable
- Do not add explanations

Test case:
${JSON.stringify(testCase, null, 2)}

Available pages:
${JSON.stringify(pages, null, 2)}
`;
}

export async function planExecutionWithClaude({ testCase, pages }) {
  try {
    const prompt = buildExecutionPlanningPrompt(testCase, pages);

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
      max_tokens: 2000,
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

    let executionPlan;
    try {
      executionPlan = JSON.parse(cleanedText);
    } catch (parseError) {
      return {
        success: false,
        message: "Claude returned invalid execution plan JSON",
        rawResponse: rawText,
        cleanedResponse: cleanedText,
        error: parseError.message,
      };
    }

    if (!executionPlan?.matchedPage?.url || !Array.isArray(executionPlan?.steps)) {
      return {
        success: false,
        message: "Claude execution plan is missing required fields",
        rawResponse: rawText,
        cleanedResponse: cleanedText,
      };
    }

    return {
      success: true,
      executionPlan,
      rawResponse: rawText,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to generate execution plan with Claude",
      error: error.message,
    };
  }
}