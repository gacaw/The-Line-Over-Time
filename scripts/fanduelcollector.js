import { exec } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

function runScript(scriptName, command = "node") {
    const now = new Date().toLocaleString();
    console.log(`[${now}] Running ${scriptName}...`);
    return new Promise((resolve, reject) => {
        exec(`${command} ${scriptName}`, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[${now}] Error running ${scriptName}:`, error);
                reject(error);
            }
            if (stdout) console.log(`[${now}] ${scriptName} output:\n${stdout}`);
            if (stderr) console.error(`[${now}] ${scriptName} error:\n${stderr}`);
            resolve();
        });
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

async function runAllScripts() {
    try {
        await runScript("puppeteerMLB.js");
        await runScript("puppeteerNBA.js");
        await runScript("puppeteerNHL.js");
        //await runScript("datasort.py", "python");
        //await runScript("csvtojson.cjs", "node");  need to fix this file
    } catch (err) {
        console.error("Error in script chain:", err);
    }
}

runAllScripts();

setTimeout(() => {
    runAllScripts();
    setInterval(runAllScripts, 5 * 60 * 1000);
}, msUntilNext5());