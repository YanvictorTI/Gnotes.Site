export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5098' : 'https://gnotes-xf9y.onrender.com')
};