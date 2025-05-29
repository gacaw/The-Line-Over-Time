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

function msUntilNext5() {
    const now = new Date();
    const next = new Date(now);
    next.setSeconds(0, 0);
    next.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
    if (next <= now) next.setMinutes(next.getMinutes() + 5);
    return next - now;
}

function runAllScripts() {
    runScript("puppeteerMLB.js");
    runScript("puppeteerNBA.js");
    runScript("puppeteerNHL.js");
}

runAllScripts();

setTimeout(() => {
    runAllScripts();
    setInterval(runAllScripts, 5 * 60 * 1000);
}, msUntilNext5());