import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { httpRequest } from "@/shared/libs/http";
import type {
  In_PaginatedResult,
  In_Permission,
  In_QueryParam,
  In_Role,
  In_RoleDetail,
  In_User,
} from "@/types/api-type";
import {
  findRoleDetailSchema,
  SchemaValidateAccess,
  type FormPayloadAccess,
  type In_PermissionMutationPayload,
  type In_RoleMutationPayload,
} from "../schemas/access-control-schema";
import { API_ENDPOINTS, getApiUrl } from "@/config/api-config";

export const accessControlKeys = {
  users: ["users"] as const,
  userList: (params?: In_QueryParam) =>
    ["users", "list", params ?? {}] as const,
  userDetail: (id: string) => ["users", "detail", id] as const,

  roles: ["roles"] as const,
  rolesList: (params?: In_QueryParam) =>
    ["roles", "list", params ?? {}] as const,
  roleDetail: (id: string) => ["roles", "detail", id] as const,

  permissions: ["permissions"] as const,
  permissionsList: (params?: In_QueryParam) =>
    ["permissions", "list", params ?? {}] as const,
  permissionGroups: ["permissions", "groups"] as const,
  permissionDetail: (id: string) => ["permissions", "detail", id] as const,
};

export const userAccessApi = {
  query: {
    useUsersList: () => {
      return useQuery({
        queryKey: accessControlKeys.users,
        queryFn: async ({ signal }) => {
          const res = await httpRequest<In_User[]>(
            getApiUrl(API_ENDPOINTS.USER.LIST),
            { signal },
          );
          return res.data;
        },
      });
    },
    useUserFind: (id: string | null) => {
      return useQuery({
        queryKey: accessControlKeys.userDetail(id ?? ""),
        queryFn: async ({ signal }) => {
          const res = await httpRequest<In_User>(
            getApiUrl(API_ENDPOINTS.USER.FIND(id)),
            { signal },
          );
          return res.data;
        },
        enabled: Boolean(id),
      });
    },
  },
  mutation: {
    useCreateUser: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (values: FormPayloadAccess["User"]) => {
          const res = await httpRequest<In_User>(
            getApiUrl(API_ENDPOINTS.USER.CREATE),
            {
              method: "POST",
              body: values,
            },
          );
          return res.data;
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: accessControlKeys.users });
        },
      });
    },
    useUpdateUser: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async ({
          id,
          values,
        }: {
          id: string;
          values: FormPayloadAccess["User"];
        }) => {
          const res = await httpRequest<In_User>(
            getApiUrl(API_ENDPOINTS.USER.UPDATE(id)),
            {
              method: "PUT",
              body: values,
            },
          );
          return res.data;
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: accessControlKeys.users });
          void qc.invalidateQueries({
            queryKey: accessControlKeys.userDetail(vars.id),
          });
        },
      });
    },
    useDeleteUser: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string) => {
          await httpRequest<null>(getApiUrl(API_ENDPOINTS.USER.DELETE(id)), {
            method: "DELETE",
          });
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: accessControlKeys.users });
        },
      });
    },
    useInsertUserRoles: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async ({
          id,
          roleIds,
        }: {
          id: string;
          roleIds: string[];
        }) => {
          const res = await httpRequest<In_User>(
            getApiUrl(API_ENDPOINTS.USER.INSERT_ROLES(id)),
            {
              method: "PUT",
              body: { role_ids: roleIds },
            },
          );
          return res.data;
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: accessControlKeys.users });
          void qc.invalidateQueries({
            queryKey: accessControlKeys.userDetail(vars.id),
          });
        },
      });
    },
  },
};

const toRoleMutationPayload = (
  values: FormPayloadAccess["Role"],
): In_RoleMutationPayload => {
  const trimmedDesc = values.description?.trim() ?? "";
  return {
    name: values.name.trim(),
    description: trimmedDesc.length > 0 ? trimmedDesc : null,
  };
};

export const roleAccessApi = {
  query: {
    useRolesList: (params?: In_QueryParam) => {
      return useQuery({
        queryKey: accessControlKeys.rolesList(params),
        queryFn: async ({ signal }): Promise<In_PaginatedResult<In_Role>> => {
          const query = new URLSearchParams();
          if (params) {
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
          }
          const endpoint = `${API_ENDPOINTS.ROLE.LIST}${query.size ? `?${query}` : ""}`;
          const res = await httpRequest<unknown>(getApiUrl(endpoint), {
            signal,
          });
          const items = z
            .array(SchemaValidateAccess.roleDetail)
            .parse(res.data);
          const pagination = res.meta?.pagination
            ? SchemaValidateAccess.paginationMeta.parse(res.meta.pagination)
            : null;
          const totalRows =
            res.meta?.total_rows ?? pagination?.total_items ?? items.length;
          return { items, pagination, totalRows };
        },
      });
    },
    useRoleFind: (id: string | null) => {
      return useQuery({
        queryKey: accessControlKeys.roleDetail(id ?? ""),
        queryFn: async ({ signal }): Promise<In_RoleDetail> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.ROLE.FIND(id)),
            { signal },
          );
          return findRoleDetailSchema.parse(res.data);
        },
        enabled: Boolean(id),
      });
    },
  },
  mutation: {
    useCreateRole: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (
          values: FormPayloadAccess["Role"],
        ): Promise<In_Role> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.ROLE.CREATE),
            {
              method: "POST",
              body: toRoleMutationPayload(values),
            },
          );
          const result = SchemaValidateAccess.roleDetail.parse(res.data);
          return result;
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: accessControlKeys.roles });
        },
      });
    },
    useUpdateRole: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async ({
          id,
          values,
        }: {
          id: string;
          values: FormPayloadAccess["Role"];
        }) => {
          const res = await httpRequest<In_Role>(
            getApiUrl(API_ENDPOINTS.ROLE.UPDATE(id)),
            {
              method: "PUT",
              body: toRoleMutationPayload(values),
            },
          );
          return res.data;
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: accessControlKeys.roles });
          void qc.invalidateQueries({
            queryKey: accessControlKeys.roleDetail(vars.id),
          });
        },
      });
    },
    useDeleteRole: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string) => {
          await httpRequest<null>(getApiUrl(API_ENDPOINTS.ROLE.DELETE(id)), {
            method: "DELETE",
          });
        },
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: accessControlKeys.roles });
        },
      });
    },
    useInsertRolePermissions: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async ({
          id,
          permissionIds,
        }: {
          id: string;
          permissionIds: string[];
        }) => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.ROLE.INSERT_PERMISSIONS(id)),
            {
              method: "PUT",
              body: permissionIds,
            },
          );
          return findRoleDetailSchema.parse(res.data);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({ queryKey: accessControlKeys.roles });
          void qc.invalidateQueries({
            queryKey: accessControlKeys.roleDetail(vars.id),
          });
        },
      });
    },
  },
};

