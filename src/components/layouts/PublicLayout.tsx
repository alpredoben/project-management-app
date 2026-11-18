import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, Moon, Sun } from 'lucide-react';
import { PUBLIC_ROUTES } from '@/config/menu-config';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleTheme } from '@/store/slices/ui-slice';
import { cn } from '@/shared/libs/cn';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation();
  const theme = useAppSelector((s) => s.ui.theme);
  const dispatch = useAppDispatch();

  const navItems = PUBLIC_ROUTES.filter((route) => route.showInAuthNav);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white/90">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-6">
          <Link
            to="/login"
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-gray-900 whitespace-nowrap shrink-0 dark:text-white/90"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Layers className="h-4 w-4" />
            </span>
            <span>MILE-DEV</span>
          </Link>

          <nav aria-label="Authentication navigation" className="hidden sm:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-gray-900 dark:hover:text-white',
                    isActive
                      ? 'text-brand-500 dark:text-brand-400'
                      : 'text-gray-600 dark:text-gray-400',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10">
        <div className="grid w-full gap-10 lg:grid-cols-12 lg:items-center">
          <div className="hidden lg:col-span-6 lg:block space-y-6 pr-6">
            <p className="text-xs font-medium text-brand-500 dark:text-brand-400">
              Engineering Project Operations
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900 text-balance dark:text-white/90">
              Coordinate workspaces, milestones, and sprint execution in one console.
            </h1>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              MILE-DEV unifies role-based access control, multi-workspace planning, milestone timelines,
              task scheduling, and deliverable tracking with full REST API coverage.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                  Access & Governance
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Users, Roles, and Permission matrices with token refresh rotation.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                  Delivery Lifecycle
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Workspaces, Projects, Milestones, Task Schedulers, and Attachments.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 dark:border-gray-800 dark:bg-gray-900">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
