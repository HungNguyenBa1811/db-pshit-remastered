import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Separate axios client for auth calls (login / refresh) to avoid response interceptor loops
const authClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('db_ptit_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Token refresh single-flight helpers
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeToken(cb) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
}

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('db_ptit_refresh');
            if (!refreshToken) {
                localStorage.removeItem('db_ptit_token');
                localStorage.removeItem('db_ptit_refresh');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (!isRefreshing) {
                isRefreshing = true;
                authClient
                    .post('/auth/auth/refresh-token', { refreshToken })
                    .then((resp) => {
                        const data = resp.data || {};
                        const newAccess = data.accessToken || data.access_token || data.access;
                        const newRefresh = data.refreshToken || data.refresh_token || data.refresh;

                        if (newAccess) {
                            localStorage.setItem('db_ptit_token', newAccess);
                            if (newRefresh) localStorage.setItem('db_ptit_refresh', newRefresh);
                            api.defaults.headers.Authorization = `Bearer ${newAccess}`;
                            try {
                                window.dispatchEvent(
                                    new CustomEvent('token_refreshed', { detail: { token: newAccess } }),
                                );
                            } catch (e) {}
                            onRefreshed(newAccess);
                        } else {
                            localStorage.removeItem('db_ptit_token');
                            localStorage.removeItem('db_ptit_refresh');
                            window.location.href = '/login';
                        }
                    })
                    .catch(() => {
                        localStorage.removeItem('db_ptit_token');
                        localStorage.removeItem('db_ptit_refresh');
                        window.location.href = '/login';
                    })
                    .finally(() => {
                        isRefreshing = false;
                    });
            }

            return new Promise((resolve, reject) => {
                subscribeToken((token) => {
                    // update header and retry original request
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    resolve(api(originalRequest));
                });
            });
        }

        return Promise.reject(error);
    },
);

export const authApi = {
    // Login is handled via token input, but if we had an endpoint:
    // login: (credentials) => api.post('/auth/login', credentials),
    /**
     * Refresh access token using a refresh token string.
     * POST /auth/refresh-token { refreshToken }
     */
    refreshToken: (refreshToken) => authClient.post('/auth/auth/refresh-token', { refreshToken }),
    // PTIT login: POST /auth/auth/ptit-login { username, password }
    ptitLogin: (username, password) => authClient.post('/auth/auth/ptit-login', { username, password }),
};

export const questionApi = {
    search: (params) => api.post('/app/question/search', params),
    getDetail: (id) => api.get(`/app/question/${id}`),
};

export const executorApi = {
    dryRun: (data) => api.post('/app/executor/user', data),
    submit: (data) => api.post('/app/executor/submit', data),
    checkComplete: (questionIds) => {
        const token = localStorage.getItem('db_ptit_token');
        if (!token) return Promise.reject('No token');

        try {
            const decoded = jwtDecode(token);
            const userId = decoded.userId || decoded.id || decoded.sub;

            return api.post('/app/submit-history/check/complete', {
                questionIds: Array.isArray(questionIds) ? questionIds : [questionIds],
                userId: userId,
            });
        } catch (e) {
            return Promise.reject('Invalid token');
        }
    },
    /**
     * Get submission history for the current user filtered by questionId.
     * Calls GET /app/submit-history/user/{userId}?questionId=...&page=...&size=...
     */
    getHistory: (questionId, page = 0, size = 10) => {
        const token = localStorage.getItem('db_ptit_token');
        if (!token) return Promise.reject('No token');

        try {
            const decoded = jwtDecode(token);
            const userId = decoded.userId || decoded.id || decoded.sub;

            return api.get(`/app/submit-history/user/${userId}`, {
                params: {
                    questionId,
                    page,
                    size,
                },
            });
        } catch (e) {
            return Promise.reject('Invalid token');
        }
    },
};

export default api;
