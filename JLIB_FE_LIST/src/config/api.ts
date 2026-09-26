export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl !== undefined && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    // Localhost dev
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:8000`;
    }

    // Local network testing (e.g. phone on same WiFi)
    if (
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.local')
    ) {
      return `http://${hostname}:8000`;
    }

    // If hosted on j-library-brown.vercel.app itself, use same-origin relative URLs
    if (hostname === 'j-library-brown.vercel.app') {
      return '';
    }
  }

  // Deployed on any separate public Vercel domain or custom domain -> connects to live backend
  return 'https://j-library-brown.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();
