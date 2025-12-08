import { useState, useEffect, useRef } from 'react';
import { localProblemsApi } from '../services/problemsData';
import QuestionCard from '../components/QuestionCard';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { executorApi, authApi } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [filteredTotal, setFilteredTotal] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statuses, setStatuses] = useState({});
    const [filter, setFilter] = useState(() => {
        try {
            return localStorage.getItem('dashboard_status_filter') || 'ALL';
        } catch (e) {
            return 'ALL';
        }
    });

    // cache for all problems and statuses to avoid repeated API calls when paging
    const allCacheRef = useRef({ key: '', data: [] });
    const statusesCacheRef = useRef({ key: '', map: {} });

    const fetchQuestions = async () => {
        try {
            setLoading(true);

            const size = 12;
            // await testRefreshToken();
            // If no filter, use the paginated local search (server-like behavior)
            if (!filter || filter === 'ALL') {
                const params = { page, size };
                if (searchTerm) params.keyword = searchTerm;

                const response = await localProblemsApi.search(params);

                setQuestions(response.data.content);
                setTotalPages(response.data.totalPages);
                setFilteredTotal(response.data.totalElements);

                // Fetch statuses for visible items
                const ids = response.data.content.map((q) => q.id);
                const token = localStorage.getItem('db_ptit_token');
                if (token && ids.length > 0) {
                    try {
                        const statusResp = await executorApi.checkComplete(ids);
                        const map = {};
                        (statusResp.data || []).forEach((s) => {
                            map[s.questionId] = s.status;
                        });
                        setStatuses(map);
                    } catch (err) {
                        setStatuses({});
                    }
                } else {
                    setStatuses({});
                }

                return;
            }

            // When a status filter is active, fetch all problems and compute pagination client-side
            const cacheKey = searchTerm || '__all__';
            let all = [];
            if (allCacheRef.current.key === cacheKey && Array.isArray(allCacheRef.current.data)) {
                all = allCacheRef.current.data;
            } else {
                const allResp = await localProblemsApi.getAll();
                all = allResp.data || [];
                allCacheRef.current.key = cacheKey;
                allCacheRef.current.data = all;
            }
            if (searchTerm) {
                const lowerKeyword = searchTerm.toLowerCase();
                all = all.filter(
                    (p) =>
                        p.title.toLowerCase().includes(lowerKeyword) ||
                        p.questionCode.toLowerCase().includes(lowerKeyword),
                );
            }
            const ids = all.map((p) => p.id);
            const token = localStorage.getItem('db_ptit_token');
            let map = {};

            // Use cached statuses if available for this cacheKey+token combo
            const statusCacheKey = `${cacheKey}::${token || 'no-token'}`;
            if (statusesCacheRef.current.key === statusCacheKey && statusesCacheRef.current.map) {
                map = statusesCacheRef.current.map;
            } else if (token && ids.length > 0) {
                try {
                    const statusResp = await executorApi.checkComplete(ids);
                    (statusResp.data || []).forEach((s) => {
                        map[s.questionId] = s.status;
                    });
                    statusesCacheRef.current.key = statusCacheKey;
                    statusesCacheRef.current.map = map;
                } catch (err) {
                    map = {};
                    statusesCacheRef.current.key = statusCacheKey;
                    statusesCacheRef.current.map = map;
                }
            } else {
                // not logged in or no ids -> empty map
                map = {};
                statusesCacheRef.current.key = statusCacheKey;
                statusesCacheRef.current.map = map;
            }

            setStatuses(map);

            // apply filter (treat missing status as NA)
            const wanted = filter.toUpperCase();
            const filtered = all.filter((p) => {
                const s = (map[p.id] || 'NA').toUpperCase();
                return s === wanted;
            });

            const totalElements = filtered.length;
            const totalPagesCalc = Math.max(1, Math.ceil(totalElements / size));
            setTotalPages(totalPagesCalc);
            setFilteredTotal(totalElements);

            const boundedPage = Math.min(Math.max(1, page), totalPagesCalc);

            const start = (boundedPage - 1) * size;
            const pageContent = filtered.slice(start, start + size);
            setQuestions(pageContent);
        } catch (error) {
            console.error('Failed to fetch questions:', error);
            toast.error('Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [page, searchTerm, filter]);

    // reset to first page when filter or search changes
    useEffect(() => {
        setPage(1);
    }, [filter, searchTerm]);

    // persist filter selection
    useEffect(() => {
        try {
            localStorage.setItem('dashboard_status_filter', filter);
        } catch (e) {
            // ignore storage errors
        }
    }, [filter]);

    // derived count for UI when filter is active
    const showingCount = filteredTotal || questions.length;

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchTerm(keyword);
        setPage(1);
    };

    const testRefreshToken = async () => {
        const testToken =
            'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxNDYzODJiNS0xMzI2LTRiYTgtYTkxMS1lOGUwNGFlYTRhZDUiLCJyb2xlIjoiU1RVREVOVCIsInRva2VuVHlwZSI6InJlZnJlc2hUb2tlbiIsImV4cCI6MTc2NTc3NTMyMiwiaWF0IjoxNzY1MTcwNTIyLCJ1c2VybmFtZSI6IkIyM0RDQVQxMjAifQ.3g1_TeqjCwJ-nlYSAmOH9_jb-NQrPNi8eWy9ecCZtbY';
        try {
            const resp = await authApi.refreshToken(testToken);
            console.log('Refresh token response:', resp.data);
        } catch (err) {
            console.error('Refresh token error:', err);
        }
    };

    const currentPage = Math.min(Math.max(1, page), totalPages || 1);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient mb-2">Code Pshit</h1>
                    <p className="text-text-muted">
                        Special thanks to{' '}
                        <a
                            href="https://github.com/thanhtrnnn"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x hover:underline"
                        >
                            @thanhtrnnn
                        </a>{' '}
                        for the code database 🚀
                    </p>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                </form>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4 gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-text-muted mr-2">Filter:</span>
                            {['ALL', 'AC', 'WA', 'TLE', 'CE', 'NA'].map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setFilter(opt)}
                                    className={`text-sm px-3 py-1 rounded-full transition-colors border ${
                                        filter === opt
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white/3 text-text-muted border-transparent hover:bg-white/5'
                                    }`}
                                >
                                    {opt === 'ALL' ? 'All' : opt}
                                </button>
                            ))}
                        </div>

                        <div className="text-sm text-text-muted">
                            Showing: <span className="font-medium">{showingCount}</span>
                        </div>
                    </div>

                    {showingCount > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {questions.map((q) => (
                                <QuestionCard key={q.id} question={q} status={statuses[q.id]} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 glass-panel rounded-xl">
                            <p className="text-lg text-text-muted">No questions found matching your criteria.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-text-muted">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