const toPermissionMutationPayload = (
  values: FormPayloadAccess["Permission"],
): In_PermissionMutationPayload => {
  const trimmedDesc = values.description?.trim() ?? "";
  return {
    name: values.name.trim(),
    module: values.module.trim(),
    description: trimmedDesc.length > 0 ? trimmedDesc : null,
  };
};

export const permissionAccessApi = {
  query: {
    usePermissionGroups: () => {
      return useQuery({
        queryKey: accessControlKeys.permissionGroups,
        queryFn: async ({ signal }) => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PERMISSION.LIST_GROUP),
            { signal },
          );
          return z
            .array(
              z.object({
                module_name: z.string(),
                permission_items: z.array(
                  z.object({
                    id: z.string(),
                    name: z.string(),
                    description: z
                      .string()
                      .nullable()
                      .optional()
                      .transform((value) => value ?? null),
                    created_at: z.string(),
                    updated_at: z.string(),
                  }),
                ),
              }),
            )
            .parse(res.data);
        },
      });
    },
    usePermissionsList: (params?: In_QueryParam) => {
      return useQuery({
        queryKey: accessControlKeys.permissionsList(params),
        queryFn: async ({
          signal,
        }): Promise<In_PaginatedResult<In_Permission>> => {
          const endpoint = getApiUrl(API_ENDPOINTS.PERMISSION.LIST);
          const searchParams = new URLSearchParams();
          Object.entries(params ?? {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              searchParams.set(key, String(value));
            }
          });
          const queryString = searchParams.toString();
          const res = await httpRequest<unknown>(
            queryString
              ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}${queryString}`
              : endpoint,
            { signal },
          );
          const items = z
            .array(SchemaValidateAccess.permissionDetail)
            .parse(res.data);
          const pagination = res.meta?.pagination
            ? SchemaValidateAccess.paginationMeta.parse(res.meta.pagination)
            : null;
          const totalRows =
            res.meta?.total_rows ?? pagination?.total_items ?? items.length;
          return { items, pagination, totalRows };
        },
      });
    },
    usePermissionFind: (id: string | null) => {
      return useQuery({
        queryKey: accessControlKeys.permissionDetail(id ?? ""),
        queryFn: async ({ signal }): Promise<In_Permission> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PERMISSION.FIND(id)),
            {
              signal,
            },
          );
          return SchemaValidateAccess.permissionDetail.parse(res.data);
        },
        enabled: Boolean(id),
      });
    },
  },
  mutation: {
    useCreatePermission: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (
          values: FormPayloadAccess["Permission"],
        ): Promise<In_Permission> => {
          const res = await httpRequest<In_Permission>(
            getApiUrl(API_ENDPOINTS.PERMISSION.CREATE),
            {
              method: "POST",
              body: toPermissionMutationPayload(values),
            },
          );
          return SchemaValidateAccess.permissionDetail.parse(res.data);
        },
        onSuccess: () => {
          void qc.invalidateQueries({
            queryKey: accessControlKeys.permissions,
          });
        },
      });
    },

    useUpdatePermission: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async ({
          id,
          values,
        }: {
          id: string;
          values: FormPayloadAccess["Permission"];
        }): Promise<In_Permission> => {
          const res = await httpRequest<unknown>(
            getApiUrl(API_ENDPOINTS.PERMISSION.UPDATE(id)),
            {
              method: "PUT",
              body: toPermissionMutationPayload(values),
            },
          );
          return SchemaValidateAccess.permissionDetail.parse(res.data);
        },
        onSuccess: (_data, vars) => {
          void qc.invalidateQueries({
            queryKey: accessControlKeys.permissions,
          });
          void qc.invalidateQueries({
            queryKey: accessControlKeys.permissionDetail(vars.id),
          });
        },
      });
    },

    useDeletePermission: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: async (id: string): Promise<string | undefined> => {
          const res = await httpRequest<null>(
            getApiUrl(API_ENDPOINTS.PERMISSION.DELETE(id)),
            {
              method: "DELETE",
            },
          );
          return res.message;
        },
        onSuccess: () => {
          void qc.invalidateQueries({
            queryKey: accessControlKeys.permissions,
          });
        },
      });
    },
  },
};
