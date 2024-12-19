const axios = require('axios');
const cheerio = require('cheerio');

async function extractTextFromWebsite(url) {
    try {
        // Fetch the HTML content of the website
        const { data: html } = await axios.get(url);

        // Load the HTML into cheerio for parsing
        const $ = cheerio.load(html);
        // console.log("html", html);
        console.log("cheerio---------", $('title').text());
        // Extract the text from specific elements
        // Example: extract text from all <p> tags
        const extractedText = $('p')
            .map((_, el) => $(el).text())
            .get()
            .join('\n');

        console.log("Extracted Text:", extractedText);
        return [extractedText,  $('title').text()];
    } catch (error) {
        console.error("Error fetching or parsing the website:", error);
    }
}

// Example usage
// const websiteURL = 'https://example.com'; // Replace with your target URL
// extractTextFromWebsite(websiteURL);

module.exports = extractTextFromWebsite;
