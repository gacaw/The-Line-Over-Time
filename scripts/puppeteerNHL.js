import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIRECTORY = path.resolve(__dirname, "../data");

async function retry(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
        }
    }
}

async function scrapeAndSave() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--enable-unsafe-swiftshader"],
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.goto("https://sportsbook.fanduel.com/navigation/nhl", {
        waitUntil: "networkidle2",
        headers: {
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://sportsbook.fanduel.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
    });

    await retry(() => page.waitForSelector("a[href*='/ice-hockey/nhl/']", { timeout: 60000 }));

    const estTimestamp = getESTTimestamp();

    const lines = await page.$$eval("a[href*='/ice-hockey/nhl/']", (links, estTimestamp) => {
        const results = [];
        links.forEach(link => {
            const teams = link.textContent.trim();
            let oddsContainer = link.parentElement;
            while (oddsContainer && oddsContainer.querySelectorAll("div[aria-label^='Puck Line']").length === 0) {
                oddsContainer = oddsContainer.parentElement;
            }
            if (!oddsContainer) return;
            const timeElem = oddsContainer.querySelector("time[datetime]");
            const gameTime = timeElem ? timeElem.getAttribute("datetime") : "";

            const spreadDiv = oddsContainer.querySelector("div[aria-label^='Puck Line']");
            const moneylineDiv = oddsContainer.querySelector("div[aria-label^='Moneyline']");
            const totalDiv = oddsContainer.querySelector("div[aria-label^='Total Goals']");
            const spread = spreadDiv ? spreadDiv.querySelector("span")?.textContent.trim() : "";
            const spreadOdds = spreadDiv ? spreadDiv.querySelectorAll("span")[1]?.textContent.trim() : "";
            const moneyline = moneylineDiv ? moneylineDiv.querySelector("span")?.textContent.trim() : "";
            const total = totalDiv ? totalDiv.querySelector("span")?.textContent.trim() : "";
            const totalOdds = totalDiv ? totalDiv.querySelectorAll("span")[1]?.textContent.trim() : "";
            results.push({
                Timestamp: " Timestamp: " + (estTimestamp || "N/A"),
                Teams: " Teams: " + (teams || "N/A"),
                GameTime: " Gametime: " + (gameTime || "N/A"),
                Spread: " Spread: " + (spread || "N/A"),
                SpreadOdds: " SpreadOdds: " + (spreadOdds || "N/A"),
                Moneyline: " Moneyline: " + (moneyline || "N/A"),
                Total: " O/U: " + (total || "N/A"),
                TotalOdds: " O/U Odds: " + (totalOdds || "N/A"),
            });
        });
        return results;
    }, estTimestamp);

    let processedLines = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.Teams.includes("More wagers")) continue;
        if (
            i + 1 < lines.length &&
            lines[i + 1].Teams.includes("More wagers") &&
            lines[i + 1].GameTime.trim() !== "Gametime: N/A"
        ) {
            line.GameTime = lines[i + 1].GameTime;
        }
        processedLines.push(line);
    }

    if (processedLines.length) {
        const header = Object.keys(processedLines[0]).join(",") + "\n";
        const rows = processedLines.map(obj => Object.values(obj).join(",")).join("\n") + "\n";
        const fileExists = fs.existsSync(CSV_FILE_PATH);
        if (!fileExists) {
            fs.writeFileSync(CSV_FILE_PATH, header + rows);
        } else {
            fs.appendFileSync(CSV_FILE_PATH, "\n" + rows);
        }
        console.log(`Saved ${processedLines.length} lines to ${CSV_FILE_PATH}`);
    } else {
        console.log("No lines found.");
    }

    await browser.close();
};

if (!fs.existsSync(DATA_DIRECTORY)) {
    fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
}
const CSV_FILE_PATH = path.join(DATA_DIRECTORY, "linedata.csv");

function getESTTimestamp() {
    const now = new Date();
    return now.toLocaleString("en-US", { timeZone: "America/New_York" });
}

scrapeAndSave();