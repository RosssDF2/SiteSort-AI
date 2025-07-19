require("dotenv").config();
const path = require("path");
const { VertexAI } = require("@google-cloud/vertexai");

(async () => {
  try {
    const keyPath = path.resolve(__dirname, process.env.GCP_KEY_PATH);
    console.log("🔑 Loading key from:", keyPath);

    const vertexAI = new VertexAI({
      project: process.env.GCP_PROJECT_ID,
      location: "asia-southeast1", // ✅ Singapore region
      keyFile: keyPath,
    });

    const model = vertexAI.preview.getGenerativeModel({
      model: "gemini-2.5-flash", // ✅ This model is available in SG
      publisher: "google",
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Hello, Sorta" }] }],
    });

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("✅ Gemini says:", text);
  } catch (err) {
    console.error("❌ Auth failed:", err.message || err);
  }
})();
