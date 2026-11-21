/* eslint-disable react-hooks/exhaustive-deps */
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
  Bell,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Flag,
  FolderKanban,
  GitBranch,
  Home,
  KeyRound,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Maximize2,
  Menu,
  Minimize2,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
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
import { type T_MenuIconKey } from '@/types/menu-type';
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

// ─── Icon Map ─────────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminLayoutProps {
  children: ReactNode;
}

// ─── Helper: Initials ─────────────────────────────────────────────────────────

function getInitials(name?: string | null): string {
  if (!name) return 'SA';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

// ─── Nav Item Component ───────────────────────────────────────────────────────

interface SidebarNavItemProps {
  item: {
    id: string;
    path: string;
    label: string;
    icon: T_MenuIconKey;
    description?: string;
  };
  collapsed: boolean;
  onNavigate: () => void;
}

function SidebarNavItem({ item, collapsed, onNavigate }: SidebarNavItemProps) {
  const Icon = ICON_MAP[item.icon] ?? Layers;

  return (
    <li className="relative group/navitem list-none">
      <NavLink
        to={item.path}
        end={item.path === '/admin'}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center rounded-xl text-sm font-medium select-none',
            'transition-all duration-200 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
            collapsed
              ? 'h-11 w-11 mx-auto justify-center'
              : 'px-3 py-2.5 gap-3 w-full',
            isActive
              ? [
                  'bg-linear-to-r from-brand-500 to-brand-600 text-white',
                  'shadow-lg shadow-brand-500/25 dark:shadow-brand-500/20',
                  'font-semibold',
                ]
              : [
                  'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80',
                  'dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/6',
                  !collapsed && 'hover:translate-x-1',
                ],
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Left accent bar on active when expanded */}
            {!collapsed && isActive && (
              <span className="absolute -left-2 top-2 bottom-2 w-1 rounded-r-full bg-brand-400 shadow-sm" />
            )}

            {/* Icon */}
            <span
              className={cn(
                'flex shrink-0 items-center justify-center transition-transform duration-200',
                'group-hover/navitem:scale-110',
                isActive
                  ? 'text-white'
                  : 'text-gray-500 group-hover/navitem:text-gray-800 dark:text-gray-400 dark:group-hover/navitem:text-gray-200',
              )}
            >
              <Icon className="h-5 w-5" />
            </span>

            {/* Label */}
            {!collapsed && (
              <span className="truncate leading-none tracking-tight">
                {item.label}
              </span>
            )}

            {/* Active dot when collapsed */}
            {collapsed && isActive && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-300 ring-2 ring-white dark:ring-gray-900" />
            )}
          </>
        )}
      </NavLink>

      {/* Floating Tooltip when Sidebar is Collapsed */}
      {collapsed && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50',
            'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium',
            'bg-gray-900 text-white shadow-xl shadow-gray-950/20',
            'dark:bg-gray-800 dark:text-gray-100 dark:border dark:border-gray-700/60',
            'opacity-0 -translate-x-2 group-hover/navitem:opacity-100 group-hover/navitem:translate-x-0',
            'transition-all duration-150 ease-out',
          )}
        >
          <div className="font-semibold">{item.label}</div>
          {item.description && (
            <div className="text-[10px] text-gray-400 dark:text-gray-400 font-normal max-w-45 truncate">
              {item.description}
            </div>
          )}
          {/* Tooltip arrow */}
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-gray-900 dark:border-r-gray-800" />
        </div>
      )}
    </li>
  );
}

