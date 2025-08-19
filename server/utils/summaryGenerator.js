// Helper function to extract clean project name
function extractProjectName(text) {
  const projectPattern = /(?:project|development|community)\s+(?:name|title)?[:\s]+([^,\.\n]{2,50})/i;
  const match = text.match(projectPattern);
  return match ? match[1].trim() : null;
}

// Helper function to extract amount
function extractAmount(text) {
  const amountPattern = /(?:SGD|USD)?\s*[\$S]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:\s*(?:million|k|M|B))?)/;
  const match = text.match(amountPattern);
  return match ? match[1].trim() : null;
}

// Generate a concise, natural summary
async function generateSmartSummary(text, filename) {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract key information
  const keyInfo = {
    quarters: lines.find(l => /Q[1-4]\s*20\d{2}/i.test(l)),
    projectName: extractProjectName(text),
    amount: extractAmount(text),
    budgetType: lines.find(l => /(?:total|approved|revised)?\s*(?:project|budget|cost|expenditure)/i.test(l))
  };

  let summary = [];
  
  // Add quarter information
  if (keyInfo.quarters) {
    const quarter = keyInfo.quarters.match(/Q[1-4]\s*20\d{2}/i)[0];
    summary.push(`Budget Summary for ${quarter}`);
  }

  // Add project name
  if (keyInfo.projectName) {
    summary.push(`Project: ${keyInfo.projectName}`);
  }

  // Add ID if present in filename
  const idMatch = filename.match(/\d{4,}/);
  if (idMatch) {
    summary.push(`ID: ${idMatch[0]}`);
  }

  // Add budget type
  if (keyInfo.budgetType) {
    const type = keyInfo.budgetType.match(/(?:total|approved|revised)?\s*(?:project|budget|cost|expenditure)/i)[0];
    summary.push(`Type: ${type.charAt(0).toUpperCase() + type.slice(1)}`);
  }

  // Add amount
  if (keyInfo.amount) {
    summary.push(`Amount: ${keyInfo.amount}`);
  }

  return summary.join('. ');
}

module.exports = {
  generateSmartSummary
};
