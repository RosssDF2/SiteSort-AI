const { extractTextFromPDF } = require("../utils/pdfParser");
const { uploadFileWithOAuth } = require("../utils/driveOauthUploader");
const UploadHistory = require("../models/UploadHistory");
const { detectDocumentType, generateSmartTags } = require('../utils/documentAnalyzer');
const { generateSmartSummary } = require('../utils/summaryGenerator');
const { google } = require("googleapis");
const User = require("../models/User");

const { handleGoogleAuthError } = require('../utils/handleGoogleAuth');

async function getSuggestedFolder(userId, tags, content) {
  const user = await User.findById(userId);
  if (!user?.googleAccessToken) {
    return { 
      path: "General",
      error: "Google account not connected",
      requiresAuth: true
    };
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/auth/google/callback"
    );
    
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken || undefined,
    });
    
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Use improved document type detection
    let documentTypes = [];
    let isFinancial = false;
    let isRFI = false;
    let isRFQ = false;

    try {
      if (!content) {
        throw new Error('No content provided for document type detection');
      }
      documentTypes = detectDocumentType(content);
      console.log("Detected document types:", documentTypes);
      
      isFinancial = documentTypes.includes('FINANCIAL');
      isRFI = documentTypes.includes('RFI');
      isRFQ = documentTypes.includes('RFQ');
    } catch (error) {
      console.error("Error detecting document type:", error);
      // Default to checking content directly as fallback
      const contentLower = content.toLowerCase();
      isFinancial = contentLower.includes('budget') || 
                    contentLower.includes('financial') ||
                    contentLower.includes('cost') ||
                    contentLower.includes('expenditure');
      
      isRFI = contentLower.includes('rfi') ||
              contentLower.includes('request for information') ||
              contentLower.includes('information request');
      
      isRFQ = contentLower.includes('rfq') ||
              contentLower.includes('request for quotation') ||
              contentLower.includes('quotation request');
    }

    console.log("Document classification:", { isFinancial, isRFI, isRFQ });

    // Try to find the appropriate folder first based on document type
    if (isFinancial || isRFI || isRFQ) {
      // Get the full folder structure
      const foldersRes = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: "files(id, name, parents)",
        spaces: "drive"
      });
      
      const allFoldersMap = foldersRes.data.files;

      // Find the project folder (e.g., Yewtee Community)
      const projectFolder = allFoldersMap.find(f => 
        tags.some(tag => f.name.toLowerCase().includes(tag.toLowerCase())) &&
        (f.name.toLowerCase().includes('community') || f.name.toLowerCase().includes('project'))
      );

      if (projectFolder) {
        // Look for appropriate folder within the project folder based on document type
        const targetFolder = allFoldersMap.find(f => 
          f.parents && f.parents[0] === projectFolder.id && 
          (
            (isFinancial && (
              f.name.toLowerCase() === 'financials' || 
              f.name.toLowerCase() === 'financial' ||
              f.name.toLowerCase().includes('budget')
            )) ||
            (isRFI && (
              f.name.toLowerCase() === 'rfi' ||
              f.name.toLowerCase().includes('information request') ||
              f.name.toLowerCase().includes('requests')
            )) ||
            (isRFQ && (
              f.name.toLowerCase() === 'rfq' ||
              f.name.toLowerCase().includes('quotation') ||
              f.name.toLowerCase().includes('requests')
            ))
          )
        );

        if (targetFolder) {
          // Get the full path to this folder
          const folderPath = [];
          let currentFolder = targetFolder;
          
          while (currentFolder) {
            folderPath.unshift(currentFolder.name);
            currentFolder = allFoldersMap.find(f => 
              currentFolder.parents && f.id === currentFolder.parents[0]
            );
          }

          return { 
            path: folderPath.join(' > '),
            folderId: targetFolder.id
          };
        }
      }
    }

    // If we haven't found a financials folder, proceed with normal folder search
    const foldersQuery = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name, parents)",
      spaces: "drive"
    });

    const allFolders = foldersQuery.data.files;
    if (!allFolders || allFolders.length === 0) {
      return { path: "General" };
    }

    // Score each folder based on content and tags
    let bestMatch = null;
    let bestScore = -1;

    for (const folder of allFolders) {
      let score = 0;
      const folderLower = folder.name.toLowerCase();
      const contentLower = content.toLowerCase();

      // Document type matching
      if ((contentLower.includes('budget') || contentLower.includes('financial')) && 
          folderLower.includes('budget')) score += 10;
      if (contentLower.includes('rfq') && folderLower.includes('rfq')) score += 10;
      if (contentLower.includes('invoice') && folderLower.includes('invoice')) score += 10;

      // Quarter matching (e.g., Q2 2025)
      const quarterMatch = content.match(/Q[1-4]\s*20\d{2}/);
      if (quarterMatch && folderLower.includes(quarterMatch[0].toLowerCase())) score += 15;

      // Project matching
      const projectMatch = content.match(/(?:project|phase|development)\s+[^\s,.]{2,30}/i);
      if (projectMatch && folderLower.includes(projectMatch[0].toLowerCase())) score += 15;

      // Tag matching
      for (const tag of tags) {
        if (folderLower.includes(tag.toLowerCase())) score += 5;
      }

      // Get subfolders for this folder
      const subFoldersRes = await drive.files.list({
        q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id, name)",
        spaces: "drive"
      });

      // Check subfolders for better matches
      for (const subFolder of subFoldersRes.data.files || []) {
        let subScore = score;
        const subFolderLower = subFolder.name.toLowerCase();

        // Same checks for subfolder
        if ((contentLower.includes('budget') || contentLower.includes('financial')) && 
            subFolderLower.includes('budget')) subScore += 10;
        if (contentLower.includes('rfq') && subFolderLower.includes('rfq')) subScore += 10;
        if (quarterMatch && subFolderLower.includes(quarterMatch[0].toLowerCase())) subScore += 15;
        
        for (const tag of tags) {
          if (subFolderLower.includes(tag.toLowerCase())) subScore += 5;
        }

        // Add bonus for being more specific
        subScore += 5;

        if (subScore > bestScore) {
          bestScore = subScore;
          bestMatch = {
            path: `${folder.name} > ${subFolder.name}`,
            folderId: subFolder.id
          };
        }
      }

      // Check if parent folder is better than subfolder
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          path: folder.name,
          folderId: folder.id
        };
      }
    }

    return bestMatch || { path: "General" };
  } catch (err) {
    console.error('Error getting folder suggestions:', err.message || err);
    const errorResult = await handleGoogleAuthError(err, user);
    return {
      path: "General",
      ...errorResult
    };
  }
}

