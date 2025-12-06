import { useState, useEffect } from 'react';
import { localProblemsApi } from '../services/problemsData';
import QuestionCard from '../components/QuestionCard';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                size: 12,
            };
            if (searchTerm) {
                params.keyword = searchTerm;
            }

            const response = await localProblemsApi.search(params);

            setQuestions(response.data.content);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Failed to fetch questions:', error);
            toast.error('Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [page, searchTerm]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchTerm(keyword);
        setPage(1);
    };

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
                        🚀
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
                    {questions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {questions.map((q) => (
                                <QuestionCard key={q.id} question={q} />
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
                                disabled={page === 1}
                                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <span className="text-sm font-medium text-text-muted">
                                Page {page} of {totalPages}
                            </span>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
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
