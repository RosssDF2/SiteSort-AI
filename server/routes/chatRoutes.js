const express = require("express");
const dotenv = require("dotenv");
const auth = require("../middlewares/authMiddleware");
const axios = require("axios");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // or diskStorage if preferred
const { summarizeUpload } = require("../controllers/fileController");
const { askSiteSortAI, askSiteSortAIWithFiles } = require("../utils/vertexGemini");
const { generateAIReportPDF } = require('../utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

dotenv.config();
const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

router.post("/upload-summarize", upload.single("file"), (req, res, next) => {
  console.log("📥 File received:", req.file?.originalname);
  next();
}, summarizeUpload);

router.post("/chat", async (req, res) => {
  const { prompt, format } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  console.log("✅ Received prompt:", prompt);
  try {
    const { reply, blocked } = await askSiteSortAI(prompt);
    if (blocked) return res.status(429).json({ error: "Gemini daily limit reached" });

    console.log("✅ Gemini replied:", reply);

    // Always generate PDF
    const timestamp = new Date();
    const reportData = {
      title: 'AI Analysis Report',
      timestamp,
      userQuery: prompt,
      aiResponse: reply,
      metadata: {
        type: 'chat',
        userId: req.user?.id,
        username: req.user?.username || 'Guest'
      }
    };

    const pdfBuffer = await generateAIReportPDF(reportData);
    
    // Generate a clean filename
    const cleanTitle = prompt.slice(0, 30)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const dateStr = timestamp.toISOString().split('T')[0];
    
    // Send both PDF and text response
    res.json({
      text: reply,
      pdf: pdfBuffer.toString('base64'),
      timestamp: timestamp.toISOString(),
      filename: `SiteSort_AI_${cleanTitle}_${dateStr}.pdf`,
      metadata: {
        type: 'chat'
      }
    });
  } catch (err) {
    console.error("❌ Error calling Gemini:", err.message);
    res.status(500).json({ error: "Failed to get AI response from Gemini" });
  }
});

router.post("/chat-with-files", async (req, res) => {
  const { prompt, files, format } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });
  if (!files || !Array.isArray(files)) return res.status(400).json({ error: "Files array is required" });

  console.log("✅ Received prompt with files:", prompt);
  console.log("📁 Files count:", files.length);
  console.log("📄 File details:", files.map(f => ({ 
    fileName: f.fileName, 
    contentLength: f.content ? f.content.length : 0,
    hasContent: !!f.content 
  })));
  
  try {
    const { reply, blocked } = await askSiteSortAIWithFiles(prompt, files);
    if (blocked) return res.status(429).json({ error: "Gemini daily limit reached" });

    console.log("✅ Gemini replied with file context:", reply.substring(0, 200) + "...");

    // Always generate PDF and send both PDF and text
    const timestamp = new Date();
    const fileNames = files.map(f => f.fileName);
    
    const reportData = {
      title: 'Multi-File Analysis Report',
      timestamp,
      userQuery: prompt,
      aiResponse: reply,
      filesAnalyzed: fileNames,
      metadata: {
        type: 'file-analysis',
        userId: req.user?.id,
        username: req.user?.username || 'Guest',
        fileCount: files.length
      }
    };

    const pdfBuffer = await generateAIReportPDF(reportData);
    
    // Generate a clean filename base (will be used in Content-Disposition)
    const cleanTitle = prompt.slice(0, 30)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const dateStr = timestamp.toISOString().split('T')[0];
    const fileCountStr = files.length > 1 ? `_${files.length}files` : '';
    
    // Send both PDF and text response
    res.json({
      text: reply,
      pdf: pdfBuffer.toString('base64'),
      timestamp: timestamp.toISOString(),
      filename: `SiteSort_Analysis_${cleanTitle}${fileCountStr}_${dateStr}.pdf`,
      metadata: {
        fileCount: files.length,
        filesAnalyzed: fileNames
      }
    });
  } catch (err) {
    console.error("❌ Error calling Gemini with files:", err.message);
    res.status(500).json({ error: "Failed to get AI response from Gemini with files" });
  }
});

router.post('/ai-response', async (req, res) => {
    try {
        const { prompt, type } = req.body; // `type` can be 'summary' or 'report'

        // Call AI to get the response (mocked here for simplicity)
        const aiResponse = await getAIResponse(prompt);

        let pdfUrl = null;

        if (type === 'summary' || type === 'report') {
            // Generate PDF
            const reportData = {
                title: type === 'summary' ? 'AI Summary' : 'AI Report',
                userQuery: prompt,
                aiResponse,
                filesAnalyzed: [] // Add file details if needed
            };

            const pdfBuffer = await generateAIReportPDF(reportData);

            // Save PDF temporarily
            const pdfFilename = `AI_${type}_${Date.now()}.pdf`;
            const pdfPath = path.join(__dirname, '../public/pdfs', pdfFilename);
            fs.writeFileSync(pdfPath, pdfBuffer);

            // Generate URL for the PDF
            pdfUrl = `/pdfs/${pdfFilename}`;
        }

        res.json({
            success: true,
            response: aiResponse,
            pdfUrl
        });
    } catch (error) {
        console.error('Error generating AI response or PDF:', error);
        res.status(500).json({ success: false, error: 'Failed to process request' });
    }
});

console.log("📡 chatRoutes loaded");

module.exports = router;
