import TestCase from "../../models/testCase.model.js";
import Page from "../../models/page.model.js";

function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

function getKeywordVariants() {
  return {
    login: ["login", "log in", "signin", "sign in", "auth", "authentication"],
    checkout: ["checkout", "payment", "billing"],
    cart: ["cart", "basket", "bag"],
    home: ["home", "homepage", "landing"],
    dashboard: ["dashboard", "overview", "panel"],
    contact: ["contact", "contact-us", "contact us", "support"],
    product: ["product", "pdp", "detail"],
  };
}

function detectIntentKeywords(testCase) {
  const textBlob = normalizeText(
    [
      testCase.title,
      testCase.pageScope,
      ...(testCase.steps || []),
      testCase.expectedResult,
    ].join(" "),
  );

  const variants = getKeywordVariants();
  const matches = [];

  for (const [intent, words] of Object.entries(variants)) {
    const found = words.some((word) => textBlob.includes(word));
    if (found) {
      matches.push(intent);
    }
  }

  return matches;
}

function scorePageAgainstTestCase(testCase, page) {
  let score = 0;
  let method = "keyword_match";

  const pageUrl = normalizeText(page.url);
  const pagePath = normalizeText(page.path || "");
  const pageTitle = normalizeText(page.title || "");
  const pageScope = normalizeText(testCase.pageScope || "");
  const title = normalizeText(testCase.title || "");

  if (pageScope) {
    if (pageUrl.includes(pageScope) || pagePath.includes(pageScope)) {
      score += 100;
      method = "page_scope_exact";
    }
  }

  const intentKeywords = detectIntentKeywords(testCase);

  for (const keyword of intentKeywords) {
    if (
      pageUrl.includes(keyword) ||
      pagePath.includes(keyword) ||
      pageTitle.includes(keyword)
    ) {
      score += 20;
    }
  }

  const titleWords = title.split(/\s+/).filter(Boolean);
  for (const word of titleWords) {
    if (word.length < 4) continue;

    if (
      pageUrl.includes(word) ||
      pagePath.includes(word) ||
      pageTitle.includes(word)
    ) {
      score += 5;
    }
  }

  return { score, method };
}

function getConfidence(score) {
  if (score >= 100) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export async function mapTestCasesToPages(projectId) {
  const testCases = await TestCase.find({ projectId });
  const pages = await Page.find({ projectId });

  if (!testCases.length) {
    return {
      success: true,
      mappedCount: 0,
      message: "No test cases found",
    };
  }

  if (!pages.length) {
    return {
      success: true,
      mappedCount: 0,
      message: "No pages found",
    };
  }

  let mappedCount = 0;
  const results = [];

  for (const testCase of testCases) {
    let bestMatch = null;
    let bestScore = 0;
    let bestMethod = "";

    for (const page of pages) {
      const { score, method } = scorePageAgainstTestCase(testCase, page);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = page;
        bestMethod = method;
      }
    }

    if (bestMatch && bestScore > 0) {
      const confidence = getConfidence(bestScore);

      await TestCase.findByIdAndUpdate(testCase._id, {
        matchedPageId: bestMatch._id,
        matchedPageUrl: bestMatch.url,
        mappingMethod: bestMethod,
        mappingConfidence: confidence,
      });

      mappedCount += 1;

      results.push({
        testCaseId: testCase._id,
        title: testCase.title,
        matchedPageUrl: bestMatch.url,
        mappingMethod: bestMethod,
        mappingConfidence: confidence,
        score: bestScore,
      });
    } else {
      await TestCase.findByIdAndUpdate(testCase._id, {
        matchedPageId: null,
        matchedPageUrl: "",
        mappingMethod: "unmatched",
        mappingConfidence: "low",
      });

      results.push({
        testCaseId: testCase._id,
        title: testCase.title,
        matchedPageUrl: "",
        mappingMethod: "unmatched",
        mappingConfidence: "low",
        score: 0,
      });
    }
  }

  return {
    success: true,
    mappedCount,
    totalTestCases: testCases.length,
    results,
  };
}
