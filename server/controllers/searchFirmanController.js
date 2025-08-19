// server/controllers/searchFirmanController.js
const { google } = require("googleapis");
const path = require("path");
const pdf = require("pdf-parse");
const { listAllFilesRecursive } = require("../utils/driveHelper");
const {
  summarizeDocumentBuffer,
  extractStructuredBudget,
} = require("../utils/vertexGemini");
const { extractRFIorRFQ } = require("../utils/vertexGemini");


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

function pickFilesByKeyword(files, keyword) {
  return files.filter(f => new RegExp(keyword, "i").test(f.name));
}

// --- tolerant PDF text extractor (handles "Command token too long") ---
async function safeExtractText(buffer) {
  // 1) Fast path: try normal parse
  try {
    const parsed = await pdf(buffer);
    if (parsed?.text?.trim()) return parsed.text;
  } catch (_) {
    // fall through to lenient mode
  }

  // 2) Lenient path: truncate absurdly long tokens per page
  const options = {
    max: 0, // all pages
    pagerender: async (pageData) => {
      const tc = await pageData.getTextContent();
      const parts = tc.items.map((it) => {
        const s = typeof it.str === "string" ? it.str : "";
        // cap each token to 128 chars to avoid crashing parser
        return s.length > 128 ? s.slice(0, 128) : s;
      });
      return parts.join(" ");
    },
  };

  const parsedLenient = await pdf(buffer, options);
  return parsedLenient?.text || "";
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
/**
 * GET /api/search-firman/summary?folderId=...
 */
exports.summary = async (req, res) => {
  try {
    const { folderId } = req.query;
    if (!folderId) return res.status(400).json({ error: "Missing folderId" });

    const authClient = await auth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    // 1) List everything in the project folder (recursive)
    const allFiles = await listAllFilesRecursive(folderId);
    const pdfFiles = (allFiles || []).filter(f => f.mimeType === "application/pdf");

    // Heuristics: pick by filename. (If you want strict subfolders, see note below.)
    const rfiFiles = pdfFiles.filter(f => /(^|[^a-z])RFI([^a-z]|$)/i.test(f.name));
    const rfqFiles = pdfFiles.filter(f => /(^|[^a-z])RFQ([^a-z]|$)/i.test(f.name));

    // Budget file (existing logic)
    const budgetFile = pickBestBudgetFile(pdfFiles);

    // --- compute a "latestModified" across budget + rfi + rfq for proper cache invalidation
    const allForCache = []
      .concat(budgetFile ? [budgetFile] : [])
      .concat(rfiFiles)
      .concat(rfqFiles);
    const latestModified = allForCache.length
      ? Math.max(
        ...allForCache
          .map(f => new Date(f.modifiedTime || 0).getTime())
          .filter(n => Number.isFinite(n))
      )
      : 0;

    // 2) Cache check
    const now = Date.now();
    const cached = cache.get(folderId);
    if (cached && cached.expiresAt > now && cached.modifiedTime === latestModified) {
      return res.json(cached.data);
    }

    // 3) Start building the response
    const documents = []; // you already use this shape
    const rfi = (documents || []).filter(d => (d.category || "").toUpperCase() === "RFI")
      .map(d => ({
        fileName: d.fileName,
        messages: Array.isArray(d.messages) ? d.messages : [],
      }));

    const rfq = (documents || []).filter(d => (d.category || "").toUpperCase() === "RFQ")
      .map(d => ({
        fileName: d.fileName,
        messages: Array.isArray(d.messages) ? d.messages : [],
      }));      // [{ fileName, messages }]

    // Helper: download -> Buffer
    async function downloadFileBuffer(fileId) {
      const fileRes = await withTimeout(
        drive.files.get({ fileId, alt: "media" }, { responseType: "stream" }),
        30000,
        "Drive download"
      );
      return await new Promise((resolve, reject) => {
        const chunks = [];
        fileRes.data
          .on("data", c => chunks.push(c))
          .on("end", () => resolve(Buffer.concat(chunks)))
          .on("error", reject);
      });
    }

    // 4) RFI extraction loop
    for (const f of rfiFiles) {
      try {
        const buffer = await downloadFileBuffer(f.id);
        const extractedText = (await withTimeout(safeExtractText(buffer), 25000, "PDF parse (safe)")).trim();
        const ai = await withTimeout(extractRFIorRFQ(extractedText, f.name), 20000, "RFI AI extract");
        rfi.push({ fileName: ai.fileName || f.name, messages: Array.isArray(ai.messages) ? ai.messages : [] });
        // also add to documents for your existing UI (optional)
        documents.push({ fileName: ai.fileName || f.name, category: "RFI", messages: ai.messages || [] });
      } catch (e) {
        rfi.push({ fileName: f.name, messages: ["❌ Failed to parse"] });
        documents.push({ fileName: f.name, category: "RFI", messages: ["❌ Failed to parse"] });
      }
    }

    // 5) RFQ extraction loop
    for (const f of rfqFiles) {
      try {
        const buffer = await downloadFileBuffer(f.id);
        const extractedText = (await withTimeout(safeExtractText(buffer), 25000, "PDF parse (safe)")).trim();
        const ai = await withTimeout(extractRFIorRFQ(extractedText, f.name), 20000, "RFQ AI extract");
        rfq.push({ fileName: ai.fileName || f.name, messages: Array.isArray(ai.messages) ? ai.messages : [] });
        documents.push({ fileName: ai.fileName || f.name, category: "RFQ", messages: ai.messages || [] });
      } catch (e) {
        rfq.push({ fileName: f.name, messages: ["❌ Failed to parse"] });
        documents.push({ fileName: f.name, category: "RFQ", messages: ["❌ Failed to parse"] });
      }
    }

    // 6) Budget (your existing logic)
    if (budgetFile) {
      try {
        const buffer = await downloadFileBuffer(budgetFile.id);
        const extractedText = (await withTimeout(safeExtractText(buffer), 25000, "PDF parse (safe)")).trim();

        let docObj = null;
        try {
          docObj = await withTimeout(
            extractStructuredBudget(extractedText, budgetFile.name),
            20000,
            "Structured budget extraction"
          );
        } catch (err) {
          // fall back to a short summary
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
        if (!docObj.metrics) docObj.metrics = { used: null, remaining: null };
        if (!Array.isArray(docObj.updates)) docObj.updates = [];
        if (!Array.isArray(docObj.risks)) docObj.risks = [];

        documents.push(docObj);
      } catch (e) {
        documents.push({
          fileName: budgetFile.name,
          category: "Budget",
          subcategory: null,
          metrics: { used: 0, remaining: 0 },
          table: null,
          updates: [],
          risks: ["Budget document could not be parsed (Low)"],
          insight: "Could not parse budget PDF in time. Try again or check the file.",
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

    // 7) Optionally add your demo mocks
    documents.push(...mockExtras());

    // 8) Totals + payload
    const payload = {
      documents,
      rfi,
      rfq,
      counts: {
        totalFiles: allFiles.length,
        rfiCount: rfi.length,
        rfqCount: rfq.length,
      },
    };

    // 9) Cache
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



