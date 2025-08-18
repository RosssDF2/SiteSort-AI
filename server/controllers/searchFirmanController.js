// server/controllers/searchFirmanController.js
const { google } = require("googleapis");
const path = require("path");
const pdf = require("pdf-parse");
const { listAllFilesRecursive } = require("../utils/driveHelper");
const {
  summarizeDocumentBuffer,
  extractStructuredBudget,
} = require("../utils/vertexGemini");

// In-memory cache
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map(); // key: folderId -> { expiresAt, modifiedTime, data }

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../keys/firman.json"),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

// Timeout helper
function withTimeout(promise, ms, label = "operation") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// Pick latest budget/financial PDF by modifiedTime
function pickBestBudgetFile(files) {
  const budgetFiles = files.filter((f) =>
    /budget|financial/i.test(f.name)
  );
  if (budgetFiles.length === 0) return null;

  budgetFiles.sort(
    (a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime)
  );
  return budgetFiles[0]; // newest first
}

// Mock extras for demo
function mockExtras() {
  return [
    {
      fileName: "Resources_Usage.pdf",
      category: "Resources",
      subcategory: null,
      metrics: { used: null, remaining: null },
      table: [
        ["Resource", "Planned", "Used"],
        ["Cement", "1000", "750"],
        ["Steel", "800", "500"],
        ["Bricks", "5000", "4200"],
      ],
      updates: ["Resource utilization is on track"],
      risks: ["Cement stockouts possible (Medium Risk)"],
      insight: "AI suggests monitoring supplier delays.",
    },
    {
      fileName: "SiteReport_July.pdf",
      category: "Site Report",
      subcategory: null,
      metrics: { used: null, remaining: null },
      table: [
        ["Date", "Progress %"],
        ["2025-07-01", "30"],
        ["2025-07-15", "45"],
        ["2025-07-31", "60"],
      ],
      updates: ["Progress improved steadily through July."],
      risks: ["Heavy rain may delay August schedule (Low Risk)"],
      insight: "AI notes alignment with planned timeline.",
    },
    {
      fileName: "Safety_Audit.pdf",
      category: "Safety",
      subcategory: null,
      metrics: { used: null, remaining: null },
      table: null,
      updates: ["Safety drills conducted twice this month."],
      risks: ["Incomplete PPE compliance (High Risk)"],
      insight: "AI recommends reinforcing PPE training.",
    },
  ];
}

/**
 * GET /api/search-firman/summary?folderId=...
 */
exports.summary = async (req, res) => {
  try {
    const { folderId } = req.query;
    if (!folderId) return res.status(400).json({ error: "Missing folderId" });

    const authClient = await auth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    // 1) List all files
    const allFiles = await listAllFilesRecursive(folderId);
    console.log("📂 All files found:", allFiles.map((f) => f.name));

    const pdfFiles = (allFiles || []).filter(
      (f) => f.mimeType === "application/pdf"
    );
    const budgetFile = pickBestBudgetFile(pdfFiles);
    const latestModified = budgetFile
      ? new Date(budgetFile.modifiedTime).getTime()
      : 0;


    // 2) Cache check
    const now = Date.now();
    const cached = cache.get(folderId);
    if (
      cached &&
      cached.expiresAt > now &&
      cached.modifiedTime === latestModified
    ) {
      console.log("⚡ Serving from cache (no new budget file detected)");
      return res.json(cached.data);
    }

    console.log("📂 PDF files found (with modifiedTime):", pdfFiles.map(f => ({
      name: f.name,
      modified: f.modifiedTime
    })));

    const documents = [];

    if (budgetFile) {
      try {
        // Download + parse PDF
        const fileRes = await withTimeout(
          drive.files.get(
            { fileId: budgetFile.id, alt: "media" },
            { responseType: "stream" }
          ),
          30000,
          "Drive download"
        );

        const buffer = await new Promise((resolve, reject) => {
          const chunks = [];
          fileRes.data
            .on("data", (c) => chunks.push(c))
            .on("end", () => resolve(Buffer.concat(chunks)))
            .on("error", reject);
        });

        const parsed = await withTimeout(pdf(buffer), 20000, "PDF parse");
        const extractedText = (parsed.text || "").trim();

        // Try structured extraction
        let docObj = null;
        try {
          docObj = await withTimeout(
            extractStructuredBudget(extractedText, budgetFile.name),
            20000,
            "Structured budget extraction"
          );
        } catch (err) {
          console.error("❌ Structured extraction failed:", err.message);
        }

        if (!docObj) {
          const short = extractedText
            ? await withTimeout(
              summarizeDocumentBuffer(extractedText, budgetFile.name),
              8000,
              "LLM summary"
            )
            : null;
          docObj = {
            fileName: budgetFile.name,
            category: "Budget",
            subcategory: null,
            metrics: { used: null, remaining: null },
            table: null,
            updates: [],
            risks: [],
            insight: short,
          };
        }

        // Normalize
        docObj.fileName = docObj.fileName || budgetFile.name;
        if (!docObj.metrics)
          docObj.metrics = { used: null, remaining: null };
        if (!Array.isArray(docObj.updates)) docObj.updates = [];
        if (!Array.isArray(docObj.risks)) docObj.risks = [];

        documents.push(docObj);
      } catch (e) {
        console.error("❌ Budget parsing failed:", e.message);
        documents.push({
          fileName: budgetFile.name,
          category: "Budget",
          subcategory: null,
          metrics: { used: 0, remaining: 0 },
          table: null,
          updates: [],
          risks: ["Budget document could not be parsed (Low)"],
          insight:
            "Could not parse budget PDF in time. Try again or check the file.",
        });
      }
    } else {
      documents.push({
        fileName: "Budget_Not_Found.pdf",
        category: "Budget",
        subcategory: null,
        metrics: { used: 0, remaining: 0 },
        table: null,
        updates: ["No budget PDF found in this project."],
        risks: [],
        insight: null,
      });
    }

    // Add mocks
    documents.push(...mockExtras());

    const payload = { documents };
    cache.set(folderId, {
      expiresAt: now + CACHE_TTL_MS,
      modifiedTime: latestModified,
      data: payload,
    });

    return res.json(payload);
  } catch (err) {
    console.error("❌ summary error:", err);
    return res.status(500).json({ error: "AI analysis failed" });
  }
};
