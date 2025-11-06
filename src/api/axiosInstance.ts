import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getData } from '../hooks/useAsyncStorage';

let testUrl = `http://192.168.0.104:5050/api/v1/`;
// let testUrl = `https://api-cupidflow.iceweb.in/`;

export const baseUrl: string = testUrl;

// Standard Axios Instance
const API_AXIOS: AxiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching the token
API_AXIOS.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const authToken = await getData('authToken');
    if (authToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

export { API_AXIOS };

// Multipart Axios Instance
const API_AXIOS_MULTIPART: AxiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 50000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Request interceptor for attaching the token to multipart requests
API_AXIOS_MULTIPART.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    const authToken = await getData('authToken');
    if (authToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

export { API_AXIOS_MULTIPART };
