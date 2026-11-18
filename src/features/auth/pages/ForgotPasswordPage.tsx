import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import { authApi } from '../api/auth-api';
import {
  SchemaValidateAuth,
  type FormPayloadAuth
} from '../schemas/auth-schema';

export function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const forgotMutation = authApi.mutation.useForgotPassword();
  const [resetPath, setResetPath] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormPayloadAuth['ForgotPassword']>({
    resolver: zodResolver(SchemaValidateAuth.forgotPassword),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormPayloadAuth['ForgotPassword']) => {
    try {
      const data = await forgotMutation.mutateAsync(values);
      setResetPath(data.reset_path);
      setSubmitted(true);
      dispatch(
        pushToast({
          title: 'Reset request processed',
          description: 'If the email exists, a reset token has been generated.',
          variant: 'info',
        }),
      );
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Request failed',
          description: err instanceof Error ? err.message : 'Unable to send reset link.',
          variant: 'error',
        }),
      );
    }
  };

  if (submitted) {
    return (
      <div className="space-y-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
          <MailCheck className="h-5 w-5" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Password reset ready
          </h2>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Use the reset link below to configure a new password for your account.
          </p>
        </div>

        {resetPath ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Reset Password Link
              </p>
              <Link
                to={resetPath}
                className="mt-1 block break-all font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                {resetPath}
              </Link>
            </div>
            <Link
              to={resetPath}
              className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              Continue to Reset Password
            </Link>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            If that email address matches an account, check your inbox for instructions.
          </p>
        )}

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Return to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Forgot password
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enter the email associated with your MILE-DEV account to generate a reset token.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Registered email"
          type="email"
          placeholder="admin@miledev.io"
          error={errors.email?.message}
          required
          {...register('email')}
        />
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={forgotMutation.isPending}
        >
          Send Reset Link
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Remembered your password?{' '}
        <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
