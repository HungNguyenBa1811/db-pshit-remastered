import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const problemsDir = path.join(__dirname, '../src/problems');
const outputFile = path.join(__dirname, '../src/data/problems.json');
const DEFAULT_BASE = 'https://dbapi.ptit.edu.vn/api';

function parseProblemFile(filename, rawContent) {
    const lines = rawContent.split('\n');

    let id = '';
    let title = '';
    let webUrl = '';
    let apiUrl = '';
    let databaseType = 'Mysql';
    let contentStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('ID:')) {
            id = line.replace('ID:', '').trim();
        } else if (line.startsWith('Tiêu đề:')) {
            title = line.replace('Tiêu đề:', '').trim();
        } else if (line.startsWith('URL WEB:')) {
            webUrl = line.replace('URL WEB:', '').trim();
        } else if (line.startsWith('URL API:')) {
            apiUrl = line.replace('URL API:', '').trim();
        } else if (line.startsWith('Loại Database:')) {
            databaseType = line.replace('Loại Database:', '').trim();
        } else if (line === '------------------------------') {
            contentStartIndex = i + 1;
            break;
        }
    }

    const uuidMatch = apiUrl.match(/\/([a-f0-9-]{36})$/i);
    const questionUuid = uuidMatch ? uuidMatch[1] : id;

    const content = lines.slice(contentStartIndex).join('\n').trim();

    // Determine level
    let level = 'EASY';
    if (id.match(/^SQL-?(1[6-9]|2[0-9])\d{2}/)) {
        level = 'HARD';
    } else if (id.match(/^SQL1[0-5]\d/) || id.startsWith('ENG-')) {
        level = 'MEDIUM';
    }

    return {
        id: questionUuid,
        questionCode: id,
        title: title,
        content: content,
        level: level,
        point: level === 'EASY' ? 10 : level === 'MEDIUM' ? 20 : 30,
        webUrl: webUrl,
        apiUrl: apiUrl,
        databaseType: databaseType,
    };
}

// Read all HTML files
const files = fs.readdirSync(problemsDir).filter((f) => f.endsWith('.html'));
const parsedProblems = [];

for (const file of files) {
    const filePath = path.join(problemsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const problem = parseProblemFile(file, content);
    parsedProblems.push(problem);
}

// Sort by questionCode for local list
parsedProblems.sort((a, b) => a.questionCode.localeCompare(b.questionCode));

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Load existing problems.json if present
let existing = [];
if (fs.existsSync(outputFile)) {
    try {
        const raw = fs.readFileSync(outputFile, 'utf8');
        existing = JSON.parse(raw) || [];
        if (!Array.isArray(existing)) existing = [];
    } catch (e) {
        console.error('Failed to parse existing problems.json, backing up and starting fresh:', e.message);
        const bak = outputFile + `.corrupt.${Date.now()}.bak`;
        fs.copyFileSync(outputFile, bak);
        existing = [];
    }
}

const existingIds = new Set(existing.map((p) => p.id));

const BASE_URL = (process.env.BASE_URL || DEFAULT_BASE).replace(/\/$/, '');

// Find parsed problems that are not present in existing problems.json
const missing = parsedProblems.filter((p) => p && p.id && !existingIds.has(p.id));

const fetched = [];
for (const p of missing) {
    const id = p.id;
    const url = `${BASE_URL}/app/question/${id}`;
    console.log(`Fetching missing problem ${id} from ${url}`);
    try {
        const resp = await axios.get(url, { timeout: 20000 });
        const respData = resp.data || {};

        // Map response to local item shape, prefer response fields when available
        const item = {
            id: id,
            questionCode: p.questionCode || respData.questionCode || respData.question_code || '',
            title: respData.title || p.title || '',
            content: respData.content || p.content || '',
            level: respData.level || p.level || 'EASY',
            point:
                respData.point ||
                respData.pointValue ||
                (p && p.point) ||
                (respData.level === 'HARD' ? 30 : respData.level === 'MEDIUM' ? 20 : 10),
            webUrl: p.webUrl || `https://db.ptit.edu.vn/question-detail/${id}`,
            apiUrl: `${BASE_URL}/app/question/${id}`,
            databaseType:
                (respData.questionDetails &&
                    respData.questionDetails[0] &&
                    respData.questionDetails[0].typeDatabase &&
                    respData.questionDetails[0].typeDatabase.name) ||
                respData.databaseType ||
                p.databaseType ||
                'Mysql',
            type: respData.type || respData.questionType || p.type || 'SELECT',
            prefixCode: respData.prefixCode || p.prefixCode || '',
            enable: respData.enable === undefined ? (p.enable === undefined ? true : p.enable) : respData.enable,
            questionDetails: respData.questionDetails || p.questionDetails || [],
        };

        fetched.push(item);
    } catch (err) {
        console.error(`Failed fetching ${id}:`, err.response ? `HTTP ${err.response.status}` : err.message);
    }
}

if (fetched.length === 0) {
    // No new items: write parsedProblems as before (replace file) to keep parity
    fs.writeFileSync(outputFile, JSON.stringify(parsedProblems, null, 2), 'utf-8');
    console.log(`No missing problems fetched. Wrote ${parsedProblems.length} parsed problems to ${outputFile}`);
} else {
    // Backup original
    const backupPath = outputFile + `.bak.${Date.now()}.json`;
    if (fs.existsSync(outputFile)) fs.copyFileSync(outputFile, backupPath);

    // Append fetched items to end of existing array (preserve existing items order)
    const combined = existing.concat(fetched);
    fs.writeFileSync(outputFile, JSON.stringify(combined, null, 2), 'utf-8');
    console.log(`Appended ${fetched.length} new problems to ${outputFile} (backup: ${backupPath})`);
}
