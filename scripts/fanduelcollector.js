import { exec } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

function runScript(scriptName, cb) {
    const now = new Date().toLocaleString();
    console.log(`[${now}] Running ${scriptName}...`);
    exec(`node ${scriptName}`, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[${now}] Error running ${scriptName}:`, error);
        }
        if (stdout) console.log(`[${now}] ${scriptName} output:\n${stdout}`);
        if (stderr) console.error(`[${now}] ${scriptName} error:\n${stderr}`);
        if (cb) cb();
    });
}

function runPythonScript(scriptName, cb) {
    const now = new Date().toLocaleString();
    console.log(`[${now}] Running ${scriptName}...`);
    exec(`python "${scriptName}"`, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[${now}] Error running ${scriptName}:`, error);
        }
        if (stdout) console.log(`[${now}] ${scriptName} output:\n${stdout}`);
        if (stderr) console.error(`[${now}] ${scriptName} error:\n${stderr}`);
        if (cb) cb();
    });
}

function runScriptPromise(scriptName, isPython = false) {
    const now = new Date().toLocaleString();
    console.log(`[${now}] Running ${scriptName}...`);
    return new Promise((resolve) => {
        const cmd = isPython ? `python "${scriptName}"` : `node ${scriptName}`;
        exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[${now}] Error running ${scriptName}:`, error);
            }
            if (stdout) console.log(`[${now}] ${scriptName} output:\n${stdout}`);
            if (stderr) console.error(`[${now}] ${scriptName} error:\n${stderr}`);
            resolve();
        });
    });
}

function runAllScripts() {
    Promise.all([
        runScriptPromise("puppeteerMLB.js"),
        //runScriptPromise("puppeteerNBA.js"),
        //runScriptPromise("puppeteerNHL.js"),
    ]).then(() => {
        runScriptPromise("datasort.py", true).then(() => {
            runScriptPromise("cleargames.py", true).then(() => {
                runScriptPromise("csvtojson.cjs");
            });
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

runAllScripts();

setTimeout(() => {
    runAllScripts();
    setInterval(runAllScripts, 5 * 60 * 1000);
}, msUntilNext5());