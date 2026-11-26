import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { httpRequest } from '@/shared/libs/http';
import type { In_Milestone, In_MilestoneQueryParam, In_PaginatedResult } from '@/types/api-type';
import { API_ENDPOINTS, getApiUrl } from '@/config/api-config';
import {
  SchemaValidateMilestone,
  type In_MilestoneMutationPayload,
} from '../schemas';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const milestoneKeys = {
  all: ['milestones'] as const,
  list: (params?: In_MilestoneQueryParam) =>
    ['milestones', 'list', params ?? {}] as const,
  detail: (id: string) => ['milestones', 'detail', id] as const,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildQueryString = (params?: In_MilestoneQueryParam): string => {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({
    page: params.page,
    limit: params.limit,
    search: params.search,
    sort_by: params.sort_by,
    order_by: params.order_by,
    project_id: params.project_id,
    status: params.status,
  })) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  return query.size ? `?${query.toString()}` : '';
};

// ─── API ─────────────────────────────────────────────────────────────────────

export const milestoneApi = {
  query: {
    useFetchPaginationList: (params?: In_MilestoneQueryParam) => {
      return useQuery({
        queryKey: milestoneKeys.list(params),
        queryFn: async ({
          signal,
        }): Promise<In_PaginatedResult<In_Milestone>> => {
          const qs = buildQueryString(params);
          const endpoint = `${getApiUrl(API_ENDPOINTS.MILESTONE.LIST)}${qs}`;
          const res = await httpRequest<unknown>(endpoint, { signal });
          const items = z
            .array(SchemaValidateMilestone.milestoneDetail)
            .parse(res.data);
          const pagination = res.meta?.pagination
            ? SchemaValidateMilestone.paginationMeta.parse(res.meta.pagination)
            : null;
          const totalRows =
            res.meta?.total_rows ?? pagination?.total_items ?? items.length;
          return { items, pagination, totalRows };
        },
      });
    },

    useFindById: (id: string | null) => {
      return useQuery({
        queryKey: milestoneKeys.detail(id ?? ''),
        queryFn: async ({ signal }): Promise<In_Milestone> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.MILESTONE.FIND(id)),
            { signal },
          );
          const rawItem = Array.isArray(res.data) ? res.data[0] : res.data;
          return SchemaValidateMilestone.milestoneDetail.parse(rawItem);
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
          payload: In_MilestoneMutationPayload,
        ): Promise<In_Milestone> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.MILESTONE.CREATE),
            {
              method: 'POST',
              body: payload,
            },
          );
          const rawItem = Array.isArray(res.data) ? res.data[0] : res.data;
          return SchemaValidateMilestone.milestoneDetail.parse(rawItem);
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: milestoneKeys.all });
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
          payload: In_MilestoneMutationPayload;
        }): Promise<In_Milestone> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.MILESTONE.UPDATE(id)),
            {
              method: 'PUT',
              body: payload,
            },
          );
          const rawItem = Array.isArray(res.data) ? res.data[0] : res.data;
          return SchemaValidateMilestone.milestoneDetail.parse(rawItem);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: milestoneKeys.all });
          void qc.invalidateQueries({
            queryKey: milestoneKeys.detail(vars.id),
          });
        },
      });
    },

    useDelete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string): Promise<string | undefined> => {
          const res = await httpRequest<{ id: string; title: string }>(
            getApiUrl(API_ENDPOINTS.MILESTONE.DELETE(id)),
            { method: 'PUT' },
          );
          return res.message;
        },
        onSuccess: (_data, id) => {
          void qc.invalidateQueries({ queryKey: milestoneKeys.all });
          void qc.invalidateQueries({
            queryKey: milestoneKeys.detail(id),
          });
        },
      });
    },
  },
};
