import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, ArrowRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password) {
            setError('Please enter username and password');
            return;
        }

        setLoading(true);
        try {
            const resp = await authApi.ptitLogin(username.trim(), password);
            const data = resp.data || {};
            // support different token field names
            const access = data.accessToken || data.access_token || data.access;
            const refresh = data.refreshToken || data.refresh_token || data.refresh;

            if (access) {
                // persist refresh token if available
                if (refresh) localStorage.setItem('db_ptit_refresh', refresh);
                // use auth context login to validate and store access token
                const ok = login(access);
                if (ok) {
                    navigate(from, { replace: true });
                } else {
                    setError('Failed to process access token');
                }
            } else {
                setError('Login failed: no access token returned');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-md p-8 glass-panel rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                        <KeyRound className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
                    <p className="text-text-muted">Sign in with your DB PSHIT account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium text-text-muted">
                            DB PSHIT Username
                        </label>
                        <input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nhập mã sinh viên"
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-text-muted">
                            DB PSHIT Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu"
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 text-error text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg"
                    >
                        <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-text-muted">Don't have an account? What a noob..</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
