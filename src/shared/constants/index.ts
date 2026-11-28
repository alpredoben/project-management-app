export const STORAGE_KEY = {
    AUTH: `MILE_APP_STORAGE_AUTH_SESSION`
} as const;

export const ROUTE_PATH_LIST = {
    AUTH: {
        LOGIN: 'login',
        REGISTER: 'register',
        FORGOT_PASSWORD: 'forgot-password',
        RESET_PASSWORD: 'reset-password',
        VERIFY_EMAIL: 'auth/verified-email'
    },
    OVERVIEW: {
        DASHBOARD: 'admin',
        AUTH_SESSION: 'admin/auth'
    },
    WORKSPACE: {
        WORKSPACE: 'admin/workspace',
        WORKSPACE_DETAIL: (id: string = ':id') => `admin/workspace/${id}`,
        WORKSPACE_MEMBERS: 'admin/workspace-members',
        WORKSPACE_MEMBERS_DETAIL: (id: string = ':id') => `admin/workspace-members/${id}`,
    },
    PROJECT: {
        PROJECT: 'admin/projects',
        PROJECT_DETAIL: (id: string = ':id') => `admin/projects/${id}`,
        TASK_TRACKING: (id: string = ':id') => `admin/projects/${id}/task-tracking`,
        MILESTONE: 'admin/milestones',
        MILESTONE_DETAIL: (id: string = ':id') => `admin/milestones/${id}`,
    },
    MILESTONE: {
        MILESTONE: 'admin/milestones',
        MILESTONE_DETAIL: (id: string = ':id') => `admin/milestones/${id}`,
    },
    TASK: {
        TASK: 'admin/tasks',
        TASK_DETAIL: (id: string = ':id') => `admin/tasks/${id}`,
    },
    ACCESS_CONTROL: {
        USER: 'admin/users',
        ROLE: 'admin/roles',
        ROLE_PERMISSION: (id: string = ':id') => `admin/roles/${id}/permissions`,
        PERMISSION: 'admin/permissions'
    },
    MASTER_DATA: {
        PROJECT_TYPE: 'admin/project-type',
        PROJECT_TYPE_DETAIL: (id: string = ':id') => `admin/project-type/${id}`,
        PROJECT_STATUS: 'admin/project-status',
        PROJECT_STATUS_DETAIL: (id: string = ':id') => `admin/project-status/${id}`,
        TASK_STATUS: 'admin/task-status',
        TAKS_STATUS_DETAIL: (id: string = ':id') => `admin/task-status/${id}`,
        TASK_TYPE: 'admin/task-type',
        TASK_TYPE_DETAIL: (id: string = ':id') => `admin/task-type/${id}`,
        POSITION: 'admin/position',
        POSITION_DETAIL: (id: string = ':id') => `admin/position/${id}`,
    }
} as const;
