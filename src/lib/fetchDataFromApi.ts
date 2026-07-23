import axios from "axios";

const baseURL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    let token = null;

    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      const tokenCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("token=")
      );
      token = tokenCookie ? tokenCookie.split("=")[1] : null;
    }

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const getToken = () => {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("token=")
  );

  return tokenCookie
    ? decodeURIComponent(tokenCookie.split("=")[1].trim())
    : null;
};

const fetchData = {
  get: async (url: string, params = {}) => {
    const token = getToken();

    return axiosInstance.get(url, {
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  post: async (url: string, data = {}) => {
    const token = getToken();

    return axiosInstance.post(url, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};

export default fetchData;