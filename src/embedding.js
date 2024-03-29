require('dotenv').config();
const OpenAI = require("openai");


const openai = new OpenAI({
    apiKey: "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"
});
async function getEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small", // Choose the model based on your needs
            input: text,
        });
        console.log(response.data[0].embedding.toString());
        return response.data[0].embedding;
    } catch (error) {
        console.error("Error fetching embedding:", error);
    }
}

// Example usage
// getEmbedding("The quick brown fox jumps over the lazy cat.");

module.exports = { getEmbedding }