import { API_BASE_URL } from "./env-config";

const pathById = (path: string, id: string | null):string => {
    return `${path}/${id}`
}

export const API_ENDPOINTS  = {
    AUTH: {
        LOGIN: 'auth/login',
        REGISTER: 'auth/register',
        FORGOT_PASSWORD: 'auth/forgot-password',
        VERIFY_EMAIL: (token: string) =>  `auth/verified-email?token=${token}`,
        REFRESH_TOKEN: 'auth/refresh-token',
        RESET_PASSWORD: 'auth/reset-password',
        LOGOUT: 'auth/logout',
        PROFILE: 'auth/me' 
    },
    ROLE: {
        LIST: 'role/list',
        FIND: (id: string | null) => pathById('role/find', id),
        CREATE: 'role/create',
        UPDATE: (id: string | null) => pathById('role/update', id),
        DELETE: (id: string | null) => pathById('role/delete', id),
        INSERT_PERMISSIONS: (id: string | null) => `role/${id}/insert-permissions`
    },
    PERMISSION: {
        LIST: 'permission/list',
        LIST_GROUP: 'permission/list-group',
        FIND: (id: string | null) => pathById('permission/find', id),
        CREATE: 'permission/create',
        UPDATE: (id: string | null) => pathById('permission/update', id),
        DELETE: (id: string | null) => pathById('permission/delete', id),
    },
    USER: {
        LIST: 'user/list',
        FIND: (id: string | null) => pathById('user/find', id),
        CREATE: 'user/create',
        UPDATE: (id: string | null) => pathById('user/update', id),
        DELETE: (id: string | null) => pathById('user/delete', id),
        INSERT_ROLES: (id: string | null) => `user/${id}/insert-roles`
    },
    PROJECT_TYPE: {
        LIST: 'project-types/list',
        FIND: (id: string | null) => pathById('project-types/find', id),
        CREATE: 'project-types/create',
        UPDATE: (id: string | null) => pathById('project-types/update', id),
        DELETE: (id: string | null) => pathById('project-types/delete', id),
    },
    PROJECT_STATUS: {
        LIST: 'project-status/list',
        FIND: (id: string | null) => pathById('project-status/find', id),
        CREATE: 'project-status/create',
        UPDATE: (id: string | null) => pathById('project-status/update', id),
        DELETE: (id: string | null) => pathById('project-status/delete', id),
    },
    WORKSPACE: {
        LIST: 'workspace/list',
        FIND: (id: string | null) => pathById('workspace/find', id),
        CREATE: 'workspace/create',
        UPDATE: (id: string | null) => pathById('workspace/update', id),
        DELETE: (id: string | null) => pathById('workspace/delete', id),
    }
} as const;

export const getApiUrl = (endpoint: string): string => {
    return `${API_BASE_URL}/${endpoint}` as string
}