import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { authApi } from '../api/auth-api';

export function VerifiedEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { data, isLoading, error } = authApi.query.useVerifyEmail(token);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Missing verification token
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Open the full verification link sent during registration, including the token parameter.
        </p>
        <Link
          to="/login"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 py-6 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Verifying your email address...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Verification failed
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error.message}</p>
        <Link
          to="/register"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Register Again
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        Email verified successfully
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {data?.user.email} is now active. You can sign in to the MILE-DEV admin console.
      </p>
      <Link
        to="/login"
        className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
      >
        Continue to Sign In
      </Link>
    </div>
  );
}
