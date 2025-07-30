const { extractTextFromPDF } = require("../utils/pdfParser");
const { summarizeDocumentBuffer } = require("../utils/vertexGemini");
const { uploadFileWithOAuth } = require("../utils/driveOauthUploader"); // ✅ NEW

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

// 🧠 AI Analyzes the file
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

// 📤 Upload to user's personal Drive using OAuth
exports.confirmUpload = async (req, res) => {
    try {
        const file = req.file;
        const originalName = req.body.originalName;

        // ✅ Upload to the bound user's Drive
        const folderId = req.body.folderId;
        console.log("Upload DEBUG", {
            userId: req.user?.id,
            folderId: req.body.folderId,
            file: req.file?.originalname,
        });

        const uploadedFile = await uploadFileWithOAuth(req.user.id, file.buffer, originalName, folderId);

        res.json({ message: "Upload success", driveFile: uploadedFile });
    } catch (err) {
        console.error("Upload confirm error:", err.message || err);
        res.status(500).json({ error: "Drive upload failed" });
    }
};
