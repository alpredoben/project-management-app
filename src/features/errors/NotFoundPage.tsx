import { useAppSelector } from "@/store/hooks";
import {Link} from "react-router-dom";

export function NotFoundPage() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <p className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400">
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Page not found
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        The requested route is not registered in menu-config.ts.
      </p>
      <Link
        to={isAuthenticated ? "/admin" : "/login"}
        className="mt-5 inline-flex h-9 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
      >
        {isAuthenticated ? "Return to Dashboard" : "Return to Sign In"}
      </Link>
    </div>
  );
}