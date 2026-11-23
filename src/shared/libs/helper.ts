import type { In_AdminRouteNode } from '@/types/menu-type';
import dayjs from 'dayjs';
import { lazy, type ComponentType } from 'react';

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


export function lazyPage<M extends Record<string, unknown>>(
  loader: () => Promise<M>,
  exportName: keyof M & string,
) {
  return lazy(() =>
    loader().then((m) => ({ default: m[exportName] as ComponentType })),
  );
}


export const getFlatten = (nodes: readonly In_AdminRouteNode[]): In_AdminRouteNode[] =>
  nodes.flatMap((node) => [node, ...getFlatten(node.items)]);

export const slashed = (key: string): string => `/${key}` 


export const getPublicUrlExpression = (url: string): string => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const STORAGE_BUCKET = "pm-api-storage";
  const filePath = url.trim().replace(/\\/g, "/").replace(/^\/+/, "");

  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const apiOrigin = new URL(API_BASE_URL).origin;
  return new URL(
    `/storage/${STORAGE_BUCKET}/${filePath}`,
    apiOrigin,
  ).toString();
}