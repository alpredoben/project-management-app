import { API_ENDPOINTS, getApiUrl } from "@/config/api-config";
import type { In_ApiEnvelope, In_AuthTokenPayload, In_TokenStorageAdapter } from "@/types/api-type";
import { ApiError } from "./apiError";

let tokenAdapter: In_TokenStorageAdapter | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function registerTokenAdapter(adapter: In_TokenStorageAdapter): void {
  tokenAdapter = adapter;
}

async function tryRefreshAccessToken(): Promise<string | null> {
  if (!tokenAdapter) return null;
  const refreshToken = tokenAdapter.getRefreshToken();
  if (!refreshToken) return null;

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) {
        tokenAdapter?.onAuthFailure();
        return null;
      }
      const json = (await response.json()) as In_ApiEnvelope<In_AuthTokenPayload>;
      if (!json.success || !json.data?.access_token) {
        tokenAdapter?.onAuthFailure();
        return null;
      }
      tokenAdapter?.onTokensRefreshed(json.data);
      return json.data.access_token;
    } catch {
      tokenAdapter?.onAuthFailure();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

export async function httpRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<In_ApiEnvelope<T>> {
  const { method = 'GET', body, skipAuth = false, signal } = options;

  const makeHeaders = (token: string | null): HeadersInit => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (!skipAuth && token) {
      const tokenType = tokenAdapter?.getTokenType?.() || 'Bearer';
      headers['Authorization'] = `${tokenType} ${token}`;
    }
    return headers;
  };

  const currentToken = tokenAdapter?.getAccessToken() ?? null;

  let response = await fetch(url, {
    method,
    headers: makeHeaders(currentToken),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (response.status === 401 && !skipAuth) {
    const refreshedToken = await tryRefreshAccessToken();
    if (refreshedToken) {
      response = await fetch(url, {
        method,
        headers: makeHeaders(refreshedToken),
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });
    }
  }

  let parsed: In_ApiEnvelope<T> | { success?: boolean; message?: string; code?: string } | null;
  try {
    parsed = (await response.json()) as In_ApiEnvelope<T>;
  } catch {
    parsed = null;
  }

  if (!response.ok || !parsed?.success) {
    const message = parsed?.message ?? `Request failed with status ${response.status}`;
    const code = parsed?.code ?? 'HTTP_ERROR';
    throw new ApiError(message, response.status, code);
  }

  return parsed as In_ApiEnvelope<T>;
}
