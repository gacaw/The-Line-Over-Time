import { exec } from "child_process";

import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

function runScript(scriptName) {
    const now = new Date().toLocaleString();
    console.log(`[${now}] Running ${scriptName}...`);
    exec(`node ${scriptName}`, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[${now}] Error running ${scriptName}:`, error);
        }
        if (stdout) console.log(`[${now}] ${scriptName} output:\n${stdout}`);
        if (stderr) console.error(`[${now}] ${scriptName} error:\n${stderr}`);
    });
}


function msUntilNext(minute) {
    const now = new Date();
    const next = new Date(now);
    next.setSeconds(0, 0);
    next.setMinutes(Math.ceil((now.getMinutes() - minute) / 15) * 15 + minute);
    if (next <= now) next.setMinutes(next.getMinutes() + 15);
    return next - now;
}

function scheduleScript(scriptName, minute) {
    const delay = msUntilNext(minute);
    setTimeout(() => {
        runScript(scriptName);
        setInterval(() => runScript(scriptName), 15 * 60 * 1000);
    }, delay);
}

scheduleScript("puppeteerMLB.js", 0);
scheduleScript("puppeteerNBA.js", 5);
scheduleScript("puppeteerNHL.js", 10);