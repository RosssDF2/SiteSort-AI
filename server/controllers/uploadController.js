const { extractTextFromPDF } = require("../utils/pdfParser");
const { summarizeDocumentBuffer } = require("../utils/vertexGemini");
const { uploadFileWithOAuth } = require("../utils/driveOauthUploader");
const UploadHistory = require("../models/UploadHistory");

// 🔍 Basic tag extraction
function extractTags(text) {
  const tags = [];
  const keywords = {
    finance: ["budget", "cost", "fund", "expense", "financial", "SGD", "USD"],
    company: ["Pte Ltd", "Ltd", "LLC", "Inc", "Company", "Corporation"],
    construction: ["architect", "M&E", "structural", "contractor", "project"],
    urgent: ["immediate", "ASAP", "urgent", "critical"],
  };

  for (const [label, words] of Object.entries(keywords)) {
    if (words.some((word) => text.toLowerCase().includes(word.toLowerCase()))) {
      tags.push(label);
    }
  }

  return tags.length ? tags : ["general"];
}

// 📁 Suggest folder based on tags
function suggestFolderFromTags(tags) {
  if (tags.includes("finance")) return "Finance";
  if (tags.includes("construction")) return "Construction";
  if (tags.includes("company")) return "Companies";
  if (tags.includes("urgent")) return "Urgent Matters";
  return "General";
}

// 🧠 Analyze the uploaded file
exports.analyzeFile = async (req, res) => {
  try {
    const file = req.file;
    const text = await extractTextFromPDF(file.buffer);
    const summary = await summarizeDocumentBuffer(text, file.originalname);

    const tags = extractTags(text);
    const suggestedFolder = suggestFolderFromTags(tags);

    res.json({ summary, tags, suggestedFolder });
  } catch (err) {
    console.error("Analyze error:", err.message);
    res.status(500).json({ error: "AI analysis failed" });
  }
};

// ✅ Save to UploadHistory DB
async function logUploadHistory(userId, filename, tags) {
  await UploadHistory.create({ user: userId, filename, tags });
}

// 📤 Upload to Google Drive and log it
exports.confirmUpload = async (req, res) => {
  try {
    const file = req.file;
    const originalName = req.body.originalName;
    const folderId = req.body.folderId;
    const tags = req.body.tags?.split(",") || ["general"];

    console.log("Upload DEBUG", {
      userId: req.user?.id,
      folderId,
      file: originalName,
      tags,
    });

    const uploadedFile = await uploadFileWithOAuth(
      req.user.id,
      file.buffer,
      originalName,
      folderId
    );

    // Save upload log to DB
    await logUploadHistory(req.user.id, originalName, tags);

    res.json({ message: "Upload success", driveFile: uploadedFile });
  } catch (err) {
    console.error("Upload confirm error:", err.message || err);
    res.status(500).json({ error: "Drive upload failed" });
  }
};

// 📜 Fetch latest upload history
exports.getUploadHistory = async (req, res) => {
  try {
    const history = await UploadHistory.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(history);
  } catch (err) {
    console.error("Fetch history error:", err.message);
    res.status(500).json({ error: "Failed to fetch upload history" });
  }
};
