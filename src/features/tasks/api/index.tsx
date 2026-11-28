import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { httpRequest } from '@/shared/libs/http';
import type {
  In_PaginatedResult,
  In_Task,
  In_TaskQueryParam,
  In_TaskTrackingItem,
} from '@/types/api-type';
import { API_ENDPOINTS, getApiUrl } from '@/config/api-config';
import {
  SchemaValidateTask,
  type FormPayloadTask,
  type In_TaskMutationPayload,
} from '../schemas';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const taskKeys = {
  all: ['tasks'] as const,
  list: (params?: In_TaskQueryParam) => ['tasks', 'list', params ?? {}] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
  tracking: (projectId: string) => ['tasks', 'tracking', projectId] as const,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildQueryString = (params?: In_TaskQueryParam): string => {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({
    page: params.page,
    limit: params.limit,
    search: params.search,
    sort_by: params.sort_by,
    order_by: params.order_by,
    project_id: params.project_id,
    milestone_id: params.milestone_id,
    task_type_id: params.task_type_id,
    task_status_id: params.task_status_id,
    priority: params.priority,
  })) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  return query.size ? `?${query.toString()}` : '';
};

const toMutationPayload = (
  values: FormPayloadTask['Task'],
): In_TaskMutationPayload => ({
  project_id: values.project_id.trim(),
  milestone_id: values.milestone_id.trim(),
  task_type_id: values.task_type_id.trim(),
  task_status_id: values.task_status_id.trim(),
  title: values.title.trim(),
  description: values.description?.trim() ?? '',
  priority: values.priority.trim(),
  estimated_hours: Number(values.estimated_hours) || 0,
  start_date: values.start_date,
  end_date: values.end_date,
  mom_number: values.mom_number?.trim() || null,
  mom_date: values.mom_date?.trim() || null,
});

// ─── API ─────────────────────────────────────────────────────────────────────

export const taskApi = {
  query: {
    useFetchPaginationList: (params?: In_TaskQueryParam) => {
      return useQuery({
        queryKey: taskKeys.list(params),
        queryFn: async ({ signal }): Promise<In_PaginatedResult<In_Task>> => {
          const qs = buildQueryString(params);
          const endpoint = `${getApiUrl(API_ENDPOINTS.TASK.LIST)}${qs}`;
          const res = await httpRequest<unknown>(endpoint, { signal });
          const items = z
            .array(SchemaValidateTask.taskDetail)
            .parse(res.data) as In_Task[];
          const pagination = res.meta?.pagination
            ? SchemaValidateTask.paginationMeta.parse(res.meta.pagination)
            : null;
          const totalRows =
            res.meta?.total_rows ?? pagination?.total_items ?? items.length;
          return { items, pagination, totalRows };
        },
      });
    },

    useFindById: (id: string | null) => {
      return useQuery({
        queryKey: taskKeys.detail(id ?? ''),
        queryFn: async ({ signal }): Promise<In_Task> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.TASK.FIND(id)),
            { signal },
          );
          const rawItem = Array.isArray(res.data) ? res.data[0] : res.data;
          return SchemaValidateTask.taskDetail.parse(rawItem) as In_Task;
        },
        enabled: Boolean(id),
      });
    },

    useFetchTaskTracking: (projectId: string | null) => {
      return useQuery({
        queryKey: taskKeys.tracking(projectId ?? ''),
        queryFn: async ({ signal }): Promise<In_TaskTrackingItem[]> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT.TASK_TRACKING(projectId)),
            { signal },
          );
          return z
            .array(SchemaValidateTask.taskTrackingItem)
            .parse(res.data) as In_TaskTrackingItem[];
        },
        enabled: Boolean(projectId),
      });
    },
  },

  mutation: {
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (
          values: FormPayloadTask['Task'],
        ): Promise<In_Task> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.TASK.CREATE),
            {
              method: 'POST',
              body: toMutationPayload(values),
            },
          );
          const rawItem = Array.isArray(res.data) ? res.data[0] : res.data;
          return SchemaValidateTask.taskDetail.parse(rawItem) as In_Task;
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: taskKeys.all });
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
          values: FormPayloadTask['Task'];
        }): Promise<In_Task> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.TASK.UPDATE(id)),
            {
              method: 'PUT',
              body: toMutationPayload(values),
            },
          );
          const rawItem = Array.isArray(res.data) ? res.data[0] : res.data;
          return SchemaValidateTask.taskDetail.parse(rawItem) as In_Task;
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: taskKeys.all });
          void qc.invalidateQueries({
            queryKey: taskKeys.detail(vars.id),
          });
        },
      });
    },

    useDelete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string): Promise<string | undefined> => {
          const res = await httpRequest<{ id: string; title?: string }>(
            getApiUrl(API_ENDPOINTS.TASK.DELETE(id)),
            { method: 'DELETE' },
          );
          return res.message;
        },
        onSuccess: (_data, id) => {
          void qc.invalidateQueries({ queryKey: taskKeys.all });
          void qc.invalidateQueries({
            queryKey: taskKeys.detail(id),
          });
        },
      });
    },
  },
};
