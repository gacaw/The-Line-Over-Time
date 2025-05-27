import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { timeStamp } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIRECTORY = path.resolve(__dirname, "../data");
if (!fs.existsSync(DATA_DIRECTORY)) {
    fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
}
const CSV_FILE_PATH = path.join(DATA_DIRECTORY, "linedataNBA.csv");

function getESTTimestamp() {
    const now = new Date();
    return now.toLocaleString("en-US", { timeZone: "America/New_York" });
}

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.goto("https://sportsbook.fanduel.com/navigation/nba", { waitUntil: "networkidle2" });

    await page.screenshot({ path: "fanduel_debug.png", fullPage: true });

    await page.waitForSelector("a[href*='/basketball/nba/']", { timeout: 60000 });

    const estTimestamp = getESTTimestamp();

    const lines = await page.$$eval("a[href*='/basketball/nba/']", (links, estTimestamp) => {
        const results = [];
        links.forEach(link => {
            const teams = link.textContent.trim();

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

            // print data for debugging
            // console.log(`Teams: ${teams}, Spread: ${spread}, Spread Odds: ${spreadOdds}, Moneyline: ${moneyline}, Total: ${total}, Total Odds: ${totalOdds}`);

            results.push({
                Timestamp: estTimestamp,
                Teams: teams,
                Spread: spread,
                SpreadOdds: spreadOdds,
                Moneyline: moneyline,
                Total: total,
                TotalOdds: totalOdds,
            });
        });
        return results;
    }, estTimestamp );

    if (lines.length) {
        const header = Object.keys(lines[0]).join(",") + "\n";
        const rows = lines.map(obj => Object.values(obj).join(",")).join("\n") + "\n";

        const fileExists = fs.existsSync(CSV_FILE_PATH);
        
        if (!fileExists) {
                fs.writeFileSync(CSV_FILE_PATH, header + rows);
        } else {
            fs.appendFileSync(CSV_FILE_PATH, "\n" + rows);
        }
        console.log(`Saved ${lines.length} lines to ${CSV_FILE_PATH}`);
    } else {
        console.log("No lines found.");
    }

    await browser.close();
})();