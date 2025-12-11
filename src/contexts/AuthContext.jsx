import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('db_ptit_token'));
    const [loading, setLoading] = useState(true);
    const isInitializing = useRef(true);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    if (!isInitializing.current) {
                        logout();
                    }
                } else {
                    setUser(decoded);
                    localStorage.setItem('db_ptit_token', token);
                }
            } catch (error) {
                console.error('Invalid token', error);
                if (!isInitializing.current) {
                    logout();
                }
            }
        } else {
            localStorage.removeItem('db_ptit_token');
        }

        if (!isInitializing.current) {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        const run = async () => {
            try {
                const storedToken = localStorage.getItem('db_ptit_token');
                if (!storedToken) {
                    return;
                }

                let decoded;
                try {
                    decoded = jwtDecode(storedToken);
                } catch (e) {
                    decoded = null;
                }

                const isExpired = !decoded || decoded.exp * 1000 < Date.now();
                if (!isExpired) return;

                const refreshToken = localStorage.getItem('db_ptit_refresh');
                if (!refreshToken) {
                    logout();
                    return;
                }

                setLoading(true);

                try {
                    const resp = await authApi.refreshToken(refreshToken);
                    const data = resp.data || {};
                    const newAccess = data.accessToken || data.access_token || data.access;
                    const newRefresh = data.refreshToken || data.refresh_token || data.refresh;

                    if (newAccess) {
                        if (newRefresh) localStorage.setItem('db_ptit_refresh', newRefresh);
                        login(newAccess, false);
                    } else {
                        logout();
                    }
                } catch (err) {
                    console.error('Silent refresh failed', err);
                    logout();
                }
            } finally {
                isInitializing.current = false;
                setLoading(false);
            }
        };

        run();
    }, []);

    useEffect(() => {
        const handleTokenRefreshed = (e) => {
            const newToken = e?.detail?.token;
            if (newToken) {
                try {
                    login(newToken, false);
                } catch (err) {
                    console.error('Failed to apply refreshed token to AuthContext', err);
                }
            }
        };

        window.addEventListener('token_refreshed', handleTokenRefreshed);
        return () => window.removeEventListener('token_refreshed', handleTokenRefreshed);
    }, []);

    const login = (newToken, showToast = true) => {
        try {
            const decoded = jwtDecode(newToken);
            setToken(newToken);
            setUser(decoded);
            localStorage.setItem('db_ptit_token', newToken);
            if (showToast) toast.success('Logged in successfully');
            return true;
        } catch (error) {
            if (showToast) toast.error('Invalid token format');
            return false;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('db_ptit_token');
        localStorage.removeItem('db_ptit_refresh');
        toast.success('Logged out');
    };

    return <AuthContext.Provider value={{ user, token, login, logout, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
