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