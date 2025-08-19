const pdfParse = require("pdf-parse");

// Add PDF parsing options
const PDF_OPTIONS = {
  // Don't crash on corrupted PDF files
  throwOnErrors: false,
  // Max pages to parse (prevent hanging on huge files)
  max: 100,
  // Include useful metadata
  includeXrefs: true,
  // Try to recover broken cross-references
  repairXrefDamage: true,
  // Additional robustness options
  skipXrefValidation: true,
  pagerender: function(pageData) {
    // Custom rendering to handle more PDF formats
    let render_options = {
      normalizeWhitespace: true,
      disableCombineTextItems: false
    };
    return pageData.getTextContent(render_options)
      .then(function(textContent) {
        let text = "";
        let lastY = null;
        let lastX = null;

        // Process each text item
        for (const item of textContent.items) {
          if (lastY !== item.transform[5] || (lastX !== null && (item.transform[4] - lastX) > 100)) {
            text += "\n";
          } else if (text.length > 0 && !text.endsWith(" ")) {
            text += " ";
          }
          text += item.str;
          lastY = item.transform[5];
          lastX = item.transform[4];
        }
        return text;
      });
  }
};

async function tryParseWithOptions(buffer, options) {
  try {
    const data = await pdfParse(buffer, options);
    if (data.text && data.text.trim().length > 0) {
      console.log(`✅ PDF text extracted successfully: ${data.text.length} characters`);
      return data.text.trim();
    }
    return null;
  } catch (err) {
    console.warn(`⚠️ PDF parse attempt failed: ${err.message}`);
    return null;
  }
}

exports.extractTextFromPDF = async (buffer) => {
  try {
    // First attempt: Standard parsing
    let text = await tryParseWithOptions(buffer, PDF_OPTIONS);
    if (text) return text;

    // Second attempt: More aggressive options
    const fallbackOptions = {
      ...PDF_OPTIONS,
      throwOnErrors: false,
      skipXrefValidation: true,
      ignoreXrefs: true,
      verbosity: -1
    };
    text = await tryParseWithOptions(buffer, fallbackOptions);
    if (text) return text;

    // Third attempt: Raw text extraction
    const lastResortOptions = {
      ...fallbackOptions,
      useRawTextExtraction: true,
      maxReadSizeBytes: buffer.length,
      ignoreEncryption: true
    };
    text = await tryParseWithOptions(buffer, lastResortOptions);
    if (text) return text;
    
  } catch (err) {
    console.error("❌ PDF parsing error:", err.message);
    
    // Try to provide more specific error information
    if (err.message.includes('Invalid PDF')) {
      console.error("❌ PDF appears to be corrupted or invalid");
    } else if (err.message.includes('password')) {
      console.error("❌ PDF is password protected");
    } else if (err.message.includes('XRef')) {
      console.error("❌ PDF has damaged cross-reference table");
      // Try one last time with completely ignored XRefs
      try {
        console.log("🔄 Attempting final parse with ignored XRefs...");
        const lastAttemptOptions = {
          ...PDF_OPTIONS,
          ignoreXrefs: true,
          skipXrefValidation: true,
          throwOnErrors: false,
          // Additional recovery options
          disableCombinedImage: true,    // Skip image processing
          disableRenderText: false,      // Force text rendering
          verbosity: 1                   // Increase logging
        };
        const lastAttemptData = await pdfParse(buffer, lastAttemptOptions);
        if (lastAttemptData.text && lastAttemptData.text.trim().length > 0) {
          console.log("✅ Successfully recovered text from damaged PDF");
          return lastAttemptData.text.trim();
        }
      } catch (finalErr) {
        console.error("❌ Final recovery attempt failed:", finalErr.message);
        // Check for common problems
        if (finalErr.message.includes('stream')) {
          console.error("❌ PDF may be using unsupported compression or encoding");
        } else if (finalErr.message.includes('font')) {
          console.error("❌ PDF contains custom or embedded fonts that can't be processed");
        }
      }
    } else if (err.message.includes('stream')) {
      console.error("❌ PDF has unsupported compression or encoding");
    } else if (err.message.includes('font')) {
      console.error("❌ PDF contains problematic fonts");
    }
    
    console.error("❌ All PDF parsing attempts failed");
    return null;
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
        details: `File header: ${pdfHeader}`,
        suggestion: "Please check if the file is a valid PDF document"
      };
    }
    
    // Check for potential scanned document
    const firstKB = buffer.slice(0, 1024).toString('hex');
    const imageSignatures = [
      'ffd8ff', // JPEG
      '89504e47', // PNG
      '47494638' // GIF
    ];
    
    const mightBeScanned = imageSignatures.some(sig => firstKB.includes(sig));
    if (mightBeScanned) {
      console.warn("⚠️ PDF appears to contain scanned images - text extraction may fail");
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
      details: err.message,
      fileName: fileName // Include filename in error for better debugging
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
