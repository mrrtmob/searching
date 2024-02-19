const mammoth = require('mammoth');
const OpenAI = require("openai");


const openai = new OpenAI({
    apiKey: "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"
});

// Function to extract text using Mammoth and summarize it
async function summarizeDOCX(filePath) {
    try {
        // Extract text from DOCX file using Mammoth
        const { value: text } = await mammoth.extractRawText({ path: filePath });
        // Send the text to OpenAI for summarization
        const response = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a highly skilled AI trained in language comprehension and summarization. I would like you to read the following text and summarize it into a concise abstract paragraph. Aim to retain the most important points, providing a coherent and readable summary that could help a person understand the main points of the discussion without needing to read the entire text. Please avoid unnecessary details or tangential points. Please summary it in Khmer language." },
                { role: 'user', content: text }

            ],
            temperature: 0,
            model: "gpt-4-0125-preview",
        });
        console.log(response.choices[0].message.content);
    } catch (error) {
        console.error("Error summarizing DOCX with Mammoth:", error);
    }
}

// Replace 'path/to/your/document.docx' with the actual DOCX file path
summarizeDOCX('Content_Template_Post_Digital_Services_ EMS.docx');
