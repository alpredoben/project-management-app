import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { httpRequest } from "@/shared/libs/http";
import type { In_PaginatedResult, In_ProjectStatus, In_QueryParam } from "@/types/api-type";
import { API_ENDPOINTS, getApiUrl } from "@/config/api-config";
import {
  SchemaValidateProjectStatus,
  type FormPayloadProjectStatus,
  type In_ProjectStatusMutationPayload,
} from "../schemas";



// Query Key
export const projectStatusKeys = {
  all: ["project-status"] as const,
  list: (params?: In_QueryParam) =>
    ["project-status", "list", params ?? {}] as const,
  detail: (id: string) => ["project-status", "detail", id] as const,
};

// Helper
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

const payloadOfMutation = (
  values: FormPayloadProjectStatus["ProjectStatus"],
): In_ProjectStatusMutationPayload => ({
  name: values.name.trim(),
  color_code: values.color_code.trim(),
  description: values.description.trim(),
  sequence_order: Number(values.sequence_order),
});

// ─── API ─────────────────────────────────────────────────────────────────────

export const projectStatusApi = {
  query: {
    useFetchPaginationList: (params?: In_QueryParam) => {
      return useQuery({
        queryKey: projectStatusKeys.list(params),
        queryFn: async ({
          signal,
        }): Promise<In_PaginatedResult<In_ProjectStatus>> => {
          const qs = buildQueryString(params);
          const endpoint = `${getApiUrl(API_ENDPOINTS.PROJECT_STATUS.LIST)}${qs}`;
          const res = await httpRequest<unknown>(endpoint, { signal });
          const items = z
            .array(SchemaValidateProjectStatus.projectStatusDetail)
            .parse(res.data);
          const pagination = res.meta?.pagination
            ? SchemaValidateProjectStatus.paginationMeta.parse(
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
        queryKey: projectStatusKeys.detail(id ?? ""),
        queryFn: async ({ signal }): Promise<In_ProjectStatus> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT_STATUS.FIND(id)),
            { signal },
          );
          return SchemaValidateProjectStatus.projectStatusDetail.parse(res.data);
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
          values: FormPayloadProjectStatus["ProjectStatus"],
        ): Promise<In_ProjectStatus> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT_STATUS.CREATE),
            {
              method: "POST",
              body: payloadOfMutation(values),
            },
          );
          return SchemaValidateProjectStatus.projectStatusDetail.parse(res.data);
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: projectStatusKeys.all });
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
          values: FormPayloadProjectStatus["ProjectStatus"];
        }): Promise<In_ProjectStatus> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT_STATUS.UPDATE(id)),
            {
              method: "PUT",
              body: payloadOfMutation(values),
            },
          );
          return SchemaValidateProjectStatus.projectStatusDetail.parse(res.data);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: projectStatusKeys.all });
          void qc.invalidateQueries({
            queryKey: projectStatusKeys.detail(vars.id),
          });
        },
      });
    },

    useDelete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string): Promise<string | undefined> => {
          const res = await httpRequest<null>(
            getApiUrl(API_ENDPOINTS.PROJECT_STATUS.DELETE(id)),
            { method: "DELETE" },
          );
          return res.message;
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: projectStatusKeys.all });
        },
      });
    },
  },
};
