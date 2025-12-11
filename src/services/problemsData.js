// Import pre-generated problems data
import problemsRaw from '../data/problems.json';

// Database type ID mapping
const DATABASE_TYPE_IDS = {
    mysql: '11111111-1111-1111-1111-111111111111',
    'sql server': '22222222-2222-2222-2222-222222222222',
    sqlserver: '22222222-2222-2222-2222-222222222222',
};

// Helper to get database type ID
const getDatabaseTypeId = (dbType) => {
    const key = dbType.toLowerCase();
    return DATABASE_TYPE_IDS[key] || DATABASE_TYPE_IDS.mysql;
};

// Process and index problems
const problemsMap = new Map();
const problemsList = problemsRaw.map((p) => ({
    ...p,
    acceptance: 72.7, // Mock data 40-80%
    totalSub: 676767, // Mock data 100-1100
    questionDetails: [
        {
            typeDatabase: {
                id: getDatabaseTypeId(p.databaseType),
                name: p.databaseType,
            },
        },
    ],
}));

// Build lookup map
problemsList.forEach((problem) => {
    problemsMap.set(problem.id, problem);
    problemsMap.set(problem.questionCode, problem);
});

/**
 * Local problems API that mimics the backend API structure
 */
export const localProblemsApi = {
    /**
     * Search problems with pagination and optional keyword filter
     */
    search: ({ page = 1, size = 12, keyword = '', type } = {}) => {
        let filtered = [...problemsList];

        if (keyword) {
            const lowerKeyword = keyword.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.title.toLowerCase().includes(lowerKeyword) || p.questionCode.toLowerCase().includes(lowerKeyword),
            );
        }

        if (type && String(type).toUpperCase() !== 'ALL') {
            const want = String(type).toUpperCase();
            filtered = filtered.filter((p) => String(p.type || '').toUpperCase() === want);
        }

        const totalElements = filtered.length;
        const totalPages = Math.ceil(totalElements / size);
        const start = (page - 1) * size;
        const content = filtered.slice(start, start + size);

        return Promise.resolve({
            data: {
                content,
                totalElements,
                totalPages,
                size,
                number: page - 1,
            },
        });
    },

    /**
     * Get problem detail by ID or questionCode
     */
    getDetail: (id) => {
        const problem = problemsMap.get(id);

        if (problem) {
            return Promise.resolve({ data: problem });
        }

        return Promise.reject(new Error('Problem not found'));
    },

    /**
     * Get all problems (without pagination)
     */
    getAll: () => {
        return Promise.resolve({ data: problemsList });
    },
};

export default localProblemsApi;
