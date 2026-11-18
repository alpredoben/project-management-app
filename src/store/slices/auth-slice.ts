import { STORAGE_KEY } from '@/shared/constants';
import { getLocalStorage, removeLocalStorage, setLocalStorage } from '@/shared/libs/helper';
import type { In_AuthProfile, In_AuthTokenPayload } from '@/types/api-type';
import type { In_AuthState } from '@/types/state-type';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const EMPTY_AUTH_STATE: In_AuthState = {
  user: null,
  tokenType: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  isAuthenticated: false,
};

type AuthTokenFields = Pick<
  In_AuthState,
  'tokenType' | 'accessToken' | 'refreshToken' | 'expiresAt'
>;

function assignTokens(
  state: AuthTokenFields,
  payload: In_AuthTokenPayload,
): void {
  state.tokenType = payload.token_type || 'Bearer';
  state.accessToken = payload.access_token;
  state.refreshToken = payload.refresh_token;
  state.expiresAt = decodeJwtExpIso(payload.access_token);
}

function decodeJwtExpIso(token: string): string | null {
  try {
    const segments = token.split('.');
    const payloadSegment = segments[1];
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLength);
    if (typeof atob !== 'function') return null;
    const decoded = atob(padded);

    const parsed: unknown = JSON.parse(decoded);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'exp' in parsed &&
      typeof (parsed as { exp?: unknown }).exp === 'number'
    ) {
      const expSeconds = (parsed as { exp: number }).exp;
      return new Date(expSeconds * 1000).toISOString();
    }
  } catch {
    return null;
  }
  return null;
}

function isValidStoredProfile(value: unknown): value is In_AuthProfile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<In_AuthProfile>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    Array.isArray(candidate.roles) &&
    Array.isArray(candidate.permissions)
  );
}

function loadInitialAuthState(): In_AuthState {
  if (typeof window === 'undefined') {
    return { ...EMPTY_AUTH_STATE };
  }

  try {
    const raw = getLocalStorage(STORAGE_KEY.AUTH);

    if (!raw) {
      return { ...EMPTY_AUTH_STATE };
    }
    const parsed = JSON.parse(raw) as Partial<In_AuthState>;

    if (typeof parsed.accessToken === 'string' && parsed.accessToken.length > 0) {
      return {
        user: isValidStoredProfile(parsed.user) ? parsed.user : null,
        tokenType:
          typeof parsed.tokenType === 'string' && parsed.tokenType.length > 0
            ? parsed.tokenType
            : 'Bearer',
        accessToken: parsed.accessToken,
        refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null,
        expiresAt:
          typeof parsed.expiresAt === 'string'
            ? parsed.expiresAt
            : decodeJwtExpIso(parsed.accessToken),
        isAuthenticated: true,
      };
    }
  } catch {
    removeLocalStorage(STORAGE_KEY.AUTH)
  }

  return { ...EMPTY_AUTH_STATE };
}

function persistAuthState(state: In_AuthState): void {
  if (typeof window === 'undefined') return;
  if (state.isAuthenticated && state.accessToken) {
    setLocalStorage(STORAGE_KEY.AUTH, state);
  } else {
    removeLocalStorage(STORAGE_KEY.AUTH);
  }
}

const initialState: In_AuthState = loadInitialAuthState();

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<In_AuthTokenPayload>) => {
      assignTokens(state, action.payload);
      state.isAuthenticated = true;
    },
    setPendingTokens: (state, action: PayloadAction<In_AuthTokenPayload>) => {
      state.user = null;
      assignTokens(state, action.payload);
      state.isAuthenticated = false;
    },
    setCurrentUser: (state, action: PayloadAction<In_AuthProfile>) => {
      state.user = action.payload;
      persistAuthState(state);
    },
    setSession: (
      state,
      action: PayloadAction<In_AuthTokenPayload & { user?: In_AuthProfile | null }>,
    ) => {
      assignTokens(state, action.payload);
      if (action.payload.user !== undefined) {
        state.user = action.payload.user;
      }
      state.isAuthenticated = true;
      persistAuthState(state);
    },
    clearSession: (state) => {
      state.user = null;
      state.tokenType = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.isAuthenticated = false;
      persistAuthState(state);
    },
  },
});

export const {
  setTokens,
  setPendingTokens,
  setCurrentUser,
  setSession,
  clearSession,
} = authSlice.actions;
export default authSlice.reducer;
