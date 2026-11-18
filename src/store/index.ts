import { configureStore } from '@reduxjs/toolkit';
import authReducer, { clearSession, setTokens } from './slices/auth-slice';
import uiReducer from './slices/ui-slice';
import { registerTokenAdapter } from '@/shared/libs/http';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
});

registerTokenAdapter({
  getAccessToken: () => store.getState().auth.accessToken,
  getRefreshToken: () => store.getState().auth.refreshToken,
  getTokenType: () => store.getState().auth.tokenType,
  onTokensRefreshed: (payload) => {
    store.dispatch(setTokens(payload));
  },
  onAuthFailure: () => {
    store.dispatch(clearSession());
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;