import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import type { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { useAppDispatch } from '@/store/hooks';
import { clearSession, setPendingTokens, setSession } from '@/store/slices/auth-slice';
import { pushToast } from '@/store/slices/ui-slice';
import { authApi, authKeys, fetchAuthMe } from '../api/auth-api';
import { SchemaValidateAuth, type FormPayloadAuth } from '../schemas/auth-schema';

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const loginMutation = authApi.mutation.useLogin();
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<
    z.input<typeof SchemaValidateAuth.login>,
    unknown,
    FormPayloadAuth['Login']
  >({
    resolver: zodResolver(SchemaValidateAuth.login),
    defaultValues: {
      email: '',
      password: '',
      remember_me: false
    },
  });

  const onSubmit = async (values: FormPayloadAuth['Login']) => {
    try {
      const tokens = await loginMutation.mutateAsync(values);
      dispatch(setPendingTokens(tokens));

      setIsFetchingProfile(true);
      queryClient.removeQueries({ queryKey: authKeys.me() });
      const profile = await queryClient.fetchQuery({
        queryKey: authKeys.me(),
        queryFn: ({ signal }) => fetchAuthMe(signal),
        staleTime: 0,
      });

      dispatch(setSession({ ...tokens, user: profile }));

      dispatch(
        pushToast({
          title: 'Welcome back',
          description: `Signed in as ${profile.name}`,
          variant: 'success',
        }),
      );
      navigate('/admin', { replace: true });
    } catch (err) {
      dispatch(clearSession());
      dispatch(
        pushToast({
          title: 'Sign in failed',
          description: err instanceof Error ? err.message : 'Unable to authenticate.',
          variant: 'error',
        }),
      );
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const isSubmitting = loginMutation.isPending || isFetchingProfile;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-display text-xl font-bold tracking-tight text-gray-900 dark:text-white/90">
          Sign in to MILE-DEV
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Enter your workspace credentials to open the admin console.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="superadmin@system.com"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            required
            {...register('password')}
          />
          <div className="flex justify-end pt-0.5">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-brand-500 hover:underline dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isSubmitting}
        >
          {isFetchingProfile ? 'Loading profile...' : 'Sign In'}
        </Button>
      </form>

      <div className="border-t border-gray-200 pt-4 space-y-3 dark:border-gray-800">
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          New to MILE-DEV?{' '}
          <Link
            to="/register"
            className="font-medium text-brand-500 hover:underline dark:text-brand-400"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
