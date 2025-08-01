const { google } = require("googleapis");
const path = require("path");
const { summarizeDocumentBuffer } = require("../utils/vertexGemini");
const { extractTextFromPDF } = require("../utils/pdfParser");

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "../dark-stratum-465506-u8-6a66584f85aa.json"),
    scopes: ["https://www.googleapis.com/auth/drive"],
});


exports.summarizeUpload = async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: "No file uploaded" });

        let content = "";

        if (file.mimetype === "application/pdf") {
            content = await extractTextFromPDF(file.buffer); // ✅ from pdf-parse
        } else {
            content = file.buffer.toString("utf8");
        }

        if (!content.trim()) {
            return res.status(400).json({ error: "Empty or unreadable file content" });
        }

        const summary = await summarizeDocumentBuffer(content, file.originalname); // ✅ now passes plain text
        res.json({ summary });

    } catch (err) {
        console.error("Summary error:", err.message);
        res.status(500).json({ error: "Failed to summarize file" });
    }
};

exports.getFilesByProject = async (req, res) => {
    const projectName = req.query.project;
    const parentId = "1C4linCEdD24PPVWPmtFhrRXC4C9GhuPR"; // SiteSort AI

    try {
        const authClient = await auth.getClient();
        const drive = google.drive({ version: "v3", auth: authClient });

        // 1. Find the project folder
        const folderRes = await drive.files.list({
            q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${projectName}' and trashed = false`,
            fields: "files(id, name)",
        });

        if (folderRes.data.files.length === 0) {
            return res.status(404).json({ error: "Project folder not found" });
        }

        const folderId = folderRes.data.files[0].id;

        // 2. Get all files inside the project folder
        const fileRes = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: "files(id, name, mimeType, modifiedTime, webViewLink)",
        });

        res.json(fileRes.data.files);
    } catch (err) {
        console.error("❌ Google Drive fetch error:", err.message);
        res.status(500).json({ error: "Failed to fetch project files" });
    }
};

// fileController.js
exports.getFilesInFolder = async (req, res) => {
    const folderId = req.query.folder;

    if (!folderId) return res.status(400).json({ error: "Missing folder ID" });

    try {
        const authClient = await auth.getClient();
        const drive = google.drive({ version: "v3", auth: authClient });

        const fileRes = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: "files(id, name, mimeType, modifiedTime, webViewLink)",
        });

        res.json(fileRes.data.files);
    } catch (err) {
        console.error("❌ Error fetching folder content:", err.message);
        res.status(500).json({ error: "Failed to fetch folder contents" });
    }
};
