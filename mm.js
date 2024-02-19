const mammoth = require("mammoth");
const fetch = require("node-fetch");
const fs = require("fs");

// URL of the style map hosted on a CDN
const styleMapUrl = 'https://cdn.jsdelivr.net/npm/skeleton-mammoth/dist/skeleton-mammoth.min.css';

// Function to fetch style map
async function fetchStyleMap(url) {
    const response = await fetch(url);
    return response.text();
}

// Function to convert DOCX to HTML using the fetched style map
async function convertDocxToHTML(docxFilePath, outputHtmlFilePath) {
    const styleMap = await fetchStyleMap(styleMapUrl);

    mammoth.convertToHtml({ path: docxFilePath, styleMap: styleMap })
        .then(function (result) {
            const html = result.value; // The generated HTML
            fs.writeFile(outputHtmlFilePath, html, function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("The HTML file was saved!");
                }
            });
        })
        .catch(function (err) {
            console.error(err);
        });
}

// Example usage
const docxFilePath = "test.docx";
const outputHtmlFilePath = "output.html";
convertDocxToHTML(docxFilePath, outputHtmlFilePath);
