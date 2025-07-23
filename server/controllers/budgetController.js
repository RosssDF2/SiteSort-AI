const { google } = require("googleapis");
const path = require("path");
const pdf = require("pdf-parse");
const { generateBudgetJSON } = require("../utils/vertexGemini"); // ✅ Vertex SDK

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../keys/firman.json"),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

exports.getBudgetSummary = async (req, res) => {
  const folderId = req.query.folderId;
  if (!folderId) return res.status(400).json({ error: "Missing folderId" });

  try {
    const authClient = await auth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    // 🧾 Step 1: Find first PDF
    const listRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
      fields: "files(id, name)",
      pageSize: 1,
    });

    const firstPdf = listRes.data.files[0];
    if (!firstPdf)
      return res.status(404).json({ error: "No PDFs found in folder" });

    console.log("📄 Found PDF:", firstPdf.name);

    // 📥 Step 2: Download PDF as stream
    const pdfStream = await drive.files.get(
      { fileId: firstPdf.id, alt: "media" },
      { responseType: "stream" }
    );

    const chunks = [];
    await new Promise((resolve, reject) => {
      pdfStream.data
        .on("data", (chunk) => chunks.push(chunk))
        .on("end", resolve)
        .on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    const parsed = await pdf(buffer);
    const extractedText = parsed.text;
    console.log("📝 Extracted PDF Text:\n", extractedText.slice(0, 300));

    // 🤖 Step 3: Vertex Gemini call (no axios)
    const geminiPrompt = `Please extract the following values from this construction budget text:\n\n${extractedText.slice(0, 2000)}\n\nRespond ONLY with valid JSON:\n{
  "total": number,
  "used": number,
  "remaining": number
}`;

    const responseText = await generateBudgetJSON(geminiPrompt);
    console.log("🧠 Gemini response:", responseText);

    if (!responseText) {
      return res.status(500).json({ error: "Gemini returned no content" });
    }

    let json;
    try {
      const match = responseText.match(/\{[\s\S]*?\}/);
      if (!match) throw new Error("No JSON object found in response");

      json = JSON.parse(match[0]);
    } catch (err) {
      console.error("❌ JSON parsing failed:", err.message);
      return res.status(500).json({ error: "Gemini did not return valid JSON" });
    }

    res.json(json);
  } catch (err) {
    console.error("❌ Budget summary error:", err.message);
    res.status(500).json({ error: "Failed to summarize budget" });
  }
};
