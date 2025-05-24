import fetch from "node-fetch";
import fs from "fs";
import { parse } from "json2csv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIRECTORY = path.resolve(__dirname, "../data");
if (!fs.existsSync(DATA_DIRECTORY)) {
    fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
}

const CSV_FILE_PATH = path.join(DATA_DIRECTORY, "sportsbook_lines.csv");
const BOOKS_CSV_PATH = path.join(DATA_DIRECTORY, "sportsbooks.csv");

// Read sportsbooks from CSV
function readSportsbooks() {
    if (!fs.existsSync(BOOKS_CSV_PATH)) {
        console.error(`CSV file not found: ${BOOKS_CSV_PATH}`);
        process.exit(1);
    }
    const fileContent = fs.readFileSync(BOOKS_CSV_PATH, "utf8").trim();
    const lines = fileContent.split("\n");
    const header = lines[0].split(",");
    return lines.slice(1).map(line => {
        const [name, endpoint] = line.split(",");
        return { name: name.trim(), endpoint: endpoint.trim() };
    });
}

// Fetch lines for a single sportsbook
async function fetchLines(book) {
    try {
        const res = await fetch(book.endpoint, {
            headers: {
                "user-agent": "Mozilla/5.0",
                "accept": "text/html"
            },
        });
        const text = await res.text();

        // Save the HTML for inspection
        const htmlPath = path.join(DATA_DIRECTORY, `${book.name.replace(/\s+/g, "_").toLowerCase()}_response.html`);
        await fs.promises.writeFile(htmlPath, text);
        console.log(`Saved HTML response from ${book.name} to ${htmlPath}`);

        // Parse with cheerio
        const $ = cheerio.load(text);
        const lines = [];

        // Select all NBA game links
        $("a[href*='/basketball/nba/']").each((i, el) => {
            const teams = $(el).text().trim();

            // Find the nearest parent div that contains all three odds divs
            let oddsContainer = null;
            $(el).parents("div").each((_, parent) => {
                const $parent = $(parent);
                if (
                    $parent.find("div[aria-label^='Spread Betting']").length &&
                    $parent.find("div[aria-label^='Moneyline']").length &&
                    $parent.find("div[aria-label^='Total Points']").length
                ) {
                    oddsContainer = $parent;
                    return false; // break out of .each()
                }
            });

            if (!oddsContainer) {
                // Debug: print if odds container not found for this game
                console.warn(`No odds container found for: ${teams}`);
                return;
            }

            // Extract odds using aria-label selectors and get the numbers from the spans
            const spreadDiv = oddsContainer.find("div[aria-label^='Spread Betting']").first();
            const moneylineDiv = oddsContainer.find("div[aria-label^='Moneyline']").first();
            const totalDiv = oddsContainer.find("div[aria-label^='Total Points']").first();

            // Get the visible numbers from the spans
            const spread = spreadDiv.find("span").first().text() || "";
            const spreadOdds = spreadDiv.find("span").eq(1).text() || "";
            const moneyline = moneylineDiv.find("span").first().text() || "";
            const total = totalDiv.find("span").first().text() || "";
            const totalOdds = totalDiv.find("span").eq(1).text() || "";

            lines.push({
                Sportsbook: book.name,
                Teams: teams,
                Spread: spread,
                SpreadOdds: spreadOdds,
                Moneyline: moneyline,
                Total: total,
                TotalOdds: totalOdds,
            });
        });

        return lines;
    } catch (err) {
        console.error(`Error fetching lines for ${book.name}:`, err);
        return [];
    }
}

async function saveLinesToCSV(allLines) {
    if (!allLines || allLines.length === 0) {
        console.warn("No lines found.");
        return;
    }
    try {
        const csv = parse(allLines);
        await fs.promises.writeFile(CSV_FILE_PATH, csv);
        console.log(`Lines saved to: ${CSV_FILE_PATH}`);
    } catch (err) {
        console.error("Error writing CSV:", err);
    }
}

(async () => {
    const books = readSportsbooks();
    let allLines = [];
    for (const book of books) {
        const lines = await fetchLines(book);
        allLines = allLines.concat(lines);
    }
    await saveLinesToCSV(allLines);
})();