exports.analyzeFile = async (req, res) => {
  try {
    const file = req.file;
    const text = await extractTextFromPDF(file.buffer);
    const summary = await generateSmartSummary(text, file.originalname);

    // Get parent folder ID from request and generate tags
    const parentFolderId = req.body.parentFolderId;
    let tags;
    
    try {
        tags = await generateSmartTags(text, req.user.id, parentFolderId);
    } catch (error) {
        console.error('Error generating tags:', error);
        tags = [];
    }
    
    // Get folder suggestion based on content and available folders
    const folderSuggestion = await getSuggestedFolder(req.user.id, tags, text);

    if (folderSuggestion.error) {
      res.status(401).json({
        error: folderSuggestion.error,
        message: folderSuggestion.message,
        requiresReauth: folderSuggestion.requiresReauth
      });
      return;
    }

    res.json({ 
      summary, 
      tags, 
      suggestedFolder: folderSuggestion.path,
      suggestedFolderId: folderSuggestion.folderId
    });
  } catch (err) {
    console.error("Analyze error:", err.message);
    res.status(500).json({ error: "AI analysis failed" });
  }
};

// ✅ Save to UploadHistory DB
async function logUploadHistory(userId, filename, tags) {
  await UploadHistory.create({ user: userId, filename, tags });
}

// 📤 Upload to Google Drive and log it
exports.confirmUpload = async (req, res) => {
  try {
    const file = req.file;
    const originalName = req.body.originalName;
    const folderId = req.body.folderId;
    const tags = req.body.tags?.split(",") || ["general"];

    console.log("Upload DEBUG", {
      userId: req.user?.id,
      folderId,
      file: originalName,
      tags,
    });

    const uploadedFile = await uploadFileWithOAuth(
      req.user.id,
      file.buffer,
      originalName,
      folderId
    );

    // Save upload log to DB
    await logUploadHistory(req.user.id, originalName, tags);

    res.json({ message: "Upload success", driveFile: uploadedFile });
  } catch (err) {
    console.error("Upload confirm error:", err.message || err);
    res.status(500).json({ error: "Drive upload failed" });
  }
};

// 📜 Fetch latest upload history
exports.getUploadHistory = async (req, res) => {
  try {
    const history = await UploadHistory.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(history);
  } catch (err) {
    console.error("Fetch history error:", err.message);
    res.status(500).json({ error: "Failed to fetch upload history" });
  }
};
