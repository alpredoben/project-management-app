import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import { authApi } from '../api/auth-api';
import {
  SchemaValidateAuth,
  type FormPayloadAuth,
} from '../schemas/auth-schema';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const resetMutation = authApi.mutation.useResetPassword();

  const initialToken = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormPayloadAuth['ResetPassword']>({
    resolver: zodResolver(SchemaValidateAuth.resetPassword),
    defaultValues: {
      token: initialToken,
      new_password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (values: FormPayloadAuth['ResetPassword']) => {
    try {
      await resetMutation.mutateAsync({
        token: values.token,
        new_password: values.new_password,
        confirm_password: values.confirm_password
      });
      dispatch(
        pushToast({
          title: 'Password updated',
          description: 'You can now sign in with your new password.',
          variant: 'success',
        }),
      );
      navigate('/login', { replace: true });
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Reset failed',
          description: err instanceof Error ? err.message : 'Unable to reset password.',
          variant: 'error',
        }),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Reset password
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Provide your reset token and choose a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Reset token"
          placeholder="rst_..."
          error={errors.token?.message}
          required
          {...register('token')}
        />
        <Input
          label="New password"
          type="password"
          placeholder="Minimum 6 characters"
          error={errors.new_password?.message}
          required
          {...register('new_password')}
        />
        <Input
          label="Confirm new password"
          type="password"
          placeholder="Re-enter password"
          error={errors.confirm_password?.message}
          required
          {...register('confirm_password')}
        />
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={resetMutation.isPending}
        >
          Update Password
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