// ─── Main AdminLayout Component ───────────────────────────────────────────────

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const theme = useAppSelector((s) => s.ui.theme);
  const isSidebarOpen = useAppSelector((s) => s.ui.isSidebarOpen);
  const isSidebarCollapsed = useAppSelector((s) => s.ui.isSidebarCollapsed);

  // ── Local States ────────────────────────────────────────────────────────────
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [menuQuery, setMenuQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile drawer animation state
  const [mobileVisible, setMobileVisible] = useState(false);
  const [mobileAnimating, setMobileAnimating] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  // ── User Profile Sync ──────────────────────────────────────────────────────
  const meQuery = authApi.query.useGetProfile(isAuthenticated);
  useEffect(() => {
    if (meQuery.data) {
      dispatch(setCurrentUser(meQuery.data));
    }
  }, [dispatch, meQuery.data]);

  // ── Scroll Detector for Topbar Elevation ───────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Mobile Sidebar Open/Close Smooth Transitions ───────────────────────────
  useEffect(() => {
    let openFrame1: number | undefined;
    let openFrame2: number | undefined;

    if (isSidebarOpen) {
      openFrame1 = requestAnimationFrame(() => {
        setMobileVisible(true);
        openFrame2 = requestAnimationFrame(() => setMobileAnimating(true));
      });
    } else {
      const closeFrame = requestAnimationFrame(() => setMobileAnimating(false));
      const timer = window.setTimeout(() => setMobileVisible(false), 300);

      return () => {
        cancelAnimationFrame(closeFrame);
        window.clearTimeout(timer);
      };
    }

    return () => {
      if (openFrame1 !== undefined) cancelAnimationFrame(openFrame1);
      if (openFrame2 !== undefined) cancelAnimationFrame(openFrame2);
    };
  }, [isSidebarOpen]);

  // ── Close dropdowns on route changes ───────────────────────────────────────
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsSearchOpen(false);
      setIsUserMenuOpen(false);
      setIsNotificationsOpen(false);
      setMenuQuery('');
    });

    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  // ── Keyboard Shortcuts & Outside Clicks ────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  // ── Fullscreen Toggle ──────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── Menu Filter ────────────────────────────────────────────────────────────
  const allMenuItems = useMemo(() => getAllAdminMenuItems(), []);
  const filteredMenuItems = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    if (!q) return allMenuItems.slice(0, 8);
    return allMenuItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.apiPrefix.toLowerCase().includes(q),
    );
  }, [allMenuItems, menuQuery]);

  const breadcrumbs = getBreadcrumbs(location.pathname);

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await httpRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Clear local session even if token expired
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

  const userInitials = getInitials(user?.name);

  // ── Sidebar Inner Renderer ─────────────────────────────────────────────────
  const renderSidebar = (isMobile = false) => {
    const collapsed = !isMobile && isSidebarCollapsed;

    return (
      <div className="flex h-full flex-col bg-white dark:bg-[#0f1117] select-none">
        {/* ── Brand Header ──────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-gray-100 dark:border-gray-800/80',
            'transition-[padding] duration-200',
            collapsed ? 'justify-center px-2' : 'justify-between px-5',
          )}
        >
          <Link
            to="/admin"
            onClick={() => dispatch(setSidebarOpen(false))}
            className="flex items-center gap-3 group/brand shrink-0"
          >
            {/* Glowing Brand Icon */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-brand-600 via-brand-500 to-indigo-500 text-white shadow-md shadow-brand-500/25 transition-transform duration-300 group-hover/brand:scale-105">
              <Layers className="h-5 w-5" />
              {/* Online pulse dot */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
              </span>
            </div>

            {/* Brand Title */}
            {!collapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold tracking-tight text-gray-900 dark:text-white">
                    MILE-DEV
                  </span>
                  <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                    PM
                  </span>
                </div>
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 truncate">
                  Enterprise Workspace
                </p>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          {isMobile && (
            <button
              type="button"
              onClick={() => dispatch(setSidebarOpen(false))}
              aria-label="Close navigation drawer"
              className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ── Navigation Links ──────────────────────────────────────────── */}
        <nav
          aria-label="Admin sidebar navigation"
          className="no-scrollbar flex-1 overflow-y-auto px-3 py-4 space-y-6"
        >
          {ADMIN_MENU_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => !item.hidden);
            if (visibleItems.length === 0) return null;
            const isGroupCollapsed = Boolean(collapsedGroups[group.id]);

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Heading */}
                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={!isGroupCollapsed}
                    className="flex w-full cursor-pointer items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ease-out',
                        isGroupCollapsed && '-rotate-90',
                      )}
                    />
                  </button>
                ) : (
                  <div className="my-2 mx-auto w-6 border-t border-gray-200/80 dark:border-gray-800" />
                )}

                {/* Smooth Accordion Body (CSS Grid Rows Animation) */}
                <div
                  className={cn(
                    'grid transition-[grid-template-rows,opacity] duration-250 ease-out',
                    !isGroupCollapsed || collapsed
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0 pointer-events-none',
                  )}
                >
                  <div className="overflow-hidden">
                    <ul className="space-y-1 pt-0.5">
                      {visibleItems.map((item) => (
                        <SidebarNavItem
                          key={item.id}
                          item={item}
                          collapsed={collapsed}
                          onNavigate={() => dispatch(setSidebarOpen(false))}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Sidebar Footer / User Profile ─────────────────────────────── */}
        <div className="shrink-0 border-t border-gray-100 p-3 dark:border-gray-800/80">
          {!collapsed ? (
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50/80 p-2.5 dark:bg-white/3 border border-gray-100 dark:border-gray-800/60">
              {/* Avatar */}
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-9 w-9 shrink-0 rounded-xl object-cover ring-2 ring-brand-500/20"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-brand-500 to-indigo-600 text-xs font-bold text-white shadow-sm shadow-brand-500/20">
                  {userInitials}
                </div>
              )}

              {/* User text */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-900 dark:text-white/90">
                  {user?.name ?? 'Authenticated User'}
                </p>
                <p className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                  {user?.email ?? 'user@pln.co.id'}
                </p>
              </div>

              {/* Sign out mini icon button */}
              <button
                type="button"
                onClick={() => void handleLogout()}
                title="Sign out"
                aria-label="Sign out"
                className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => void handleLogout()}
                title="Sign out"
                aria-label="Sign out"
                className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render Full Layout ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-gray-50/70 text-gray-900 dark:bg-[#0c0d12] dark:text-white/90 font-sans antialiased">
      {/* ── Desktop Collapsible Sidebar ───────────────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:shrink-0',
          'sticky top-0 h-screen z-30',
          'border-r border-gray-200/70 bg-white dark:border-gray-800/80 dark:bg-[#0f1117]',
          'transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isSidebarCollapsed ? 'lg:w-19' : 'lg:w-66',
        )}
      >
        {renderSidebar(false)}
      </aside>

      {/* ── Mobile Slide-Over Sidebar ─────────────────────────────────────── */}
      {mobileVisible && (
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'fixed inset-0 z-50 flex lg:hidden',
            'transition-opacity duration-300 ease-out',
            mobileAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) dispatch(setSidebarOpen(false));
          }}
        >
          {/* Backdrop Blur */}
          <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" />

          {/* Drawer container */}
          <aside
            className={cn(
              'relative z-10 h-full w-68 flex flex-col',
              'border-r border-gray-200/80 bg-white dark:border-gray-800 dark:bg-[#0f1117]',
              'shadow-2xl shadow-gray-950/30',
              'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              mobileAnimating ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            {renderSidebar(true)}
          </aside>
        </div>
      )}

      {/* ── Main Viewport Area ────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Sticky Modern Header ────────────────────────────────────────── */}
        <header
          className={cn(
            'sticky top-0 z-20 flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8',
            'border-b border-gray-200/70 dark:border-gray-800/80',
            'bg-white/85 dark:bg-[#0f1117]/85 backdrop-blur-xl',
            'transition-shadow duration-200',
            isScrolled && 'shadow-sm shadow-gray-900/5 dark:shadow-black/20',
          )}
        >
          {/* Left section: Collapse Toggle + Command Search */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Desktop Sidebar Collapse Toggle */}
            <button
              type="button"
              onClick={() => dispatch(toggleSidebarCollapsed())}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'hidden lg:flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl',
                'border border-gray-200/80 bg-white text-gray-500 shadow-xs',
                'hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-600',
                'dark:border-gray-800 dark:bg-white/2 dark:text-gray-400',
                'dark:hover:border-brand-800 dark:hover:bg-brand-500/10 dark:hover:text-brand-300',
                'transition-all duration-150',
              )}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-4.5 w-4.5" />
              ) : (
                <PanelLeftClose className="h-4.5 w-4.5" />
              )}
            </button>

            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              type="button"
              onClick={() => dispatch(setSidebarOpen(true))}
              aria-label="Open mobile navigation"
              className={cn(
                'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl lg:hidden',
                'border border-gray-200/80 bg-white text-gray-500',
                'hover:bg-gray-100 hover:text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/5',
                'transition-colors',
              )}
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            {/* Global Command Search Box */}
            <div ref={searchBoxRef} className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
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
                    setMenuQuery('');
                  }
                }}
                placeholder="Search modules, pages, APIs..."
                aria-label="Quick search navigation"
                className={cn(
                  'h-9.5 w-full rounded-xl pl-9.5 pr-14 text-xs font-medium',
                  'border border-gray-200/80 bg-gray-50/70 text-gray-800 placeholder:text-gray-400',
                  'transition-all duration-200 ease-out',
                  'focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10',
                  'dark:border-gray-800 dark:bg-white/3 dark:text-white/90 dark:placeholder:text-gray-500',
                  'dark:focus:border-brand-500 dark:focus:bg-[#0f1117] dark:focus:ring-brand-500/20',
                )}
              />

              {/* Clear button or Shortcut badge */}
              {menuQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-400 sm:inline-flex dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-400">
                  ⌘K
                </kbd>
              )}

              {/* Search Results Dropdown */}
              {isSearchOpen && (
                <div
                  className={cn(
                    'absolute left-0 right-0 top-11.5 z-50 overflow-hidden rounded-2xl',
                    'border border-gray-200/90 bg-white/95 dark:border-gray-800 dark:bg-[#0f1117]/95 backdrop-blur-xl',
                    'shadow-2xl shadow-gray-950/15',
                    'animate-dropdown-enter',
                  )}
                >
                  <div className="border-b border-gray-100 dark:border-gray-800/60 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Quick Navigation
                  </div>

                  {filteredMenuItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Search className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                      <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        No matches found for &ldquo;{menuQuery}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100/60 dark:divide-gray-800/60 p-1">
                      {filteredMenuItems.map((item) => {
                        const Icon = ICON_MAP[item.icon] ?? Layers;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => {
                                navigate(item.path);
                                setIsSearchOpen(false);
                                setMenuQuery('');
                              }}
                              className={cn(
                                'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left',
                                'transition-colors duration-150',
                                'hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-300',
                              )}
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-xs font-semibold text-gray-800 dark:text-white/90">
                                    {item.label}
                                  </span>
                                  <span className="block truncate text-[10px] text-gray-400">
                                    {item.title}
                                  </span>
                                </span>
                              </span>
                              <span className="shrink-0 font-mono text-[10px] text-gray-400 dark:text-gray-500">
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

          {/* Right Header Controls: Fullscreen, Notifications, Theme, Profile */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className={cn(
                'hidden sm:flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl',
                'border border-gray-200/80 bg-white text-gray-500 shadow-xs',
                'hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800',
                'dark:border-gray-800 dark:bg-white/2 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                'transition-all duration-150',
              )}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Notification Bell with Badge */}
            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                aria-label="Open notifications"
                aria-expanded={isNotificationsOpen}
                className={cn(
                  'relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl',
                  'border border-gray-200/80 bg-white text-gray-500 shadow-xs',
                  'hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800',
                  'dark:border-gray-800 dark:bg-white/2 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                  'transition-all duration-150',
                  isNotificationsOpen &&
                    'border-brand-300 bg-brand-50/50 text-brand-600 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300',
                )}
              >
                <Bell className="h-4 w-4" />
                {/* Ping notification dot */}
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                </span>
              </button>

              {/* Notification Popover */}
              {isNotificationsOpen && (
                <div
                  className={cn(
                    'absolute right-0 top-11.5 z-50 w-80 overflow-hidden rounded-2xl',
                    'border border-gray-200/90 bg-white/95 dark:border-gray-800 dark:bg-[#0f1117]/95 backdrop-blur-xl',
                    'shadow-2xl shadow-gray-950/15',
                    'animate-dropdown-enter',
                  )}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Notifications
                    </span>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      Live Updates
                    </span>
                  </div>
                  <div className="p-4 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-gray-800 dark:text-white/90">
                      All caught up!
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                      You have no pending system alerts or tasks.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Dark/Light Mode Theme Toggle with Rotation Transition */}
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className={cn(
                'flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl',
                'border border-gray-200/80 bg-white text-gray-500 shadow-xs',
                'hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800',
                'dark:border-gray-800 dark:bg-white/2 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                'transition-all duration-300',
              )}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 transition-transform duration-500 rotate-0 hover:rotate-90 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12 text-slate-700" />
              )}
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-0.5" />

            {/* ── User Profile Dropdown ──────────────────────────────────── */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-xl p-1 sm:pr-2.5',
                  'border border-transparent hover:border-gray-200/80 hover:bg-gray-50/80',
                  'dark:hover:border-gray-800 dark:hover:bg-white/4',
                  'transition-all duration-150',
                  isUserMenuOpen &&
                    'border-gray-200/80 bg-gray-50/80 dark:border-gray-800 dark:bg-white/4',
                )}
              >
                {/* Avatar with Status Ring */}
                <div className="relative">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="h-8 w-8 shrink-0 rounded-xl object-cover ring-2 ring-brand-500/30"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-brand-500 to-indigo-600 text-xs font-bold text-white shadow-sm shadow-brand-500/20">
                      {userInitials}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
                </div>

                {/* Name */}
                <div className="hidden sm:block text-left leading-tight">
                  <p className="max-w-30 truncate text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {user?.name ?? 'User'}
                  </p>
                  <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    {user?.roles?.[0]?.name ?? 'Admin'}
                  </p>
                </div>

                <ChevronDown
                  className={cn(
                    'hidden sm:block h-3.5 w-3.5 text-gray-400 transition-transform duration-200',
                    isUserMenuOpen && 'rotate-180',
                  )}
                />
              </button>

              {/* Profile Popover Menu */}
              {isUserMenuOpen && (
                <div
                  role="menu"
                  className={cn(
                    'absolute right-0 top-11.5 z-50 w-68 overflow-hidden rounded-2xl',
                    'border border-gray-200/90 bg-white/95 dark:border-gray-800 dark:bg-[#0f1117]/95 backdrop-blur-xl',
                    'shadow-2xl shadow-gray-950/15',
                    'animate-dropdown-enter',
                  )}
                >
                  {/* Top user badge */}
                  <div className="bg-linear-to-br from-brand-50/80 via-white to-indigo-50/60 p-4 dark:from-brand-950/40 dark:via-gray-900 dark:to-indigo-950/30 border-b border-gray-100 dark:border-gray-800/60">
                    <div className="flex items-center gap-3">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="h-10 w-10 shrink-0 rounded-xl object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-brand-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-brand-500/20">
                          {userInitials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                          {user?.name ?? 'Authenticated User'}
                        </p>
                        <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                          {user?.email ?? 'user@pln.co.id'}
                        </p>
                        {user?.roles?.[0]?.name && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-brand-100/80 px-1.5 py-0.5 text-[9px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                            <Sparkles className="h-2.5 w-2.5" />
                            {user.roles[0].name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links inside Profile */}
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to="/admin/auth"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium',
                        'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5',
                        'transition-colors duration-150',
                      )}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        <KeyRound className="h-3.5 w-3.5" />
                      </span>
                      <span>Auth & Session Profile</span>
                    </Link>

                    <Link
                      to="/admin/users"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium',
                        'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5',
                        'transition-colors duration-150',
                      )}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        <UserCheck className="h-3.5 w-3.5" />
                      </span>
                      <span>User Management</span>
                    </Link>
                  </div>

                  {/* Logout Button */}
                  <div className="border-t border-gray-100 p-1.5 dark:border-gray-800/60">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleLogout()}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium',
                        'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30',
                        'transition-colors duration-150',
                      )}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                        <LogOut className="h-3.5 w-3.5" />
                      </span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Viewport Content ───────────────────────────────────────── */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* ── Modern Breadcrumb Trail ─────────────────────────────────── */}
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs">
            <Link
              to="/admin"
              className="flex items-center gap-1 text-gray-400 hover:text-brand-600 dark:text-gray-500 dark:hover:text-brand-300 transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Home</span>
            </Link>

            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${index}`}>
                  <ChevronRight className="h-3 w-3 shrink-0 text-gray-300 dark:text-gray-600" />
                  {crumb.path && !isLast ? (
                    <Link
                      to={crumb.path}
                      className="font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        'font-semibold tracking-tight',
                        isLast
                          ? 'text-gray-900 dark:text-white/95'
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

          {/* ── Page Content Container with Smooth Enter Animation ───────── */}
          <div key={location.pathname} className="animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
