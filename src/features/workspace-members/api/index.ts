import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { httpRequest } from "@/shared/libs/http";
import type {
  In_PaginatedResult,
  In_QueryParam,
  In_WorkspaceMember,
} from "@/types/api-type";
import { API_ENDPOINTS, getApiUrl } from "@/config/api-config";
import {
  SchemaValidateWorkspaceMember,
  type FormPayloadWorkspaceMember,
  type In_WorkspaceMemberMutationPayload,
  type In_WorkspaceMemberMutationResponse,
} from "../schemas";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const workspaceMemberKeys = {
  all: ["workspace-members"] as const,
  list: (params?: In_QueryParam) =>
    ["workspace-members", "list", params ?? {}] as const,
  detail: (id: string) => ["workspace-members", "detail", id] as const,
};

// ─── Query String Helper ──────────────────────────────────────────────────────

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
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  return query.size ? `?${query.toString()}` : "";
};

const payloadOfMutation = (
  values: FormPayloadWorkspaceMember["Member"],
): In_WorkspaceMemberMutationPayload => ({
  workspace_id: values.workspace_id.trim(),
  user_id: values.user_id.trim(),
  position_id: values.position_id.trim(),
});

// ─── API Service Definition ───────────────────────────────────────────────────

export const workspaceMemberApi = {
  query: {
    useFetchPaginationList: (params?: In_QueryParam) => {
      return useQuery({
        queryKey: workspaceMemberKeys.list(params),
        queryFn: async ({
          signal,
        }): Promise<In_PaginatedResult<In_WorkspaceMember>> => {
          const qs = buildQueryString(params);
          const endpoint = `${getApiUrl(API_ENDPOINTS.WORKSPACE_MEMBERS.LIST)}${qs}`;
          const res = await httpRequest<unknown>(endpoint, { signal });
          const items = z
            .array(SchemaValidateWorkspaceMember.memberItem)
            .parse(res.data) as In_WorkspaceMember[];
          const pagination = res.meta?.pagination
            ? SchemaValidateWorkspaceMember.paginationMeta.parse(
                res.meta.pagination,
              )
            : null;
          const totalRows =
            res.meta?.total_rows ?? pagination?.total_items ?? items.length;
          return { items, pagination, totalRows };
        },
      });
    },

    useFindById: (id: string | null) => {
      return useQuery({
        queryKey: workspaceMemberKeys.detail(id ?? ""),
        queryFn: async ({ signal }): Promise<In_WorkspaceMember> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.WORKSPACE_MEMBERS.FIND(id)),
            { signal },
          );
          return SchemaValidateWorkspaceMember.memberDetail.parse(
            res.data,
          ) as In_WorkspaceMember;
        },
        enabled: Boolean(id),
      });
    },
  },

  mutation: {
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (
          values: FormPayloadWorkspaceMember["Member"],
        ): Promise<In_WorkspaceMemberMutationResponse> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.WORKSPACE_MEMBERS.CREATE),
            {
              method: "POST",
              body: payloadOfMutation(values),
            },
          );
          return SchemaValidateWorkspaceMember.mutationResponse.parse(
            res.data,
          );
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: workspaceMemberKeys.all });
        },
      });
    },

    useUpdate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async ({
          id,
          values,
        }: {
          id: string;
          values: FormPayloadWorkspaceMember["Member"];
        }): Promise<In_WorkspaceMemberMutationResponse> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.WORKSPACE_MEMBERS.UPDATE(id)),
            {
              method: "PUT",
              body: payloadOfMutation(values),
            },
          );
          return SchemaValidateWorkspaceMember.mutationResponse.parse(
            res.data,
          );
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: workspaceMemberKeys.all });
          void qc.invalidateQueries({
            queryKey: workspaceMemberKeys.detail(vars.id),
          });
        },
      });
    },

    useDelete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string): Promise<void> => {
          await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.WORKSPACE_MEMBERS.DELETE(id)),
            {
              method: "DELETE",
            },
          );
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: workspaceMemberKeys.all });
        },
      });
    },
  },
};

export type { In_WorkspaceMember };
