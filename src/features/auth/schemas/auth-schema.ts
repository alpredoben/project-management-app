import { z } from 'zod';

const permissionItem = z.object({
    id: z.string(),
    name: z.string(),
})

export const SchemaValidateAuth = {
    login: z.object({
        email: z.string().email('Enter a valid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        remember_me: z.boolean().default(false)
    }),
    register: z.object({
        name: z.string().min(2, 'Full name must be at least 2 characters'),
        nip: z.string().min(2, 'Nip must be at least 2 characters'),
        email: z.string().email('Enter a valid email address'),
        phone_number: z.string().max(20, 'Phone number must be 20 max characters'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirm_password: z.string().min(6, 'Confirm Password must be at least 6 characters'),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: 'Passwords do not match',
        path: ['confirm_password'],
    }),
    forgotPassword: z.object({
        email: z.string().email('Enter a valid email address'),
    }),
    resetPassword: z.object({
        token: z.string().min(4, 'Reset token is required'),
        new_password: z.string().min(6, 'New password must be at least 6 characters'),
        confirm_password: z.string().min(6, 'Confirm your new password'),
    }).refine((data) => data.new_password === data.confirm_password, {
        message: 'Passwords do not match',
        path: ['confirm_password'],
    }),
    authToken: z.object({
        token_type: z.string().min(1).default('Bearer'),
        access_token: z.string().min(1),
        refresh_token: z.string().min(1),
    }),
    authPermissionItem: permissionItem,
    authRoleItem:  z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string().nullable().transform((value) => value ?? ''),
        permissions: z.array(permissionItem).default([]),
    }),
} as const;


export const authProfileSchema =  z.object({
    id: z.string(),
    name: z.string().nullable().transform((value) => value ?? ''),
    nip: z.string().nullable().optional().transform((v) => v ?? null),
    email: z.string().email(),
    phone_number: z.string().nullable().optional().transform((v) => v ?? ''),
    avatar: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    is_active: z.boolean(),
    is_email_verified: z.boolean(),
    is_login: z.boolean(),
    last_login_at: z.string().nullable().optional().transform((v) => v ?? null),
    roles: z.array(SchemaValidateAuth.authRoleItem).default([]),
    permissions: z.array(SchemaValidateAuth.authPermissionItem).default([]),
}).transform(({ avatar, avatar_url, ...profile }) => ({
    ...profile,
    avatar_url: avatar_url ?? avatar ?? null,
}));

export type FormPayloadAuth = {
  Login: z.infer<typeof SchemaValidateAuth.login>; 
  Register: z.infer<typeof SchemaValidateAuth.register>;
  ForgotPassword: z.infer<typeof SchemaValidateAuth.forgotPassword>;
  ResetPassword: z.infer<typeof SchemaValidateAuth.resetPassword>;
};


