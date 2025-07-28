const pdfParse = require("pdf-parse");

exports.extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error("❌ PDF parsing error:", err.message);
    return "❌ Failed to extract text from PDF.";
  }
};
