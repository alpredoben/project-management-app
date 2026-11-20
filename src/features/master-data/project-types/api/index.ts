import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { httpRequest } from "@/shared/libs/http";
import type { In_PaginatedResult, In_QueryParam } from "@/types/api-type";
import { API_ENDPOINTS, getApiUrl } from "@/config/api-config";
import {
  SchemaValidateProjectType,
  type FormPayloadProjectType,
} from "../schemas";

// ─── Types ───────────────────────────────────────────────────────────────────

export type In_ProjectType = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const projectTypeKeys = {
  all: ["project-types"] as const,
  list: (params?: In_QueryParam) =>
    ["project-types", "list", params ?? {}] as const,
  detail: (id: string) => ["project-types", "detail", id] as const,
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

const toProjectTypeMutationPayload = (
  values: FormPayloadProjectType["ProjectType"],
) => ({
  name: values.name.trim(),
  description: values.description.trim(),
});

// ─── API ─────────────────────────────────────────────────────────────────────

export const projectTypeApi = {
  query: {
    useProjectTypeList: (params?: In_QueryParam) => {
      return useQuery({
        queryKey: projectTypeKeys.list(params),
        queryFn: async ({
          signal,
        }): Promise<In_PaginatedResult<In_ProjectType>> => {
          const qs = buildQueryString(params);
          const endpoint = `${getApiUrl(API_ENDPOINTS.PROJECT_TYPE.LIST)}${qs}`;
          const res = await httpRequest<unknown>(endpoint, { signal });
          const items = z
            .array(SchemaValidateProjectType.projectTypeDetail)
            .parse(res.data);
          const pagination = res.meta?.pagination
            ? SchemaValidateProjectType.paginationMeta.parse(
                res.meta.pagination,
              )
            : null;
          const totalRows =
            res.meta?.total_rows ?? pagination?.total_items ?? items.length;
          return { items, pagination, totalRows };
        },
      });
    },

    useProjectTypeFind: (id: string | null) => {
      return useQuery({
        queryKey: projectTypeKeys.detail(id ?? ""),
        queryFn: async ({ signal }): Promise<In_ProjectType> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT_TYPE.FIND(id)),
            { signal },
          );
          return SchemaValidateProjectType.projectTypeDetail.parse(res.data);
        },
        enabled: Boolean(id),
      });
    },
  },

  mutation: {
    useCreateProjectType: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (
          values: FormPayloadProjectType["ProjectType"],
        ): Promise<In_ProjectType> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT_TYPE.CREATE),
            {
              method: "POST",
              body: toProjectTypeMutationPayload(values),
            },
          );
          return SchemaValidateProjectType.projectTypeDetail.parse(res.data);
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: projectTypeKeys.all });
        },
      });
    },

    useUpdateProjectType: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async ({
          id,
          values,
        }: {
          id: string;
          values: FormPayloadProjectType["ProjectType"];
        }): Promise<In_ProjectType> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PROJECT_TYPE.UPDATE(id)),
            {
              method: "PUT",
              body: toProjectTypeMutationPayload(values),
            },
          );
          return SchemaValidateProjectType.projectTypeDetail.parse(res.data);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: projectTypeKeys.all });
          void qc.invalidateQueries({
            queryKey: projectTypeKeys.detail(vars.id),
          });
        },
      });
    },

    useDeleteProjectType: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string): Promise<string | undefined> => {
          const res = await httpRequest<null>(
            getApiUrl(API_ENDPOINTS.PROJECT_TYPE.DELETE(id)),
            { method: "DELETE" },
          );
          return res.message;
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: projectTypeKeys.all });
        },
      });
    },
  },
};
