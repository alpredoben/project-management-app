import dayjs from 'dayjs';

export const getLocalStorage = (key: string): string | null => {
    return window.localStorage.getItem(key);
}

export const removeLocalStorage = (key: string) => {
    window.localStorage.removeItem(key)
}

export const setLocalStorage = (key: string, data: unknown): void => {
    window.localStorage.setItem(key, JSON.stringify(data));
}

export const formatDate = (strDate: string, format: string = 'D MMMM YYYY HH:mm'): string => {
    return dayjs(strDate).format(format)
}

export const getStorageUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8017';
  const baseUrl = rawBase.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${baseUrl}/${cleanPath}`;
}