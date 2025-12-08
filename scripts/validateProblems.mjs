import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

function parseArgs(argv = process.argv.slice(2)) {
    const out = { delay: undefined, base: undefined, dry: false, report: false, reportPath: undefined };
    argv.forEach((a) => {
        if (a.startsWith('--delay=')) out.delay = parseInt(a.split('=')[1], 10);
        else if (a.startsWith('--base=')) out.base = a.split('=')[1];
        else if (a === '--dry') out.dry = true;
        else if (a === '--report') out.report = true;
        else if (a.startsWith('--reportPath=')) out.reportPath = a.split('=')[1];
    });
    return out;
}

function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

/**
 * Validate problems by calling GET <BASE>/app/question/{id} sequentially.
 * Returns an object { kept, removed, backupPath }
 */
export async function validateProblems({
    baseUrl,
    delayMs = 700,
    dryRun = false,
    problemsFile,
    writeReport = false,
    reportPath,
} = {}) {
    const BASE_URL = baseUrl || process.env.BASE_URL || 'https://dbapi.ptit.edu.vn/api';
    const DELAY_MS = delayMs;
    const DRY_RUN = !!dryRun;
    const WRITE_REPORT = !!writeReport;

    const problemsPath = problemsFile || path.resolve(process.cwd(), 'src', 'data', 'problems.json');

    if (!fs.existsSync(problemsPath)) {
        throw new Error(`Cannot find problems file at ${problemsPath}`);
    }

    const raw = fs.readFileSync(problemsPath, 'utf8');
    let problems;
    try {
        problems = JSON.parse(raw);
        if (!Array.isArray(problems)) throw new Error('Expected an array');
    } catch (err) {
        throw new Error(`Failed to parse problems.json: ${err.message}`);
    }

    const backupPath = problemsPath + `.bak.${Date.now()}.json`;
    fs.copyFileSync(problemsPath, backupPath);

    const kept = [];
    const removed = [];
    const changes = [];

    for (let i = 0; i < problems.length; i++) {
        const p = problems[i];
        const id = p && p.id;
        const idx = i + 1;
        if (!id) {
            removed.push({ index: i, reason: 'missing id' });
            continue;
        }

        const url = `${BASE_URL.replace(/\/$/, '')}/app/question/${id}`;
        try {
            const resp = await axios.get(url, { timeout: 20000 });
            if (resp.status >= 200 && resp.status < 300 && resp.data) {
                // fields to sync from response if present
                const respData = resp.data || {};
                const fieldCandidates = [
                    'type',
                    'level',
                    'point',
                    'questionCode',
                    'title',
                    'content',
                    'prefixCode',
                    'enable',
                    'questionDetails',
                ];

                const itemChanges = {};
                fieldCandidates.forEach((f) => {
                    const val = respData[f] ?? respData[f.charAt(0).toUpperCase() + f.slice(1)];
                    if (val !== undefined && JSON.stringify(p[f]) !== JSON.stringify(val)) {
                        itemChanges[f] = { before: p[f], after: val };
                        p[f] = val;
                    }
                });

                // fallback: some responses use different keys for type
                const typeFromResp = respData.type || respData.questionType || respData.typeName;
                if (typeFromResp !== undefined && JSON.stringify(p.type) !== JSON.stringify(typeFromResp)) {
                    itemChanges.type = { before: p.type, after: typeFromResp };
                    p.type = typeFromResp;
                }

                if (Object.keys(itemChanges).length > 0) {
                    changes.push({ id, index: i, changes: itemChanges });
                }

                kept.push(p);
            } else {
                removed.push({ index: i, id, status: resp.status });
            }
        } catch (err) {
            const msg = err.response ? `HTTP ${err.response.status}` : err.message;
            removed.push({ index: i, id, error: msg });
        }

        await sleep(DELAY_MS);
    }

    if (!DRY_RUN) {
        fs.writeFileSync(problemsPath, JSON.stringify(kept, null, 2), 'utf8');
    }

    const report = { keptCount: kept.length, removedCount: removed.length, backupPath, removed, changes };
    if (WRITE_REPORT) {
        const rp = reportPath || path.resolve(process.cwd(), 'scripts', 'validate-report.json');
        fs.writeFileSync(rp, JSON.stringify(report, null, 2), 'utf8');
    }

    return { kept, removed, backupPath, changes };
}

// CLI shim: run when executed directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
    (async () => {
        try {
            const args = parseArgs();
            console.log(
                `Using base URL: ${args.base || process.env.BASE_URL || 'https://dbapi.ptit.edu.vn/api'}  delay: ${
                    args.delay || process.env.DELAY_MS || 700
                }ms  dry-run: ${!!args.dry}  report: ${!!args.report}`,
            );

            const res = await validateProblems({
                baseUrl: args.base,
                delayMs: args.delay || 700,
                dryRun: args.dry,
                writeReport: args.report,
                reportPath: args.reportPath,
            });

            console.log(
                'Done. Kept:',
                res.kept.length,
                'Removed:',
                res.removed.length,
                'Changes:',
                (res.changes || []).length,
            );
            console.log('Backup:', res.backupPath);
            if (args.report) {
                console.log(
                    'Report written to',
                    args.reportPath || path.resolve(process.cwd(), 'scripts', 'validate-report.json'),
                );
            }
            if (args.dry) console.log('Dry-run enabled — original file preserved.');
        } catch (e) {
            console.error('Error:', e.message || e);
            process.exit(1);
        }
    })();
}
