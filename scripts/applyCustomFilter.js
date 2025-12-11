import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv = process.argv.slice(2)) {
    return {
        dry: argv.includes('--dry') || argv.includes('-d'),
        indexFile: (argv.find((a) => a.startsWith('--index=')) || '').split('=')[1],
        problemsFile: (argv.find((a) => a.startsWith('--problems=')) || '').split('=')[1],
    };
}

function normalizeCodeVariants(code) {
    if (!code) return [];
    const c = String(code).trim();
    const up = c.toUpperCase();
    const noDash = up.replace(/-/g, '');
    const variants = new Set([up, noDash]);

    // If code like SQL94 -> produce SQL094
    const m = up.match(/^SQL(\d{2})$/i);
    if (m) {
        variants.add(`SQL0${m[1]}`);
    }

    // If code like SQL94-... just add numeric padding if needed
    const m2 = up.match(/^SQL-?(\d{2,})$/i);
    if (m2) {
        const num = m2[1];
        if (num.length === 2) variants.add(`SQL0${num}`);
        variants.add(`SQL-${num}`);
        variants.add(`SQL${num}`);
    }

    return Array.from(variants);
}

function parseIndexMd(mdRaw) {
    const lines = mdRaw.split('\n');
    const rows = [];

    // Find start of table (line with '|') after header
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        // Skip markdown table header separator lines like '---|---|---'
        if (/^\|?\s*-{3,}\s*\|/.test(trimmed) || /^-+\|-+\|-+/.test(trimmed)) continue;
        if (trimmed.includes('|')) {
            // Split into 3 columns maximum
            const parts = trimmed.split('|').map((p) => p.trim());
            if (parts.length >= 3) {
                // Sometimes the first char is not a leading |; ensure we take correct columns
                // We'll take first three non-empty segments if the first segment is the problem title
                const [col1, col2, col3] = [parts[0], parts[1], parts[2]];
                rows.push({ raw: line, col1, col2, col3 });
            }
        }
    }

    return rows;
}

async function main() {
    const args = parseArgs();
    const indexPath = args.indexFile
        ? path.resolve(process.cwd(), args.indexFile)
        : path.join(__dirname, '../src/problems/index.md');
    const problemsPath = args.problemsFile
        ? path.resolve(process.cwd(), args.problemsFile)
        : path.join(__dirname, '../src/data/problems.json');

    if (!fs.existsSync(indexPath)) {
        console.error('index.md not found at', indexPath);
        process.exit(2);
    }
    if (!fs.existsSync(problemsPath)) {
        console.error('problems.json not found at', problemsPath);
        process.exit(3);
    }

    const mdRaw = fs.readFileSync(indexPath, 'utf8');
    const rows = parseIndexMd(mdRaw);

    const rawProblems = fs.readFileSync(problemsPath, 'utf8');
    let problems = [];
    try {
        problems = JSON.parse(rawProblems);
    } catch (e) {
        console.error('Failed to parse problems.json:', e.message);
        process.exit(4);
    }

    // Build lookup map from multiple keys -> index
    const map = new Map();
    problems.forEach((p, idx) => {
        const codes = [];
        if (p.questionCode) codes.push(String(p.questionCode).toUpperCase());
        if (p.questionCode) codes.push(String(p.questionCode).replace(/-/g, '').toUpperCase());
        if (p.id) codes.push(String(p.id));
        if (p.questionCode && /^SQL\d{2}$/.test(p.questionCode.toUpperCase())) {
            // add padded variant
            codes.push(p.questionCode.toUpperCase().replace(/^SQL(\d{2})$/, 'SQL0$1'));
        }
        codes.forEach((k) => map.set(k, idx));
    });

    const applied = [];
    const notApplied = [];

    for (const r of rows) {
        // Extract code from col1: usually starts with code like `SQL115 - ...` or `SQL-2831 - ...`
        const col1 = r.col1 || '';
        const m = col1.match(/^([A-Za-z0-9-]+)\s*-?/);
        if (!m) continue;
        let code = m[1].trim();
        const customFilter = (r.col2 || '').trim();

        // normalize code and produce variants
        const variants = normalizeCodeVariants(code);

        // Also try simple upper and no-dash
        variants.push(String(code).toUpperCase());
        variants.push(String(code).replace(/-/g, '').toUpperCase());

        let foundIdx = null;
        for (const v of variants) {
            if (map.has(v)) {
                foundIdx = map.get(v);
                break;
            }
        }

        if (foundIdx === null) {
            // Try to find by matching questionCode that contains numeric part (SQL09x handling)
            const numMatch = code.match(/^SQL-?(\d+)$/i);
            if (numMatch) {
                const n = numMatch[1];
                const padded = n.length === 2 ? `SQL0${n}` : `SQL${n}`;
                if (map.has(padded)) foundIdx = map.get(padded);
            }
        }

        if (foundIdx === null) {
            notApplied.push(code);
            continue;
        }

        // apply customSort to the problem
        const problem = problems[foundIdx];
        if (customFilter) {
            problem.customSort = customFilter;
            applied.push(problem.questionCode || problem.id || code);
        } else {
            // empty filter -> remove existing customSort if present
            if (problem.customSort !== undefined) {
                delete problem.customSort;
            }
        }
    }

    // Summary
    console.log('Total rows in index.md:', rows.length);
    console.log('Applied count:', applied.length);
    console.log('Not applied count:', notApplied.length);
    if (applied.length) console.log('Applied examples:', applied.slice(0, 20).join(', '));
    if (notApplied.length) console.log('Not applied codes (examples):', notApplied.slice(0, 50).join(', '));

    if (args.dry) {
        console.log('Dry run - not writing changes. Use without --dry to persist.');
        return;
    }

    const backup = problemsPath + `.bak.${Date.now()}.json`;
    fs.copyFileSync(problemsPath, backup);
    fs.writeFileSync(problemsPath, JSON.stringify(problems, null, 2), 'utf8');
    console.log('Wrote updated problems.json. Backup created at', backup);
}

main().catch((err) => {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
});
