import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { httpRequest } from "@/shared/libs/http";
import type { In_PaginatedResult, In_TaskType, In_QueryParam } from "@/types/api-type";
import { API_ENDPOINTS, getApiUrl } from "@/config/api-config";
import {
  SchemaValidateTaskType,
  type FormPayloadTaskType,
} from "../schemas";


// Query Key
export const taskTypeKeys = {
  all: ["task-types"] as const,
  list: (params?: In_QueryParam) =>
    ["task-types", "list", params ?? {}] as const,
  detail: (id: string) => ["task-types", "detail", id] as const,
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
  values: FormPayloadTaskType["TaskType"],
) => ({
  name: values.name.trim(),
  description: values.description.trim(),
});

// ─── API ─────────────────────────────────────────────────────────────────────

export const taskTypeApi = {
  query: {
    useFetchPaginationList: (params?: In_QueryParam) => {
      return useQuery({
        queryKey: taskTypeKeys.list(params),
        queryFn: async ({
          signal,
        }): Promise<In_PaginatedResult<In_TaskType>> => {
          const qs = buildQueryString(params);
          const endpoint = `${getApiUrl(API_ENDPOINTS.TASK_TYPE.LIST)}${qs}`;
          const res = await httpRequest<unknown>(endpoint, { signal });
          const items = z
            .array(SchemaValidateTaskType.taskTypeDetail)
            .parse(res.data);
          const pagination = res.meta?.pagination
            ? SchemaValidateTaskType.paginationMeta.parse(
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
        queryKey: taskTypeKeys.detail(id ?? ""),
        queryFn: async ({ signal }): Promise<In_TaskType> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.TASK_TYPE.FIND(id)),
            { signal },
          );
          return SchemaValidateTaskType.taskTypeDetail.parse(res.data);
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
          values: FormPayloadTaskType["TaskType"],
        ): Promise<In_TaskType> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.TASK_TYPE.CREATE),
            {
              method: "POST",
              body: payloadOfMutation(values),
            },
          );
          return SchemaValidateTaskType.taskTypeDetail.parse(res.data);
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: taskTypeKeys.all });
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
          values: FormPayloadTaskType["TaskType"];
        }): Promise<In_TaskType> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.TASK_TYPE.UPDATE(id)),
            {
              method: "PUT",
              body: payloadOfMutation(values),
            },
          );
          return SchemaValidateTaskType.taskTypeDetail.parse(res.data);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: taskTypeKeys.all });
          void qc.invalidateQueries({
            queryKey: taskTypeKeys.detail(vars.id),
          });
        },
      });
    },

    useDelete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string): Promise<string | undefined> => {
          const res = await httpRequest<null>(
            getApiUrl(API_ENDPOINTS.TASK_TYPE.DELETE(id)),
            { method: "DELETE" },
          );
          return res.message;
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: taskTypeKeys.all });
        },
      });
    },
  },
};
