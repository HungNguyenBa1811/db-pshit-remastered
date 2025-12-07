import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import problems from '../data/problems.json';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Code2, User, ArrowLeft, ArrowRight } from 'lucide-react';
// import clsx from 'clsx';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const location = useLocation();
    const match = location.pathname.match(/\/problem\/([^/]+)/);
    const currentId = match ? match[1] : null;
    let idx = -1;
    if (currentId) {
        idx = problems.findIndex((p) => p.id === currentId);
        if (idx === -1) {
            const decoded = decodeURIComponent(currentId);
            idx = problems.findIndex((p) => p.questionCode === currentId || p.questionCode === decoded);
        }
    }
    const prevId = idx > 0 ? problems[idx - 1].id : null;
    const nextId = idx >= 0 && idx < problems.length - 1 ? problems[idx + 1].id : null;
    const currentIndexDisplay = idx >= 0 ? `${idx + 1} / ${problems.length}` : null;
    const [jumpIndex, setJumpIndex] = useState(idx >= 0 ? idx + 1 : '');

    useEffect(() => {
        setJumpIndex(idx >= 0 ? idx + 1 : '');
    }, [idx]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // console.log(user)

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-bg-app/80 backdrop-blur-xl">
                <div className="container flex h-16 items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Code2 className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-gradient">DB PTIT Fake</span>
                    </Link>

                    {/* Prev / Next navigation (shows only on problem pages) */}
                    {match && (
                        <div className="hidden md:flex items-center gap-2 ml-4">
                            <button
                                onClick={() => prevId && navigate(`/problem/${prevId}`)}
                                disabled={!prevId}
                                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50"
                                title="Previous problem"
                            >
                                <ArrowLeft className="w-5 h-5 text-text-muted" />
                            </button>

                            <div className="text-sm text-text-muted px-2">{currentIndexDisplay}</div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const n = Number(jumpIndex);
                                    if (!isNaN(n) && n >= 1 && n <= problems.length) {
                                        const pid = problems[n - 1].id;
                                        navigate(`/problem/${pid}`);
                                    }
                                }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="number"
                                    min={1}
                                    max={problems.length}
                                    value={jumpIndex}
                                    onChange={(e) => setJumpIndex(e.target.value)}
                                    className="w-16 text-sm text-black bg-white/3 px-2 py-1 rounded border border-white/5 focus:outline-none"
                                    aria-label="Jump to problem number"
                                />
                            </form>

                            <button
                                onClick={() => nextId && navigate(`/problem/${nextId}`)}
                                disabled={!nextId}
                                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50"
                                title="Next problem"
                            >
                                <ArrowRight className="w-5 h-5 text-text-muted" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        {user && (
                            <>
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                                    <User className="w-4 h-4 text-text-muted" />
                                    <span className="text-sm font-medium text-text-main">
                                        {user.firstName + " " + user.lastName || 'Student'}
                                    </span>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-text-muted hover:text-error transition-colors rounded-lg hover:bg-white/5"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container py-8 px-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="py-6 border-t border-white/5 mt-auto">
                <div className="container text-center text-sm text-text-muted">
                    <p>© {new Date().getFullYear()} DB PTIT Client Remastered. Code bởi Gemini 3 và BidenJr.</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
