import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { httpRequest } from "@/shared/libs/http";
import type { In_PaginatedResult, In_QueryParam, In_Position } from "@/types/api-type";
import { API_ENDPOINTS, getApiUrl } from "@/config/api-config";
import {
  SchemaValidatePosition,
  type FormPayloadPosition,
} from "../schemas";


// Query Key
export const positionKeys = {
  all: ["positions"] as const,
  list: (params?: In_QueryParam) =>
    ["positions", "list", params ?? {}] as const,
  detail: (id: string) => ["positions", "detail", id] as const,
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
  values: FormPayloadPosition["Position"],
) => ({
  name: values.name.trim(),
});

// ─── API ─────────────────────────────────────────────────────────────────────

export const positionApi = {
  query: {
    useFetchPaginationList: (params?: In_QueryParam) => {
      return useQuery({
        queryKey: positionKeys.list(params),
        queryFn: async ({
          signal,
        }): Promise<In_PaginatedResult<In_Position>> => {
          const qs = buildQueryString(params);
          const endpoint = `${getApiUrl(API_ENDPOINTS.POSITION.LIST)}${qs}`;
          const res = await httpRequest<unknown>(endpoint, { signal });
          const items = z
            .array(SchemaValidatePosition.positionDetail)
            .parse(res.data);
          const pagination = res.meta?.pagination
            ? SchemaValidatePosition.paginationMeta.parse(
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
        queryKey: positionKeys.detail(id ?? ""),
        queryFn: async ({ signal }): Promise<In_Position> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.POSITION.FIND(id)),
            { signal },
          );
          return SchemaValidatePosition.positionDetail.parse(res.data);
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
          values: FormPayloadPosition["Position"],
        ): Promise<In_Position> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.POSITION.CREATE),
            {
              method: "POST",
              body: payloadOfMutation(values),
            },
          );
          return SchemaValidatePosition.positionDetail.parse(res.data);
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: positionKeys.all });
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
          values: FormPayloadPosition["Position"];
        }): Promise<In_Position> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.POSITION.UPDATE(id)),
            {
              method: "PUT",
              body: payloadOfMutation(values),
            },
          );
          return SchemaValidatePosition.positionDetail.parse(res.data);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: positionKeys.all });
          void qc.invalidateQueries({
            queryKey: positionKeys.detail(vars.id),
          });
        },
      });
    },

    useDelete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string): Promise<string | undefined> => {
          const res = await httpRequest<null>(
            getApiUrl(API_ENDPOINTS.POSITION.DELETE(id)),
            { method: "DELETE" },
          );
          return res.message;
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: positionKeys.all });
        },
      });
    },
  },
};
