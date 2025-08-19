const { google } = require('googleapis');
const User = require('../models/User');
const { generateSmartSummary } = require('./summaryGenerator');

/**
 * Document type detection patterns and utilities
 */
const DOC_PATTERNS = {
  RFI: {
    keywords: ['rfi', 'request for information', 'information request'],
    patterns: [
      /RFI[:\s-]*(?:no\.?|number)?[\s-]*([A-Z0-9-]+)/i,
      /Request\s+for\s+Information/i,
      /Information\s+Request/i
    ]
  },
  RFQ: {
    keywords: ['rfq', 'request for quotation', 'quotation request'],
    patterns: [
      /RFQ[:\s-]*(?:no\.?|number)?[\s-]*([A-Z0-9-]+)/i,
      /Request\s+for\s+Quotation/i,
      /Quotation\s+Request/i
    ]
  },
  FINANCIAL: {
    keywords: ['budget', 'financial', 'cost', 'expenditure'],
    patterns: [
      /Q[1-4]\s*20\d{2}/i,
      /(?:budget|financial|cost)\s+(?:report|summary|analysis)/i,
      /(?:project|phase)\s+budget/i
    ]
  }
};

// Helper function to detect document type
function detectDocumentType(text) {
  if (!text || typeof text !== 'string') {
    console.error('Invalid text input:', text);
    return [];
  }
  
  const contentLower = text.toLowerCase();
  const types = [];
  
  for (const [type, patterns] of Object.entries(DOC_PATTERNS)) {
    // Check keywords
    if (patterns.keywords.some(keyword => contentLower.includes(keyword))) {
      types.push(type);
      continue;
    }
    
    // Check regex patterns
    if (patterns.patterns.some(pattern => pattern.test(text))) {
      types.push(type);
    }
  }
  
  return types;
}

// Generate smart tags for document content
async function generateSmartTags(text, userId, folderId) {
  if (!text || typeof text !== 'string') {
    console.error('Invalid text input for tag generation:', text);
    return [];
  }

  const tags = new Set();
  const documentTypes = detectDocumentType(text);

  // Add document type as tags
  documentTypes.forEach(type => tags.add(type));

  // Extract additional context-based tags
  const patterns = {
    projectCode: /(?:project|code)[\s:]+([A-Z0-9-]{3,10})/i,
    date: /(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
    department: /(?:department|division|dept|div)[\s:]+([^\n,.]{2,30})/i,
  };

  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      tags.add(match[1].trim());
    }
  });

  return Array.from(tags);
}

const DocumentAnalyzer = {
  detectDocumentType,
  generateSmartTags,
  patterns: {
    RFI: {
      keywords: ['rfi', 'request for information', 'information request'],
      patterns: [
        /RFI[:\s-]*(?:no\.?|number)?[\s-]*([A-Z0-9-]+)/i,
        /Request\s+for\s+Information/i,
        /Information\s+Request/i
      ]
    },
    RFQ: {
      keywords: ['rfq', 'request for quotation', 'quotation request'],
      patterns: [
        /RFQ[:\s-]*(?:no\.?|number)?[\s-]*([A-Z0-9-]+)/i,
        /Request\s+for\s+Quotation/i,
        /Quotation\s+Request/i
      ]
    },
    FINANCIAL: {
      keywords: ['budget', 'financial', 'cost', 'expenditure'],
      patterns: [
        /Q[1-4]\s*20\d{2}/i,
        /(?:budget|financial|cost)\s+(?:report|summary|analysis)/i,
        /(?:project|phase)\s+budget/i
      ]
    }
  },

  // Detect document type from text content
  detectDocumentType(text) {
    const contentLower = text.toLowerCase();
    const types = [];
    
    for (const [type, config] of Object.entries(this.patterns)) {
      // Check keywords
      if (config.keywords.some(keyword => contentLower.includes(keyword))) {
        types.push(type);
        continue;
      }
      
      // Check regex patterns
      if (config.patterns.some(pattern => pattern.test(text))) {
        types.push(type);
      }
    }
    
    return types;
  }
};

// Export the document analyzer
module.exports = DocumentAnalyzer;

