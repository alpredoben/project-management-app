import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/FormControls";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { RecordInspectorDrawer } from "@/components/ui/RecordInspectorDrawer";
import { useAppDispatch } from "@/store/hooks";
import { pushToast } from "@/store/slices/ui-slice";
import type { In_User } from "@/types/api-type";
import { userAccessApi, roleAccessApi } from "../api/access-control-api";
import {
  SchemaValidateAccess,
  type FormPayloadAccess,
} from "../schemas/access-control-schema";
import { API_ENDPOINTS, getApiUrl } from "@/config/api-config";

export function UsersPage() {
  const dispatch = useAppDispatch();

  // Form and Action
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<In_User | null>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<In_User | null>(null);
  const [roleTargetUser, setRoleTargetUser] = useState<In_User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Query and Mutation
  const usersQuery = userAccessApi.query.useUsersList();
  const findQuery = userAccessApi.query.useUserFind(inspectId);
  const rolesQuery = roleAccessApi.query.useRolesList({ page: 1, limit: 100 });
  const createMutation = userAccessApi.mutation.useCreateUser();
  const updateMutation = userAccessApi.mutation.useUpdateUser();
  const deleteMutation = userAccessApi.mutation.useDeleteUser();
  const insertRolesMutation = userAccessApi.mutation.useInsertUserRoles();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormPayloadAccess["User"]>({
    resolver: zodResolver(SchemaValidateAccess.user),
    defaultValues: {
      name: "",
      nip: "",
      phone_number: "",
      email: "",
      password: "",
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    reset({
      name: "",
      nip: "",
      phone_number: "",
      email: "",
      password: "",
    });
    setIsFormOpen(true);
  };

  const openEditModal = (user: In_User) => {
    setEditingUser(user);
    reset({
      name: user.name,
      nip: user.nip,
      email: user.email,
      phone_number: user.phone_number,
      password: "",
    });
    setIsFormOpen(true);
  };

  const openRolesModal = (user: In_User) => {
    setRoleTargetUser(user);
    setSelectedRoleIds(user.role_ids ?? []);
  };

  const onSubmit = async (values: FormPayloadAccess['User']) => {
    try {
      if (editingUser) {
        await updateMutation.mutateAsync({ id: editingUser.id, values });
        dispatch(
          pushToast({
            title: "User updated",
            description: values.name,
            variant: "success",
          }),
        );
      } else {
        await createMutation.mutateAsync(values);
        dispatch(
          pushToast({
            title: "User created",
            description: values.name,
            variant: "success",
          }),
        );
      }
      setIsFormOpen(false);
    } catch (err) {
      dispatch(
        pushToast({
          title: "Save failed",
          description:
            err instanceof Error ? err.message : "Unable to save user.",
          variant: "error",
        }),
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteMutation.mutateAsync(deletingUser.id);
      dispatch(
        pushToast({
          title: "User deleted",
          description: deletingUser.email,
          variant: "info",
        }),
      );
      setDeletingUser(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: "Delete failed",
          description:
            err instanceof Error ? err.message : "Unable to delete user.",
          variant: "error",
        }),
      );
    }
  };

  const handleSaveRoles = async () => {
    if (!roleTargetUser) return;
    try {
      await insertRolesMutation.mutateAsync({
        id: roleTargetUser.id,
        roleIds: selectedRoleIds,
      });
      dispatch(
        pushToast({
          title: "Roles assigned",
          description: `Updated roles for ${roleTargetUser.name}.`,
          variant: "success",
        }),
      );
      setRoleTargetUser(null);
    } catch (err) {
      dispatch(
        pushToast({
          title: "Role assignment failed",
          description:
            err instanceof Error ? err.message : "Unable to assign roles.",
          variant: "error",
        }),
      );
    }
  };

  const toggleRoleId = (id: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const columns: DataTableColumn<In_User>[] = [
    {
      key: "user_name",
      header: "User",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {row.name}
          </p>
        </div>
      ),
    },
    {
      key: "user_email",
      header: "User",
      render: (row) => (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {row.email}
          </p>
        </div>
      ),
    },
    {
      key: "user_phone",
      header: "User",
      render: (row) => (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {row.phone_number}
          </p>
        </div>
      ),
    },
    {
      key: "user_roles",
      header: "Roles",
      render: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {row.roles?.map((r) => r.name).join(" · ") || "Unassigned"}
        </span>
      ),
    },
    {
      key: "user_status",
      header: "Status",
      render: (row) => (
        <span
          className={
            row.is_active
              ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
              : "text-xs font-medium text-slate-400"
          }
        >
          {row.is_active ? "Active" : "Disabled"} ·{" "}
        </span>
      ),
    },
    {
      key: "user_email_status",
      header: "Status",
      render: (row) => (
        <span
          className={
            row.is_active
              ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
              : "text-xs font-medium text-slate-400"
          }
        >
          {row.is_email_verified ? "Verified" : "Unverified"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInspectId(row.id)}
            title="Find by ID"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openRolesModal(row)}
            title="Insert roles"
          >
            <Shield className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            title="Edit user"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingUser(row)}
            title="Delete user"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Directory"
        description="Manage engineering user accounts, inspect user payloads, and assign RBAC roles."
        apiPrefix="/api/v1/user · list · create · find/:id · update/:id · delete/:id · :id/insert-roles"
        actions={
          <Button variant="primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Create User
          </Button>
        }
      />

      <DataTable
        data={usersQuery.data ?? []}
        columns={columns}
        getRowKey={(row) => row.id}
        isLoading={usersQuery.isLoading}
        error={usersQuery.error}
        onRetry={() => void usersQuery.refetch()}
        searchPlaceholder="Search users by name, email or phone number..."
        searchFilter={(row, q) =>
          row.name.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.phone_number.toLowerCase().includes(q)
        }
        emptyTitle="No users found"
        emptyAction={
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            Create First User
          </Button>
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingUser ? "Update User" : "Create User"}
        description={
          editingUser
            ? `[PUT] ${getApiUrl(API_ENDPOINTS.USER.UPDATE(editingUser.id))}`
            : `[POST] ${getApiUrl(API_ENDPOINTS.USER.CREATE)}`
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="user-form"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingUser ? "Save Changes" : "Create User"}
            </Button>
          </>
        }
      >
        <form
          id="user-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <Input
            label="Full name"
            error={errors.name?.message}
            required
            {...register("name")}
          />

          <Input
            label="NIP"
            error={errors.nip?.message}
            required
            {...register("nip")}
          />

          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            required
            {...register("email")}
          />
          <Input
            label="Job title"
            error={errors.phone_number?.message}
            required
            {...register("phone_number")}
          />
          {!editingUser && (
            <Input
              label="Initial password"
              type="password"
              placeholder="Defaults to Password123! if empty"
              error={errors.password?.message}
              {...register("password")}
            />
          )}
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(roleTargetUser)}
        onClose={() => setRoleTargetUser(null)}
        title={`Assign Roles — ${roleTargetUser?.name ?? ""}`}
        description={
          roleTargetUser
            ? `PUT ${getApiUrl(API_ENDPOINTS.USER.INSERT_ROLES(roleTargetUser.id))}`
            : ""
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setRoleTargetUser(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSaveRoles()}
              isLoading={insertRolesMutation.isPending}
            >
              Save Role Assignment
            </Button>
          </>
        }
      >
        <div className="space-y-2.5">
          {(rolesQuery.data?.items ?? []).map((role) => (
            <label
              key={role.id}
              className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedRoleIds.includes(role.id)}
                onChange={() => toggleRoleId(role.id)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white/90">
                  {role.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {role.description ?? role.slug}
                </p>
              </div>
            </label>
          ))}
        </div>
      </Modal>

      <RecordInspectorDrawer
        isOpen={Boolean(inspectId)}
        onClose={() => setInspectId(null)}
        title="User Record Detail"
        endpoint={inspectId ? `GET /api/v1/user/find/${inspectId}` : ""}
        isLoading={findQuery.isLoading}
        error={findQuery.error}
        record={findQuery.data}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete User"
        description={`Remove ${deletingUser?.name ?? ""} (${deletingUser?.email ?? ""}) via DELETE ${getApiUrl(API_ENDPOINTS.USER.DELETE(deletingUser?.id ?? ""))}?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
