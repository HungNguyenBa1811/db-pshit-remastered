import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Code2, User, LayoutDashboard } from 'lucide-react';
import clsx from 'clsx';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

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

                    <div className="flex items-center gap-4">
                        {user && (
                            <>
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                                    <User className="w-4 h-4 text-text-muted" />
                                    <span className="text-sm font-medium text-text-main">{user.sub || 'Student'}</span>
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
            <main className="flex-1 container py-8">
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
