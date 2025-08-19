const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function to format date
function formatDateTime(date) {
    return new Date(date).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to clean and structure text for PDF
function cleanAndStructureText(text) {
    if (!text) return [];

    // Remove excessive newlines and whitespace
    const cleanedText = text.replace(/\n{3,}/g, '\n\n').trim();

    // Split into sections based on potential headers or bullet points
    const sections = cleanedText.split(/(?=\n[•#*-]|\n\d+\.|\n[A-Z][^a-z\n:]+:)/);

    return sections.map(section => section.trim()).filter(Boolean);
}

// Add a section with proper styling
function addSection(doc, text, { fontSize = 12, color = '#374151', marginBottom = 10, font = 'Helvetica' } = {}) {
    doc.font(font).fontSize(fontSize).fillColor(color);
    const words = text.split(' ');
    let line = '';
    let lineHeight = fontSize * 1.2;

    words.forEach(word => {
        const testLine = line + word + ' ';
        if (doc.widthOfString(testLine) > 500) {
            doc.text(line.trim(), { continued: false });
            doc.moveDown(0.5);
            line = word + ' ';
        } else {
            line = testLine;
        }
    });

    if (line.trim()) {
        doc.text(line.trim(), { continued: false });
    }

    doc.moveDown(marginBottom / lineHeight);
}

// Main function to generate PDF
async function generateAIReportPDF(reportData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                bufferPages: true
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            // Add logo and header
            const logoPath = path.join(__dirname, '../../client/public/sorta-bot.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 50, { width: 40 });
            }
            
            // Title section
            doc.font('Helvetica-Bold')
               .fontSize(24)
               .fillColor('#10B981')
               .text('SiteSort AI Report', 100, 50)
               .fontSize(14)
               .fillColor('#6B7280')
               .text(reportData.title || 'AI Analysis Report', 100);

            // Timestamp and metadata
            doc.moveDown()
               .fontSize(10)
               .fillColor('#6B7280')
               .text(`Generated on ${formatDateTime(new Date())}`)
               .moveDown(0.5);

            // Draw header separator
            doc.strokeColor('#E5E7EB')
               .lineWidth(1)
               .moveTo(50, 150)
               .lineTo(545, 150)
               .stroke();

            doc.moveDown(2);

            // User Query Section
            if (reportData.userQuery) {
                doc.font('Helvetica-Bold')
                   .fontSize(14)
                   .fillColor('#10B981')
                   .text('Your Question', { continued: false });

                doc.moveDown(0.5);
                addSection(doc, reportData.userQuery, { 
                    fontSize: 12,
                    color: '#374151',
                    marginBottom: 15 
                });
            }

            // Files Analyzed Section
            if (reportData.filesAnalyzed && reportData.filesAnalyzed.length > 0) {
                doc.font('Helvetica-Bold')
                   .fontSize(14)
                   .fillColor('#10B981')
                   .text('Files Analyzed', { continued: false });

                doc.moveDown(0.5);
                reportData.filesAnalyzed.forEach((file, index) => {
                    addSection(doc, `${index + 1}. ${file}`, {
                        fontSize: 11,
                        color: '#6B7280',
                        marginBottom: 5
                    });
                });
                doc.moveDown();
            }

            // AI Response Section
            doc.font('Helvetica-Bold')
               .fontSize(14)
               .fillColor('#10B981')
               .text('Analysis & Response', { continued: false });

            doc.moveDown();

            // Split and structure AI response
            const sections = cleanAndStructureText(reportData.aiResponse);
            sections.forEach(section => {
                // Check if section is a header
                if (section.match(/^[A-Z][^a-z\n:]+:/)) {
                    addSection(doc, section, {
                        fontSize: 13,
                        color: '#10B981',
                        font: 'Helvetica-Bold',
                        marginBottom: 5
                    });
                } else {
                    addSection(doc, section, {
                        fontSize: 11,
                        color: '#374151',
                        marginBottom: 10
                    });
                }
            });

            // Footer with page numbers
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                
                // Footer line
                doc.strokeColor('#E5E7EB')
                   .lineWidth(1)
                   .moveTo(50, 750)
                   .lineTo(545, 750)
                   .stroke();

                // Footer text
                doc.fontSize(8)
                   .fillColor('#9CA3AF')
                   .text(
                       'Generated by SiteSort AI',
                       50,
                       760,
                       { align: 'left' }
                   )
                   .text(
                       `Page ${i + 1} of ${pages.count}`,
                       50,
                       760,
                       { align: 'right' }
                   );
            }

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateAIReportPDF
};
