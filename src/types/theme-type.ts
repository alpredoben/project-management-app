export type T_ThemeMode = 'light' | 'dark';
export type T_ToastVariant = 'success' | 'error' | 'info';

export interface In_ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: T_ToastVariant;
}

export interface In_UiState {
  theme: T_ThemeMode;
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  toasts: In_ToastItem[];
}