import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIRECTORY = path.resolve(__dirname, "../data");
if (!fs.existsSync(DATA_DIRECTORY)) {
    fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
}
const CSV_FILE_PATH = path.join(DATA_DIRECTORY, "linedata.csv");

(async () => {
    const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    const page = await browser.newPage();

    // Set viewport and user-agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Log browser console messages
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Go to the FanDuel NBA page
    await page.goto("https://sportsbook.fanduel.com/navigation/nba", { waitUntil: "networkidle2" });

    // Take a screenshot for debugging
    await page.screenshot({ path: "fanduel_debug.png", fullPage: true });

    // Wait for at least one NBA game link to appear (longer timeout)
    await page.waitForSelector("a[href*='/basketball/nba/']", { timeout: 60000 });

    // Extract data
    const lines = await page.$$eval("a[href*='/basketball/nba/']", (links) => {
        const results = [];
        links.forEach(link => {
            const teams = link.textContent.trim();

            // Find the odds container (walk up the DOM)
            let oddsContainer = link.parentElement;
            while (oddsContainer && oddsContainer.querySelectorAll("div[aria-label^='Spread Betting']").length === 0) {
                oddsContainer = oddsContainer.parentElement;
            }
            if (!oddsContainer) return;

            const spreadDiv = oddsContainer.querySelector("div[aria-label^='Spread Betting']");
            const moneylineDiv = oddsContainer.querySelector("div[aria-label^='Moneyline']");
            const totalDiv = oddsContainer.querySelector("div[aria-label^='Total Points']");

            const spread = spreadDiv ? spreadDiv.querySelector("span")?.textContent.trim() : "";
            const spreadOdds = spreadDiv ? spreadDiv.querySelectorAll("span")[1]?.textContent.trim() : "";
            const moneyline = moneylineDiv ? moneylineDiv.querySelector("span")?.textContent.trim() : "";
            const total = totalDiv ? totalDiv.querySelector("span")?.textContent.trim() : "";
            const totalOdds = totalDiv ? totalDiv.querySelectorAll("span")[1]?.textContent.trim() : "";

            console.log(`Teams: ${teams}, Spread: ${spread}, Spread Odds: ${spreadOdds}, Moneyline: ${moneyline}, Total: ${total}, Total Odds: ${totalOdds}`);

            results.push({
                Teams: teams,
                Spread: spread,
                SpreadOdds: spreadOdds,
                Moneyline: moneyline,
                Total: total,
                TotalOdds: totalOdds,
            });
        });
        return results;
    });

    // Save to CSV
    if (lines.length) {
        const header = Object.keys(lines[0]).join(",") + "\n";
        const rows = lines.map(obj => Object.values(obj).join(",")).join("\n");
        fs.writeFileSync(CSV_FILE_PATH, header + rows);
        console.log(`Saved ${lines.length} lines to ${CSV_FILE_PATH}`);
    } else {
        console.log("No lines found.");
    }

    await browser.close();
})();