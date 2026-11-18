import type { In_ToastItem, In_UiState, T_ThemeMode } from '@/types/theme-type';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

function getInitialTheme(): T_ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('mile_dev_theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const initialTheme = getInitialTheme();
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', initialTheme === 'dark');
}

const initialState: In_UiState = {
  theme: initialTheme,
  isSidebarOpen: false,
  isSidebarCollapsed: false,
  toasts: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<T_ThemeMode>) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('mile_dev_theme', action.payload);
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', action.payload === 'dark');
      }
    },

    toggleTheme: (state) => {
      const next: T_ThemeMode = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = next;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('mile_dev_theme', next);
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next === 'dark');
      }
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },

    toggleSidebarCollapsed: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },

    pushToast: (state, action: PayloadAction<Omit<In_ToastItem, 'id'> & { id?: string }>) => {
      const id = action.payload.id ?? `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      state.toasts.push({
        id,
        title: action.payload.title,
        description: action.payload.description,
        variant: action.payload.variant,
      });
    },

    dismissToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setSidebarOpen,
  toggleSidebarCollapsed,
  pushToast,
  dismissToast,
} = uiSlice.actions;

export default uiSlice.reducer;
