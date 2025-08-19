const express = require("express");
const router = express.Router();
const { generateAIReportPDF } = require("../utils/pdfGenerator");

// POST endpoint to generate PDF report from AI response
router.post("/generate-report-pdf", async (req, res) => {
    try {
        const { title, userQuery, aiResponse, filesAnalyzed } = req.body;

        if (!aiResponse) {
            return res.status(400).json({ error: "AI response is required to generate PDF" });
        }

        // Prepare report data
        const reportData = {
            title: title || "SiteSort AI Analysis Report",
            userQuery: userQuery || "",
            aiResponse: aiResponse,
            filesAnalyzed: filesAnalyzed || []
        };

        console.log("📄 Generating PDF report:", {
            title: reportData.title,
            queryLength: reportData.userQuery.length,
            responseLength: reportData.aiResponse.length,
            filesCount: reportData.filesAnalyzed.length
        });

        // Generate PDF
        const pdfBuffer = await generateAIReportPDF(reportData);

        // Set response headers for PDF download
        const filename = `SiteSort_AI_Report_${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF buffer
        res.send(pdfBuffer);

        console.log("✅ PDF report generated successfully:", filename);

    } catch (error) {
        console.error("❌ Error generating PDF report:", error);
        res.status(500).json({ 
            error: "Failed to generate PDF report", 
            details: error.message 
        });
    }
});

module.exports = router;
