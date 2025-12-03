import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
  //baseURL: 'http://localhost:5000/api',
  baseURL: baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
