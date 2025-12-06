import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('db_ptit_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check expiry if needed
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser(decoded);
                    localStorage.setItem('db_ptit_token', token);
                }
            } catch (error) {
                console.error('Invalid token', error);
                logout();
            }
        } else {
            localStorage.removeItem('db_ptit_token');
        }
        setLoading(false);
    }, [token]);

    const login = (newToken) => {
        try {
            const decoded = jwtDecode(newToken);
            setToken(newToken);
            setUser(decoded);
            localStorage.setItem('db_ptit_token', newToken);
            toast.success('Logged in successfully');
            return true;
        } catch (error) {
            toast.error('Invalid token format');
            return false;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('db_ptit_token');
        toast.success('Logged out');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
