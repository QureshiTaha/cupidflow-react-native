import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getData } from "../hooks/useAsyncStorage";

export const baseUrl: string = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1`;


const API_AXIOS: AxiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

API_AXIOS.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authToken = await getData("accessToken"); 
    if (authToken && config.headers) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export { API_AXIOS };
