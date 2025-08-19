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
                margin: 72, // Increased margin
                size: 'A4',
                bufferPages: true
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            // Add logo and header
            const logoPath = path.join(__dirname, '../../client/public/logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 30, 50, { width: 40 }); // Moved logo 20 points to the left
            }
            
            // Title section
            doc.font('Helvetica-Bold')
               .fontSize(24)
               .fillColor('#10B981')
               .text('SiteSort AI Report', 72, 50);
            
            doc.fontSize(14)
               .fillColor('#6B7280')
               .text(reportData.title || 'AI Analysis Report', {
                   width: 450, // Constrain width
                   align: 'left'
               });

            // Timestamp
            doc.fontSize(10)
               .fillColor('#6B7280')
               .text(`Generated on ${formatDateTime(new Date())}`, {
                   width: 450,
                   align: 'left'
               });

            // Simple header separator
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
                   .text('Your Question');

                doc.moveDown(0.5);
                
                doc.font('Helvetica')
                   .fontSize(12)
                   .fillColor('#374151')
                   .text(reportData.userQuery, {
                       width: 450, // Reduced width
                       align: 'left',
                       lineGap: 2
                   });

                doc.moveDown(1);
            }

            // Files Analyzed Section
            if (reportData.filesAnalyzed && reportData.filesAnalyzed.length > 0) {
                doc.font('Helvetica-Bold')
                   .fontSize(14)
                   .fillColor('#10B981')
                   .text('Files Analyzed');

                doc.moveDown(0.5);
                
                reportData.filesAnalyzed.forEach((file, index) => {
                    doc.font('Helvetica')
                       .fontSize(11)
                       .fillColor('#6B7280')
                       .text(`${index + 1}. ${file}`);
                    
                    doc.moveDown(0.3);
                });
                doc.moveDown(1);
            }

            // AI Response Section
            doc.font('Helvetica-Bold')
               .fontSize(14)
               .fillColor('#10B981')
               .text('Analysis & Response');

            doc.moveDown(0.5);

            // Split and structure AI response
            const sections = cleanAndStructureText(reportData.aiResponse);
            sections.forEach(section => {
                // Check if section is a header
                if (section.match(/^[A-Z][^a-z\n:]+:/)) {
                    doc.font('Helvetica-Bold')
                       .fontSize(13)
                       .fillColor('#10B981')
                       .text(section);
                    doc.moveDown(0.5);
                } else {
                    doc.font('Helvetica')
                       .fontSize(11)
                       .fillColor('#374151')
                       .text(section, {
                           width: 450, // Reduced width for better readability
                           align: 'left',
                           lineGap: 2,
                           columns: 1
                       });
                    doc.moveDown(0.5);
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
