import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { httpRequest } from "@/shared/libs/http";
import type { In_PaginatedResult, In_QueryParam } from "@/types/api-type";
import { API_ENDPOINTS, getApiUrl } from "@/config/api-config";
import {
  SchemaValidateWorkspace,
  type In_WorkspaceMutationPayload,
} from "../schemas";

// ─── Types ───────────────────────────────────────────────────────────────────

export type In_Workspace = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const workspaceKeys = {
  all: ["workspaces"] as const,
  list: (params?: In_QueryParam) =>
    ["workspaces", "list", params ?? {}] as const,
  detail: (id: string) => ["workspaces", "detail", id] as const,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildQueryString = (params?: In_QueryParam): string => {
  if (!params) return "";
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({
    page: params.page,
    limit: params.limit,
    search: params.search,
    sort_by: params.sort_by,
    order_by: params.order_by,
  })) {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }
  return query.size ? `?${query.toString()}` : "";
};

const toWorkspaceFormData = (payload: In_WorkspaceMutationPayload): FormData => {
  const formData = new FormData();
  formData.append("name", payload.name.trim());
  if (payload.file_logo instanceof File) {
    formData.append("file_logo", payload.file_logo);
  }
  return formData;
};

// ─── API ─────────────────────────────────────────────────────────────────────

export const workspaceApi = {
  query: {
    useWorkspaceList: (params?: In_QueryParam) => {
      return useQuery({
        queryKey: workspaceKeys.list(params),
        queryFn: async ({
          signal,
        }): Promise<In_PaginatedResult<In_Workspace>> => {
          const qs = buildQueryString(params);
          const endpoint = `${getApiUrl(API_ENDPOINTS.WORKSPACE.LIST)}${qs}`;
          const res = await httpRequest<unknown>(endpoint, { signal });
          const items = z
            .array(SchemaValidateWorkspace.workspaceDetail)
            .parse(res.data);
          const pagination = res.meta?.pagination
            ? SchemaValidateWorkspace.paginationMeta.parse(res.meta.pagination)
            : null;
          const totalRows =
            res.meta?.total_rows ?? pagination?.total_items ?? items.length;
          return { items, pagination, totalRows };
        },
      });
    },

    useWorkspaceFind: (id: string | null) => {
      return useQuery({
        queryKey: workspaceKeys.detail(id ?? ""),
        queryFn: async ({ signal }): Promise<In_Workspace> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.WORKSPACE.FIND(id)),
            { signal },
          );
          return SchemaValidateWorkspace.workspaceDetail.parse(res.data);
        },
        enabled: Boolean(id),
      });
    },
  },

  mutation: {
    useCreateWorkspace: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (
          payload: In_WorkspaceMutationPayload,
        ): Promise<In_Workspace> => {
          const formData = toWorkspaceFormData(payload);
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.WORKSPACE.CREATE),
            {
              method: "POST",
              body: formData,
            },
          );
          return SchemaValidateWorkspace.workspaceDetail.parse(res.data);
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: workspaceKeys.all });
        },
      });
    },

    useUpdateWorkspace: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async ({
          id,
          payload,
        }: {
          id: string;
          payload: In_WorkspaceMutationPayload;
        }): Promise<In_Workspace> => {
          const formData = toWorkspaceFormData(payload);
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.WORKSPACE.UPDATE(id)),
            {
              method: "POST",
              body: formData,
            },
          );
          return SchemaValidateWorkspace.workspaceDetail.parse(res.data);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: workspaceKeys.all });
          void qc.invalidateQueries({
            queryKey: workspaceKeys.detail(vars.id),
          });
        },
      });
    },

    useDeleteWorkspace: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string): Promise<string | undefined> => {
          const res = await httpRequest<null>(
            getApiUrl(API_ENDPOINTS.WORKSPACE.DELETE(id)),
            { method: "DELETE" },
          );
          return res.message;
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: workspaceKeys.all });
        },
      });
    },
  },
};
