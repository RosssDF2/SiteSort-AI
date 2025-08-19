const { google } = require("googleapis");
const path = require("path");
const { summarizeDocumentBuffer } = require("../utils/vertexGemini");
const { extractTextFromPDF, extractTextFromPDFWithDetails } = require("../utils/pdfParser");
const PDFDocument = require('pdfkit');

// Cache for file content
const fileContentCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "../dark-stratum-465506-u8-6a66584f85aa.json"),
    scopes: ["https://www.googleapis.com/auth/drive"],
});


// Helper function to generate PDF from summary/report
const generatePDF = (title, content, fileName) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4'
            });

            // Collect the PDF chunks
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            // Add title
            doc.fontSize(24)
               .font('Helvetica-Bold')
               .text(title, { align: 'center' });

            // Add date
            doc.moveDown()
               .fontSize(12)
               .font('Helvetica')
               .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });

            // Add horizontal line
            doc.moveDown()
               .moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke();

            // Add content with proper formatting
            doc.moveDown()
               .fontSize(12)
               .font('Helvetica')
               .text(content, {
                   align: 'justify',
                   lineGap: 5
               });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

exports.summarizeUpload = async (req, res) => {
    try {
        const file = req.file;
        const format = req.query.format || 'json'; // Allow specifying output format
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

        if (format === 'pdf') {
            const title = `Summary of ${file.originalname}`;
            const pdfBuffer = await generatePDF(title, summary, file.originalname);
            
            // Send PDF file for download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="summary-${file.originalname}.pdf"`);
            return res.send(pdfBuffer);
        }

        // Default JSON response
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

// Get file content for AI chat context with caching and improved error handling
exports.getFileContent = async (req, res) => {
    const { fileId } = req.params;

    if (!fileId) return res.status(400).json({ error: "Missing file ID" });

    try {
        // Check cache first
        const cachedContent = fileContentCache.get(fileId);
        if (cachedContent && (Date.now() - cachedContent.timestamp < CACHE_DURATION)) {
            console.log(`Returning cached content for file ${fileId}`);
            return res.json(cachedContent.data);
        }

        const authClient = await auth.getClient();
        const drive = google.drive({ version: "v3", auth: authClient });

        // Get file metadata first
        const fileMetadata = await drive.files.get({
            fileId: fileId,
            fields: "id, name, mimeType, size"
        });

        const file = fileMetadata.data;

        // Check if it's a folder - folders can't have content extracted
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            return res.status(400).json({ 
                error: `"${file.name}" is a folder, not a file. Only documents and files can be analyzed.` 
            });
        }

        let content = "";

        // Handle different file types
        if (file.mimeType === "application/pdf") {
            // For PDFs, get the file as buffer and extract text
            const fileResponse = await drive.files.get({
                fileId: fileId,
                alt: 'media'
            }, { responseType: 'stream' });

            const chunks = [];
            for await (const chunk of fileResponse.data) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            
            // Use enhanced PDF extraction with detailed error reporting
            const extractionResult = await extractTextFromPDFWithDetails(buffer, file.name);
            
            if (extractionResult.success) {
                content = extractionResult.content;
            } else {
                return res.status(400).json({ 
                    error: `Unable to extract text from "${file.name}". ${extractionResult.error}`,
                    details: extractionResult.details,
                    suggestion: extractionResult.suggestion || "Please try a different file or contact support if this continues to happen"
                });
            }
        } else if (file.mimeType.includes('text') || 
                   file.mimeType === 'application/vnd.google-apps.document') {
            
            if (file.mimeType === 'application/vnd.google-apps.document') {
                // Google Docs - export as plain text
                const fileResponse = await drive.files.export({
                    fileId: fileId,
                    mimeType: 'text/plain'
                });
                content = fileResponse.data;
            } else {
                // Plain text files
                const fileResponse = await drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                });
                content = fileResponse.data;
            }
        } else {
            return res.status(400).json({ 
                error: "Unsupported file type for content extraction. Supported: PDF, Text, Google Docs" 
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ 
                error: `"${file.name}" appears to be empty or contains no readable text`,
                details: `File type: ${file.mimeType}`,
                suggestion: file.mimeType === "application/pdf" 
                    ? "This might be a scanned PDF or image-based PDF. Try using OCR software to convert it to searchable text first."
                    : "Check if the file contains any text content and is not corrupted"
            });
        }

        const responseData = {
            fileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
            content: content.substring(0, 50000), // Increased limit to 50,000 characters for analysis
            summary: content.length > 50000 ? "Content truncated to 50,000 characters for analysis." : null
        };

        // Cache the response for 5 minutes
        fileContentCache.set(fileId, {
            data: responseData,
            timestamp: Date.now()
        });

        // Clean up old cache entries
        const now = Date.now();
        for (const [key, value] of fileContentCache.entries()) {
            if (now - value.timestamp > CACHE_DURATION) {
                fileContentCache.delete(key);
            }
        }

        res.json(responseData);

    } catch (err) {
        console.error("❌ Error fetching file content:", err.message);
        res.status(500).json({ error: "Failed to fetch file content" });
    }
};
