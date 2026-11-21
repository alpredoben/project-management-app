

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { httpRequest } from "@/shared/libs/http";
import { API_ENDPOINTS, getApiUrl } from "@/config/api-config";
import {type In_QueryParam, type In_PaginatedResult, type In_TaskStatus} from '@/types/api-type'
import { type FormPayloadTaskStatus, type In_TaskStatusMutationPayload, SchemaValidateTaskStatus } from "../schemas";

export const taskStatusKey = {
    all: ['type-status'] as const,
    list: (params?: In_QueryParam) => ['type-status', 'list', params ?? {}] as const,
    detail: (id: string) => ['type-status', 'detail', id] as const,
};

const buildQueryString = (params?: In_QueryParam): string => {
    if(!params) return '';
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
}

const toProjectStatusMutationPayload = (
  values: FormPayloadTaskStatus["TaskStatus"],
): In_TaskStatusMutationPayload => ({
  name: values.name.trim(),
  color_code: values.color_code.trim(),
  description: values.description.trim(),
  sequence_order: Number(values.sequence_order),
});

export const taskStatusApi = {
  query: {
    useFetchPaginationList: (params?: In_QueryParam) => {
      return useQuery({
        queryKey: taskStatusKey.list(params),
        queryFn: async ({
          signal,
        }): Promise<In_PaginatedResult<In_TaskStatus>> => {
          const qs = buildQueryString(params);
          const endpoint = `${getApiUrl(API_ENDPOINTS.PROJECT_STATUS.LIST)}${qs}`;
          const res = await httpRequest<unknown>(endpoint, { signal });
          const items = z
            .array(SchemaValidateTaskStatus.taskStatusDetail)
            .parse(res.data);
          const pagination = res.meta?.pagination
            ? SchemaValidateTaskStatus.paginationMeta.parse(
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
        queryKey: taskStatusKey.detail(id ?? ""),
        queryFn: async ({ signal }): Promise<In_TaskStatus> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.TASK_STATUS.FIND(id)),
            { signal },
          );
          return SchemaValidateTaskStatus.taskStatusDetail.parse(res.data);
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
          values: FormPayloadTaskStatus["TaskStatus"],
        ): Promise<In_TaskStatus> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.TASK_STATUS.CREATE),
            {
              method: "POST",
              body: toProjectStatusMutationPayload(values),
            },
          );
          return SchemaValidateTaskStatus.taskStatusDetail.parse(res.data);
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: taskStatusKey.all });
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
          values: FormPayloadTaskStatus["TaskStatus"];
        }): Promise<In_TaskStatus> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.TASK_STATUS.UPDATE(id)),
            {
              method: "PUT",
              body: toProjectStatusMutationPayload(values),
            },
          );
          return SchemaValidateTaskStatus.taskStatusDetail.parse(res.data);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: taskStatusKey.all });
          void qc.invalidateQueries({
            queryKey: taskStatusKey.detail(vars.id),
          });
        },
      });
    },

    useDelete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string): Promise<string | undefined> => {
          const res = await httpRequest<null>(
            getApiUrl(API_ENDPOINTS.TASK_STATUS.DELETE(id)),
            { method: "DELETE" },
          );
          return res.message;
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: taskStatusKey.all });
        },
      });
    },
  },
};
