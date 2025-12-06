import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const problemsDir = path.join(__dirname, '../src/problems');
const outputFile = path.join(__dirname, '../src/data/problems.json');

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
const problems = [];

for (const file of files) {
    const filePath = path.join(problemsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const problem = parseProblemFile(file, content);
    problems.push(problem);
}

// Sort by questionCode
problems.sort((a, b) => a.questionCode.localeCompare(b.questionCode));

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Write JSON
fs.writeFileSync(outputFile, JSON.stringify(problems, null, 2), 'utf-8');

console.log(`Generated ${problems.length} problems to ${outputFile}`);
