import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { httpRequest } from '@/shared/libs/http';
import type { In_PaginatedResult, In_Project, In_ProjectQueryParam } from '@/types/api-type';
import { API_ENDPOINTS, getApiUrl } from '@/config/api-config';
import {
  SchemaValidateProject,
  type In_ChangeProjectStatusPayload,
  type In_ChangeProjectTypePayload,
  type In_ProjectMutationPayload,
} from '../schemas';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const projectKeys = {
  all: ['projects'] as const,
  list: (params?: In_ProjectQueryParam) =>
    ['projects', 'list', params ?? {}] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildQueryString = (params?: In_ProjectQueryParam): string => {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({
    page: params.page,
    limit: params.limit,
    search: params.search,
    sort_by: params.sort_by,
    order_by: params.order_by,
    workspace_id: params.workspace_id,
    project_status_id: params.project_status_id,
    project_type_id: params.project_type_id,
  })) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  return query.size ? `?${query.toString()}` : '';
};

// ─── API ─────────────────────────────────────────────────────────────────────

export const projectApi = {
  query: {
    useFetchPaginationList: (params?: In_ProjectQueryParam) => {
      return useQuery({
        queryKey: projectKeys.list(params),
        queryFn: async ({
          signal,
        }): Promise<In_PaginatedResult<In_Project>> => {
          const qs = buildQueryString(params);
          const endpoint = `${getApiUrl(API_ENDPOINTS.PROJECT.LIST)}${qs}`;
          const res = await httpRequest<unknown>(endpoint, { signal });
          const items = z
            .array(SchemaValidateProject.projectDetail)
            .parse(res.data);
          const pagination = res.meta?.pagination
            ? SchemaValidateProject.paginationMeta.parse(res.meta.pagination)
            : null;
          const totalRows =
            res.meta?.total_rows ?? pagination?.total_items ?? items.length;
          return { items, pagination, totalRows };
        },
      });
    },

    useFindById: (id: string | null) => {
      return useQuery({
        queryKey: projectKeys.detail(id ?? ''),
        queryFn: async ({ signal }): Promise<In_Project> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT.FIND(id)),
            { signal },
          );
          // Handles cases where response data is an array [ { ... } ] or a single object { ... }
          const rawItem = Array.isArray(res.data) ? res.data[0] : res.data;
          return SchemaValidateProject.projectDetail.parse(rawItem);
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
          payload: In_ProjectMutationPayload,
        ): Promise<In_Project> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT.CREATE),
            {
              method: 'POST',
              body: payload,
            },
          );
          const rawItem = Array.isArray(res.data) ? res.data[0] : res.data;
          return SchemaValidateProject.projectDetail.parse(rawItem);
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: projectKeys.all });
        },
      });
    },

    useUpdate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async ({
          id,
          payload,
        }: {
          id: string;
          payload: In_ProjectMutationPayload;
        }): Promise<In_Project> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT.UPDATE(id)),
            {
              method: 'PUT',
              body: payload,
            },
          );
          const rawItem = Array.isArray(res.data) ? res.data[0] : res.data;
          return SchemaValidateProject.projectDetail.parse(rawItem);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: projectKeys.all });
          void qc.invalidateQueries({
            queryKey: projectKeys.detail(vars.id),
          });
        },
      });
    },

    useDelete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string): Promise<string | undefined> => {
          const res = await httpRequest<{ id: string; name: string }>(
            getApiUrl(API_ENDPOINTS.PROJECT.DELETE(id)),
            { method: 'PUT' },
          );
          return res.message;
        },
        onSuccess: (_data, id) => {
          void qc.invalidateQueries({ queryKey: projectKeys.all });
          void qc.invalidateQueries({
            queryKey: projectKeys.detail(id),
          });
        },
      });
    },

    useChangeStatus: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async ({
          id,
          payload,
        }: {
          id: string;
          payload: In_ChangeProjectStatusPayload;
        }): Promise<In_Project> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT.CHANGE_STATUS(id)),
            {
              method: 'PUT',
              body: payload,
            },
          );
          const rawItem = Array.isArray(res.data) ? res.data[0] : res.data;
          return SchemaValidateProject.projectDetail.parse(rawItem);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: projectKeys.all });
          void qc.invalidateQueries({
            queryKey: projectKeys.detail(vars.id),
          });
        },
      });
    },

    useChangeType: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async ({
          id,
          payload,
        }: {
          id: string;
          payload: In_ChangeProjectTypePayload;
        }): Promise<In_Project> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT.CHANGE_TYPE(id)),
            {
              method: 'PUT',
              body: payload,
            },
          );
          const rawItem = Array.isArray(res.data) ? res.data[0] : res.data;
          return SchemaValidateProject.projectDetail.parse(rawItem);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: projectKeys.all });
          void qc.invalidateQueries({
            queryKey: projectKeys.detail(vars.id),
          });
        },
      });
    },
  },
};
