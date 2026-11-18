import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Flag,
  FolderKanban,
  GitBranch,
  KeyRound,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Moon,
  Paperclip,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Tag,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import {
  ADMIN_MENU_GROUPS,
  getAllAdminMenuItems,
  getBreadcrumbs,
} from '@/config/menu-config';
import {type T_MenuIconKey} from '@/types/menu-type'
import { authApi } from '@/features/auth/api/auth-api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearSession, setCurrentUser } from '@/store/slices/auth-slice';
import {
  pushToast,
  setSidebarOpen,
  toggleSidebarCollapsed,
  toggleTheme,
} from '@/store/slices/ui-slice';
import { httpRequest } from '@/shared/libs/http';
import { cn } from '@/shared/libs/cn';

const ICON_MAP: Record<T_MenuIconKey, ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  auth: KeyRound,
  users: Users,
  roles: ShieldCheck,
  permissions: SlidersHorizontal,
  workspaces: Layers,
  'workspace-members': UserCheck,
  projects: FolderKanban,
  'project-members': UserCog,
  'project-statuses': GitBranch,
  'project-types': Tag,
  milestones: Flag,
  tasks: CheckSquare,
  'task-types': Tag,
  'task-statuses': ListChecks,
  'task-attachments': Paperclip,
};

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const theme = useAppSelector((s) => s.ui.theme);
  const isSidebarOpen = useAppSelector((s) => s.ui.isSidebarOpen);
  const isSidebarCollapsed = useAppSelector((s) => s.ui.isSidebarCollapsed);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [menuState, setMenuState] = useState(() => ({
    pathname: location.pathname,
    menuQuery: '',
    isSearchOpen: false,
    isUserMenuOpen: false,
  }));
  const activeMenuState = menuState.pathname === location.pathname
    ? menuState
    : { pathname: location.pathname, menuQuery: '', isSearchOpen: false, isUserMenuOpen: false };
  const { menuQuery, isSearchOpen, isUserMenuOpen } = activeMenuState;

  const updateMenuState = (updates: Partial<typeof menuState>) => {
    setMenuState((previous) => ({
      ...(previous.pathname === location.pathname
        ? previous
        : { pathname: location.pathname, menuQuery: '', isSearchOpen: false, isUserMenuOpen: false }),
      ...updates,
      pathname: location.pathname,
    }));
  };
  const setMenuQuery = (menuQuery: string) => updateMenuState({ menuQuery });
  const setIsSearchOpen = (isSearchOpen: boolean) => updateMenuState({ isSearchOpen });
  const setIsUserMenuOpen = (next: boolean | ((previous: boolean) => boolean)) =>
    updateMenuState({
      isUserMenuOpen: typeof next === 'function' ? next(activeMenuState.isUserMenuOpen) : next,
    });

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const meQuery =  authApi.query.useGetProfile(isAuthenticated);

  useEffect(() => {
    if (meQuery.data) {
      dispatch(setCurrentUser(meQuery.data));
    }
  }, [dispatch, meQuery.data]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const allMenuItems = useMemo(() => getAllAdminMenuItems(), []);

  const filteredMenuItems = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    if (!q) return allMenuItems.slice(0, 7);
    return allMenuItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.apiPrefix.toLowerCase().includes(q),
    );
  }, [allMenuItems, menuQuery]);

  const breadcrumbs = getBreadcrumbs(location.pathname);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleLogout = async () => {
    try {
      await httpRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Clear local session even if token already expired
    } finally {
      dispatch(clearSession());
      dispatch(
        pushToast({
          title: 'Signed out',
          description: 'Your session has been terminated.',
          variant: 'info',
        }),
      );
      navigate('/login', { replace: true });
    }
  };

  const renderSidebar = (isMobile = false) => {
    const collapsed = !isMobile && isSidebarCollapsed;

    return (
      <div className="flex h-full flex-col bg-white dark:bg-gray-900">
        {/* TailAdmin Brand Header */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-gray-200 px-5 dark:border-gray-800',
            collapsed ? 'justify-center px-3' : 'justify-between',
          )}
        >
          <Link
            to="/admin"
            onClick={() => dispatch(setSidebarOpen(false))}
            className="flex items-center gap-2.5 text-base font-bold tracking-tight text-gray-900 whitespace-nowrap shrink-0 dark:text-white"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Layers className="h-4 w-4" />
            </span>
            {!collapsed && <span className="font-display text-lg font-bold">MILE-DEV</span>}
          </Link>
          {isMobile && (
            <button
              type="button"
              onClick={() => dispatch(setSidebarOpen(false))}
              aria-label="Close navigation menu"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav
          aria-label="Admin sidebar navigation"
          className="no-scrollbar flex-1 overflow-y-auto px-4 py-5 space-y-5"
        >
          {ADMIN_MENU_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => !item.hidden);
            if (visibleItems.length === 0) return null;
            const isGroupCollapsed = Boolean(collapsedGroups[group.id]);

            return (
              <div key={group.id}>
                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={!isGroupCollapsed}
                    className="mb-2 flex w-full items-center justify-between px-2 text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-pointer"
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-150',
                        isGroupCollapsed && '-rotate-90',
                      )}
                    />
                  </button>
                ) : (
                  <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
                )}

                {(!isGroupCollapsed || collapsed) && (
                  <ul className="space-y-1">
                    {visibleItems.map((item) => {
                      const Icon = ICON_MAP[item.icon];
                      return (
                        <li key={item.id}>
                          <NavLink
                            to={item.path}
                            end={item.path === '/admin'}
                            title={collapsed ? item.label : undefined}
                            onClick={() => dispatch(setSidebarOpen(false))}
                            className={({ isActive }) =>
                              cn(
                                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                                collapsed ? 'justify-center px-2' : 'gap-3',
                                isActive
                                  ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400'
                                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.05] dark:hover:text-white',
                              )
                            }
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Compact Footer Action */}
        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          <button
            type="button"
            onClick={() => void handleLogout()}
            title={collapsed ? 'Sign out' : undefined}
            className={cn(
              'flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 cursor-pointer',
              collapsed ? 'justify-center px-2' : 'gap-3',
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white/90">
      {/* TailAdmin Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden lg:block lg:shrink-0 border-r border-gray-200 transition-[width] duration-200 dark:border-gray-800',
          isSidebarCollapsed ? 'lg:w-[84px]' : 'lg:w-[276px]',
        )}
      >
        <div className="sticky top-0 h-screen">{renderSidebar(false)}</div>
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-gray-950/50 backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) dispatch(setSidebarOpen(false));
          }}
        >
          <aside className="w-[276px] h-full border-r border-gray-200 dark:border-gray-800">
            {renderSidebar(true)}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TailAdmin Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Desktop Sidebar Collapse Toggle */}
            <button
              type="button"
              onClick={() => dispatch(toggleSidebarCollapsed())}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-white cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Mobile Sidebar Open Button */}
            <button
              type="button"
              onClick={() => dispatch(setSidebarOpen(true))}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 lg:hidden dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.04] cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* TailAdmin Command Search Bar */}
            <div ref={searchBoxRef} className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={menuQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setMenuQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredMenuItems[0]) {
                    navigate(filteredMenuItems[0].path);
                    setIsSearchOpen(false);
                  }
                }}
                placeholder="Search modules or routes..."
                aria-label="Search modules or routes"
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-14 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[11px] text-gray-500 sm:inline-block dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                ⌘K
              </kbd>

              {isSearchOpen && (
                <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                  {filteredMenuItems.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      No modules match &ldquo;{menuQuery}&rdquo;.
                    </p>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredMenuItems.map((item) => {
                        const Icon = ICON_MAP[item.icon];
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => {
                                navigate(item.path);
                                setIsSearchOpen(false);
                              }}
                              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer"
                            >
                              <span className="flex min-w-0 items-center gap-2.5">
                                <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                                <span className="truncate text-xs font-medium text-gray-900 dark:text-white/90">
                                  {item.label}
                                </span>
                              </span>
                              <span className="shrink-0 font-mono text-[11px] text-gray-400">
                                {item.path}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls: Theme Toggle + User Profile Dropdown */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-white cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 text-left hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-white/[0.05] cursor-pointer"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover dark:border-gray-700"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                    {(user?.name ?? 'SA').slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:block max-w-[140px] truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.name ?? 'Loading...'}
                </span>
                <ChevronDown
                  className={cn(
                    'hidden sm:block h-4 w-4 text-gray-400 transition-transform duration-150',
                    isUserMenuOpen && 'rotate-180',
                  )}
                />
              </button>

              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="border-b border-gray-100 px-2 pb-3 dark:border-gray-800">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white/90">
                      {user?.name ?? 'Authenticated User'}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {user?.email ?? ''}
                    </p>
                    {user?.roles[0]?.name && (
                      <p className="mt-1 text-xs font-medium text-brand-500 dark:text-brand-400">
                        {user.roles[0].name}
                      </p>
                    )}
                  </div>

                  <div className="py-1.5 space-y-0.5">
                    <Link
                      to="/admin/auth"
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
                    >
                      <KeyRound className="h-4 w-4 text-gray-400" />
                      <span>Auth & Session Profile</span>
                    </Link>
                    <Link
                      to="/admin/tasks"
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
                    >
                      <CheckSquare className="h-4 w-4 text-gray-400" />
                      <span>Tasks & Scheduler</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 pt-1.5 dark:border-gray-800">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleLogout()}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* TailAdmin Breadcrumb Bar */}
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${index}`}>
                  {index > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  )}
                  {crumb.path && !isLast ? (
                    <Link
                      to={crumb.path}
                      className="font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        isLast
                          ? 'font-medium text-gray-900 dark:text-white/90'
                          : 'text-gray-500 dark:text-gray-400',
                      )}
                    >
                      {crumb.label}
                    </span>
                  )}
                </Fragment>
              );
            })}
          </nav>

          {children}
        </main>
      </div>
    </div>
  );
}
