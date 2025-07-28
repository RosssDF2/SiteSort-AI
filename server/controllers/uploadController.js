const fs = require("fs");
const path = require("path");
const { askGemini } = require("../utils/vertexGemini");
const uploadToDrive = require("../utils/driveUpload"); // you said you already created this
const { Readable } = require("stream");
const pdfParse = require("pdf-parse");
// 📥 Analyze file with Gemini

exports.analyzeFile = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const pdfData = await pdfParse(req.file.buffer);
        const plainText = pdfData.text;

        if (!plainText || plainText.length < 10) {
            return res.status(400).json({ error: "Unable to extract readable content from file." });
        }

        const prompt = `
You are an AI file analyst working for a construction document management platform.

Analyze the text below and:
1. Summarize the document in 2–3 professional sentences.
2. Suggest 3–6 relevant tags — such as document type, project name, month, department, purpose — using hashtags (e.g., #Invoice, #ProjectX, #April2025, #TenderDocs).

Text:
${plainText}
        `.trim();

        const { reply } = await askGemini(prompt);

        // Extract hashtags as tags
        const tags = reply.match(/#[\w\-]+/g)?.map(t => t.replace("#", "")) || ["Document"];

        // Basic folder suggestion from tags
        let suggestedFolder = "General Docs";
        if (tags.some(t => /finance|invoice|report/i.test(t))) suggestedFolder = "Financial Reports";
        else if (tags.some(t => /tender/i.test(t))) suggestedFolder = "Tender Docs";
        else if (tags.some(t => /response|clarification/i.test(t))) suggestedFolder = "RI Responses";

        res.json({
            summary: reply,
            tags,
            suggestedFolder
        });

    } catch (err) {
        console.error("❌ AI analysis error:", err.message);
        res.status(500).json({ error: "Failed to analyze file" });
    }
};

// ✅ Confirm and Upload
exports.confirmUpload = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        if (!req.user.isGoogleLinked) {
            return res.status(403).json({ error: "Google not linked to this account" });
        }

        const { folderId, originalName } = req.body;
        if (!folderId || !originalName) {
            return res.status(400).json({ error: "Missing folder or filename" });
        }

        const fileBuffer = req.file.buffer;
        const fileStream = Readable.from(fileBuffer);

        const uploaded = await uploadToDrive(fileStream, originalName, folderId);

        res.json({
            message: "Uploaded to Google Drive",
            driveLink: uploaded.webViewLink,
            fileId: uploaded.id
        });
    } catch (err) {
        console.error("Drive Upload Error:", err.message);
        res.status(500).json({ error: "Drive upload failed" });
    }
};
