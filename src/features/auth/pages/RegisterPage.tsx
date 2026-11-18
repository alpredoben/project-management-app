import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/ui-slice';
import { authApi } from '../api/auth-api';
import { SchemaValidateAuth, type FormPayloadAuth } from '../schemas/auth-schema';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const registerMutation = authApi.mutation.useRegister();
  const [verificationPath, setVerificationPath] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormPayloadAuth['Register']>({
    resolver: zodResolver(SchemaValidateAuth.register),
    defaultValues: {
      name: '',
      email: '',
      nip: '',
      phone_number: '',
      password: '',
      confirm_password: ''
    },
  });

  const onSubmit = async (values: FormPayloadAuth['Register']) => {
    try {
      const result = await registerMutation.mutateAsync(values);
      setVerificationPath(result.verification_path);
      dispatch(
        pushToast({
          title: 'Registration complete',
          description: 'Please verify your email address before signing in.',
          variant: 'success',
        }),
      );
    } catch (err) {
      dispatch(
        pushToast({
          title: 'Registration failed',
          description: err instanceof Error ? err.message : 'Unable to register account.',
          variant: 'error',
        }),
      );
    }
  };

  if (verificationPath) {
    return (
      <div className="space-y-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Verify your email address
          </h2>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Your account has been created. Open the verification link below to activate your account via{' '}
            <span className="font-mono">GET /auth/verified-email</span>.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Email verification link
          </p>
          <Link
            to={verificationPath}
            className="mt-1 block break-all font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            {verificationPath}
          </Link>
        </div>
        <Link
          to={verificationPath}
          className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          Verify Email Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Create an account
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Join MILE-DEV to collaborate on workspaces, milestones, and sprint tasks.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full name"
          placeholder="Enter your full name..."
          error={errors.name?.message}
          required
          {...register('name')}
        />
        <Input
          label="NIP"
          placeholder="Enter your nip..."
          error={errors.nip?.message}
          required
          {...register('nip')}
        />
        <Input
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address..."
          error={errors.email?.message}
          required
          {...register('email')}
        />
        <Input
          label="Job title"
          placeholder="Enter your phone number..."
          error={errors.phone_number?.message}
          required
          {...register('phone_number')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimum 6 characters"
          error={errors.password?.message}
          required
          {...register('password')}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Minimum 6 characters"
          error={errors.confirm_password?.message}
          required
          {...register('confirm_password')}
        />
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={registerMutation.isPending}
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
