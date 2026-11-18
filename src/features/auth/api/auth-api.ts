import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpRequest } from "@/shared/libs/http";

import { SchemaValidateAuth, authProfileSchema, type FormPayloadAuth } from "../schemas/auth-schema";
import { API_ENDPOINTS, getApiUrl } from "@/config/api-config";
import type {
  In_AuthProfile,
  In_AuthTokenPayload,
  In_ForgotPasswordPayload,
  In_RegisterPayload,
  In_User,
} from "@/types/api-type";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  verifyEmail: (token: string) =>
    [...authKeys.all, "verify-email", token] as const,
};

export async function fetchAuthMe(
  signal?: AbortSignal,
): Promise<In_AuthProfile> {
  const res = await httpRequest<unknown>(
    getApiUrl(API_ENDPOINTS.AUTH.PROFILE),
    { method: "GET", signal },
  );
  return authProfileSchema.parse(res.data);
}

export const authApi = {
  query: {
    useVerifyEmail: (token: string) => {
      return useQuery({
        queryKey: authKeys.verifyEmail(token),
        queryFn: async ({ signal }: { signal: AbortSignal }) => {
          const encodeToken = encodeURIComponent(token);
          const res = await httpRequest<{ user: In_User }>(
            `${getApiUrl(API_ENDPOINTS.AUTH.VERIFY_EMAIL(encodeToken))}`,
            { method: "GET", skipAuth: true, signal },
          );
          return res.data;
        },
        enabled: Boolean(token),
        retry: false,
      });
    },

    useGetProfile: (enabled = true) => {
      return useQuery({
        queryKey: authKeys.me(),
        queryFn: ({ signal }: { signal: AbortSignal }) => fetchAuthMe(signal),
        enabled,
      });
    },
  },
  mutation: {
    useLogin: () => {
      return useMutation({
        mutationFn: async (
          values: FormPayloadAuth["Login"],
        ): Promise<In_AuthTokenPayload> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.AUTH.LOGIN),
            {
              method: "POST",
              body: values,
              skipAuth: true,
            },
          );
          return SchemaValidateAuth.authToken.parse(res.data);
        },
      });
    },
    useRegister: () => {
      return useMutation({
        mutationFn: async (values: FormPayloadAuth["Register"]) => {
          const res = await httpRequest<In_RegisterPayload>(
            getApiUrl(API_ENDPOINTS.AUTH.REGISTER),
            {
              method: "POST",
              body: values,
              skipAuth: true,
            },
          );
          return res.data;
        },
      });
    },
    useForgotPassword: () => {
      return useMutation({
        mutationFn: async (values: FormPayloadAuth["ForgotPassword"]) => {
          const res = await httpRequest<In_ForgotPasswordPayload>(
            getApiUrl(API_ENDPOINTS.AUTH.FORGOT_PASSWORD),
            {
              method: "POST",
              body: values,
              skipAuth: true,
            },
          );
          return res.data;
        },
      });
    },
    useResetPassword: () => {
      return useMutation({
        mutationFn: async (payload: FormPayloadAuth["ResetPassword"]) => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.AUTH.RESET_PASSWORD),
            {
              method: "POST",
              body: payload,
              skipAuth: true,
            },
          );
          return res.message;
        },
      });
    },
    useRefreshToken: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (
          refreshToken: string,
        ): Promise<In_AuthTokenPayload> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.AUTH.REFRESH_TOKEN),
            {
              method: "POST",
              body: { refresh_token: refreshToken },
              skipAuth: true,
            },
          );
          return SchemaValidateAuth.authToken.parse(res.data);
        },
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: authKeys.me() });
        },
      });
    },
    useLogout: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async () => {
          await httpRequest<null>(getApiUrl(API_ENDPOINTS.AUTH.LOGOUT), {
            method: "POST",
          });
        },
        onSettled: () => {
          queryClient.clear();
        },
      });
    },
  },
};
