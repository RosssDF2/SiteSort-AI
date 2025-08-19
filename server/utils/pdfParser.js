const pdfParse = require("pdf-parse");

exports.extractTextFromPDF = async (buffer) => {
  try {
    // First attempt: Standard pdf-parse
    const data = await pdfParse(buffer);
    
    if (data.text && data.text.trim().length > 0) {
      console.log(`✅ PDF text extracted successfully: ${data.text.length} characters`);
      return data.text.trim();
    } else {
      console.warn("⚠️ PDF parsed but no text content found");
      return null;
    }
  } catch (err) {
    console.error("❌ PDF parsing error:", err.message);
    
    // Try to provide more specific error information
    if (err.message.includes('Invalid PDF')) {
      console.error("❌ PDF appears to be corrupted or invalid");
      return null;
    } else if (err.message.includes('password')) {
      console.error("❌ PDF is password protected");
      return null;
    } else {
      console.error("❌ Unknown PDF parsing error:", err.message);
      return null;
    }
  }
};

// Enhanced version with better error details
exports.extractTextFromPDFWithDetails = async (buffer, fileName) => {
  try {
    console.log(`🔍 Attempting to extract text from PDF: ${fileName}`);
    
    // Check if buffer is valid
    if (!buffer || buffer.length === 0) {
      return {
        success: false,
        error: "PDF file appears to be empty or corrupted",
        details: "Buffer is empty"
      };
    }

    // Check PDF header
    const pdfHeader = buffer.slice(0, 5).toString();
    if (!pdfHeader.startsWith('%PDF')) {
      return {
        success: false,
        error: "File does not appear to be a valid PDF",
        details: `File header: ${pdfHeader}`
      };
    }

    const data = await pdfParse(buffer);
    
    if (data.text && data.text.trim().length > 0) {
      console.log(`✅ PDF text extracted successfully: ${data.text.length} characters`);
      return {
        success: true,
        content: data.text.trim(),
        metadata: {
          pages: data.numpages,
          info: data.info
        }
      };
    } else {
      return {
        success: false,
        error: "PDF was parsed successfully but contains no extractable text",
        details: "This might be a scanned PDF or image-based PDF that requires OCR"
      };
    }
  } catch (err) {
    console.error("❌ PDF parsing error:", err.message);
    
    let errorDetails = {
      success: false,
      error: "Failed to extract text from PDF",
      details: err.message
    };

    if (err.message.includes('Invalid PDF')) {
      errorDetails.error = "PDF file is corrupted or invalid";
      errorDetails.suggestion = "Try re-uploading the file or check if it opens correctly in a PDF viewer";
    } else if (err.message.includes('password')) {
      errorDetails.error = "PDF is password protected";
      errorDetails.suggestion = "Remove password protection from the PDF before uploading";
    } else if (err.message.includes('stream')) {
      errorDetails.error = "PDF has unsupported encoding or compression";
      errorDetails.suggestion = "Try saving the PDF in a different format or using a different PDF creator";
    }

    return errorDetails;
  }
};
