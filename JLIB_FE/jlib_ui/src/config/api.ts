/**
 * Dynamically resolves the API Base URL based on runtime environment.
 * 
 * 1. If REACT_APP_LOCAL_API_BASE_URL is explicitly set (via .env or Vercel env), use it.
 * 2. If running in browser locally (localhost / 127.0.0.1):
 *    connects to http://127.0.0.1:8000 (or localhost:8000)
 * 3. If accessing via local network WiFi (e.g. 192.168.x.x from phone):
 *    connects to http://<hostname>:8000
 * 4. In production (e.g. j-library-brown.vercel.app):
 *    defaults to '' (same-origin relative URL) so requests route to /books, /users, etc.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.REACT_APP_LOCAL_API_BASE_URL;
  if (envUrl !== undefined && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    // Localhost dev
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:8000`;
    }

    // Local WiFi network testing from mobile phone or other devices
    if (
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.local')
    ) {
      return `http://${hostname}:8000`;
    }
  }

  // Deployed production environment (e.g., Vercel) -> use same-origin relative URLs
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
