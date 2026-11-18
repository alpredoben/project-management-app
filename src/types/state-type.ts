import type { In_AuthProfile } from "./api-type";

export interface In_AuthState {
  user: In_AuthProfile | null;
  tokenType: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
}
