// server/services/openaiService.js
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

exports.generateAIInsight = async (files) => {
    const text = files.map(f => `${f.originalName} - ${f.extractedText || ""}`).join("\n\n");
    if (!text || text.length < 50) return "Not enough data for insight.";

    const prompt = `Analyze these documents and summarize recent project activity in a friendly tone:\n\n${text}`;
    const res = await openai.createChatCompletion({
        model: "gpt-4o",
        messages: [
            { role: "system", content: "You are a helpful assistant for construction project summaries." },
            { role: "user", content: prompt },
        ],
        temperature: 0.5,
    });

    return res.data.choices[0].message.content.trim();
};
