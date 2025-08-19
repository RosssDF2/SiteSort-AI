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
const { google } = require("googleapis");
const User = require("../models/User");

exports.analyzeFile = async (req, res) => {
  try {
    const file = req.file;
    const text = await extractTextFromPDF(file.buffer);
    const summary = await summarizeDocumentBuffer(text, file.originalname);

    const tags = extractTags(text);
    const aiSuggestedFolder = suggestFolderFromTags(tags);

    // --- Ensure suggestion is a real folder in user's Google Drive ---
    let suggestedFolder = "General";
    let availableFolders = [];
    try {
      // Get user from DB
      const user = await User.findById(req.user.id);
      if (user && user.googleAccessToken) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
          access_token: user.googleAccessToken,
          refresh_token: user.googleRefreshToken || undefined,
        });
        const drive = google.drive({ version: "v3", auth: oauth2Client });

        // Get root folder (SiteSort AI)
        const rootFolderRes = await drive.files.list({
          q: "mimeType='application/vnd.google-apps.folder' and name='SiteSort AI' and trashed=false",
          fields: "files(id, name)",
          spaces: "drive",
        });
        let parentId = rootFolderRes.data.files[0]?.id;
        if (parentId) {
          // List subfolders
          const subfolderRes = await drive.files.list({
            q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: "files(id, name)",
            spaces: "drive",
          });
          availableFolders = subfolderRes.data.files.map(f => f.name);
        }
      }
    } catch (folderErr) {
      console.error("[Analyze] Could not fetch user folders:", folderErr.message);
    }

    // Try to match AI suggestion to real folder (case-insensitive)
    if (availableFolders.length > 0) {
      const match = availableFolders.find(f => f.toLowerCase() === aiSuggestedFolder.toLowerCase());
      suggestedFolder = match || availableFolders[0];
    }

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
