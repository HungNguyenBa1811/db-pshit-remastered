import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, ArrowRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const [tokenInput, setTokenInput] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!tokenInput.trim()) {
            setError('Please enter your JWT Token');
            return;
        }

        const success = login(tokenInput.trim());
        if (success) {
            navigate(from, { replace: true });
        } else {
            setError('Invalid token format. Please check and try again.');
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
                    <p className="text-text-muted">Enter your DB PSHIT access token to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="token" className="text-sm font-medium text-text-muted">
                            Access Token (JWT)
                        </label>
                        <textarea
                            id="token"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            className="w-full h-32 px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none font-mono text-sm"
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
                        className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg"
                    >
                        <span>Access Dashboard</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-text-muted">
                        Don't have a token? Login to{' '}
                        <a
                            href="https://db.ptit.edu.vn/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                        >
                            DB PSHIT
                        </a>{' '}
                        and check LocalStorage.
                    </p>
                    <div className="mt-4 text-left">
                        <p className="text-sm text-text-muted mb-2">Quick steps to get your token:</p>

                        <ol className="text-sm text-text-muted list-decimal list-inside mb-3">
                            <li>
                                Open <span className="font-medium">DB PSHIT</span> at{' '}
                                <a
                                    href="https://db.ptit.edu.vn/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary"
                                >
                                    db.ptit.edu.vn
                                </a>{' '}
                                and login.
                            </li>
                            <li>Open your browser DevTools (Console) and run the code below to see the token.</li>
                        </ol>

                        <div className="flex items-start gap-2">
                            <pre className="flex-1 bg-black/20 rounded-xl p-3 font-mono text-sm overflow-auto">
                                <code>localStorage.getItem("access_token")</code>
                            </pre>
                            <button
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText('localStorage.getItem("access_token")');
                                        toast.success('Copied to clipboard');
                                    } catch (e) {
                                        toast.error('Copy failed');
                                    }
                                }}
                                className="btn-primary px-3 py-2 text-sm"
                                aria-label="Copy code"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
