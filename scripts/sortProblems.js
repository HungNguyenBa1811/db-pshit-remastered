import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv = process.argv.slice(2)) {
    return {
        dry: argv.includes('--dry') || argv.includes('-d'),
        file: (argv.find((a) => a.startsWith('--file=')) || '').split('=')[1],
    };
}

function normalizeCode(code) {
    if (!code) return '';
    return String(code).replace(/-/g, '').toLowerCase();
}

async function main() {
    const args = parseArgs();
    const problemsPath = args.file
        ? path.resolve(process.cwd(), args.file)
        : path.join(__dirname, '../src/data/problems.json');

    if (!fs.existsSync(problemsPath)) {
        console.error('Cannot find problems file at', problemsPath);
        process.exit(2);
    }

    const raw = fs.readFileSync(problemsPath, 'utf8');
    let problems;
    try {
        problems = JSON.parse(raw);
    } catch (e) {
        console.error('Failed to parse JSON:', e.message);
        process.exit(3);
    }

    if (!Array.isArray(problems)) {
        console.error('Expected an array in problems.json');
        process.exit(4);
    }

    const sorted = [...problems].sort((a, b) => {
        const ca = normalizeCode(a.questionCode || a.questioncode || a.code || '');
        const cb = normalizeCode(b.questionCode || b.questioncode || b.code || '');
        if (ca < cb) return -1;
        if (ca > cb) return 1;
        return 0;
    });

    console.log(`Problems count: ${problems.length}`);

    // Show first 3 before/after if dry
    if (args.dry) {
        console.log('Dry run - first 5 items after sort:');
        console.log(
            sorted
                .slice(0, 5)
                .map((p) => p.questionCode || p.id)
                .join('\n'),
        );
        return;
    }

    const backupPath = problemsPath + `.bak.${Date.now()}.json`;
    fs.copyFileSync(problemsPath, backupPath);
    fs.writeFileSync(problemsPath, JSON.stringify(sorted, null, 2), 'utf8');

    console.log('Sorted problems.json and wrote backup to', backupPath);
}

main().catch((err) => {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
});