// Get Drive folder structure for a path
// Helper function to get folder tree structure
async function getFolderTree(drive, parentId = null) {
  try {
    const query = parentId 
      ? `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      : `mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const res = await drive.files.list({
      q: query,
      fields: "files(id, name, parents, createdTime)",
      orderBy: "createdTime desc",
      spaces: "drive"
    });

    const folders = res.data.files;
    const tree = [];

    for (const folder of folders) {
      const subfolders = await getFolderTree(drive, folder.id);
      tree.push({
        id: folder.id,
        name: folder.name,
        subfolders
      });
    }

    return tree;
  } catch (err) {
    console.error('Error getting folder tree:', err);
    return [];
  }
}

async function getFolderStructure(userId, folderId) {
  try {
    if (!folderId) return ['General'];

    const user = await User.findById(userId);
    if (!user?.googleAccessToken) return ['General'];

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken || undefined,
    });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Get complete folder tree
    const folderTree = await getFolderTree(drive);
    
    // Function to find path to folder with project name matching
    async function findPath(drive, targetId) {
      try {
        const file = await drive.files.get({
          fileId: targetId,
          fields: "name, parents"
        });
        
        if (!file.data.parents) return ['General'];
        
        const parentId = file.data.parents[0];
        const parent = await drive.files.get({
          fileId: parentId,
          fields: "name, parents"
        });
        
        return [parent.data.name, file.data.name];
      } catch (err) {
        console.error('Error finding folder path:', err);
        return ['General'];
      }
    }

    // Get direct path to the target folder
    const path = await findPath(drive, folderId);
    if (path) return path;

    return ['General'];
  } catch (err) {
    console.error('Error getting folder structure:', err);
    return ['General'];
  }
}

// Generate smart tags based on folder structure and content
async function generateSmartTags(text, userId, folderId) {
  const tags = new Set();
  
  // Get folder path tags
  const folderPath = await getFolderStructure(userId, folderId);
  if (folderPath) {
    folderPath.forEach(folder => tags.add(folder));
  }

  // Extract quarters and years
  const quarterMatches = text.match(/Q[1-4]\s*20\d{2}/g);
  if (quarterMatches) {
    quarterMatches.forEach(q => tags.add(q.replace(/\s+/, '')));
  }

  // Extract project names and community names
  const projectMatches = text.match(/(?:project|phase|development|community)\s+(?:name|title)?[:\s]+([^,\.\n]{2,50})/gi);
  if (projectMatches) {
    projectMatches.forEach(p => {
      const cleanedName = p.replace(/(?:project|phase|development|community)\s+(?:name|title)?[:\s]+/i, '').trim();
      if (cleanedName) tags.add(cleanedName);
    });
  }

  // Content-based tags with improved categorization
  const contentTags = {
    'Budget': ['budget', 'forecast', 'allocation', 'spending', 'expenditure'],
    'Financial Report': ['summary', 'report', 'statement', 'analysis', 'review'],
    'CAPEX': ['capex', 'capital expenditure', 'asset', 'equipment', 'infrastructure'],
    'OPEX': ['opex', 'operational', 'operating expense', 'maintenance'],
    'Quarter': ['Q1', 'Q2', 'Q3', 'Q4', 'quarter', 'quarterly'],
    'Projects': ['project', 'development', 'construction', 'implementation'],
    'Currency': ['SGD', 'USD', 'dollar', '$', 'S$']
  };

  // Check each category and its keywords
  for (const [category, keywords] of Object.entries(contentTags)) {
    if (keywords.some(word => text.toLowerCase().includes(word.toLowerCase()))) {
      tags.add(category);
    }
  }

  // Add year tag if found
  const yearMatch = text.match(/20\d{2}/);
  if (yearMatch) {
    tags.add(yearMatch[0]);
  }

  // Extract department or division names if present
  const deptMatch = text.match(/(?:department|division|dept|div)[\s:]+([^\n,.]{2,30})/i);
  if (deptMatch) {
    tags.add(deptMatch[1].trim());
  }

  return Array.from(tags);
}

module.exports = {
  ...DocumentAnalyzer,
  generateSmartTags
};

module.exports = {
  generateSmartTags,
  getFolderStructure
};
