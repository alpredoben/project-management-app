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
    PROJECT: {
        LIST: 'projects/list',
        FIND: (id: string | null) => pathById('projects/find', id),
        CREATE: 'projects/create',
        UPDATE: (id: string | null) => pathById('projects/update', id),
        DELETE: (id: string | null) => pathById('projects/delete', id),
        CHANGE_STATUS: (id: string | null) => `project/${id}/change-status`,
        CHANGE_TYPE: (id: string | null) => `project/${id}/change-type`,
    },
    MILESTONE: {
        LIST: 'milestone/list',
        FIND: (id: string | null) => pathById('milestone/find', id),
        CREATE: 'milestone/create',
        UPDATE: (id: string | null) => pathById('milestone/update', id),
        DELETE: (id: string | null) => pathById('milestone/delete', id),
    },
    WORKSPACE: {
        LIST: 'workspace/list',
        FIND: (id: string | null) => pathById('workspace/find', id),
        CREATE: 'workspace/create',
        UPDATE: (id: string | null) => pathById('workspace/update', id),
        DELETE: (id: string | null) => pathById('workspace/delete', id),
    },
    TASK_STATUS: {
        LIST: 'task-status/list',
        FIND: (id: string | null) => pathById('task-status/find', id),
        CREATE: 'task-status/create',
        UPDATE: (id: string | null) => pathById('task-status/update', id),
        DELETE: (id: string | null) => pathById('task-status/delete', id),
    },
    TASK_TYPE: {
        LIST: 'task-type/list',
        FIND: (id: string | null) => pathById('task-type/find', id),
        CREATE: 'task-type/create',
        UPDATE: (id: string | null) => pathById('task-type/update', id),
        DELETE: (id: string | null) => pathById('task-type/delete', id),
    },
    POSITION: {
        LIST: 'position/list',
        FIND: (id: string | null) => pathById('position/find', id),
        CREATE: 'position/create',
        UPDATE: (id: string | null) => pathById('position/update', id),
        DELETE: (id: string | null) => pathById('position/delete', id),
    },
    WORKSPACE_MEMBERS: {
        LIST: 'workspace-members/list',
        FIND: (id: string | null) => pathById('workspace-members/find', id),
        CREATE: 'workspace-members/create',
        UPDATE: (id: string | null) => pathById('workspace-members/update', id),
        DELETE: (id: string | null) => pathById('workspace-members/delete', id),
    },
} as const;

export const getApiUrl = (endpoint: string): string => {
    return `${API_BASE_URL}/${endpoint}` as string
}