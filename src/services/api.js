import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('db_ptit_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);

export const authApi = {
    // Login is handled via token input, but if we had an endpoint:
    // login: (credentials) => api.post('/auth/login', credentials),
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
};

export default api;
