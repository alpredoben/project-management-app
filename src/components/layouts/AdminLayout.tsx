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
  ShieldCogCorner
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
  'positions': ShieldCogCorner
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

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

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
            'group relative flex items-center rounded-xl text-[13px] font-medium select-none',
            'transition-all duration-200 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
            collapsed
              ? 'h-11 w-11 mx-auto justify-center'
              : 'px-3 py-2 gap-3 w-full',
            isActive
              ? [
                  /* Light: soft blue pill */
                  'bg-brand-500 text-white shadow-md shadow-brand-500/20',
                  /* Dark: gradient pill with glow */
                  'dark:bg-gradient-to-r dark:from-brand-600 dark:to-brand-500',
                  'dark:shadow-lg dark:shadow-brand-500/15',
                  'font-semibold',
                ]
              : [
                  'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70',
                  'dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-white/[0.06]',
                ],
          )
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={cn(
                'flex shrink-0 items-center justify-center transition-all duration-200',
                isActive
                  ? 'text-white'
                  : 'text-gray-400 group-hover/navitem:text-gray-700 dark:text-gray-500 dark:group-hover/navitem:text-gray-300',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>

            {!collapsed && (
              <span className="truncate leading-none tracking-tight">
                {item.label}
              </span>
            )}

            {collapsed && isActive && (
              <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-brand-400 dark:bg-brand-400" />
            )}
          </>
        )}
      </NavLink>

      {/* Tooltip when collapsed */}
      {collapsed && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50',
            'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium',
            'bg-gray-900 text-white shadow-xl',
            'dark:bg-gray-800 dark:text-gray-100 dark:border dark:border-gray-700/60',
            'opacity-0 -translate-x-2 group-hover/navitem:opacity-100 group-hover/navitem:translate-x-0',
            'transition-all duration-150 ease-out',
          )}
        >
          <div className="font-semibold">{item.label}</div>
          {item.description && (
            <div className="text-[10px] text-gray-400 font-normal max-w-45 truncate">
              {item.description}
            </div>
          )}
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

  // Mobile drawer
  const [mobileVisible, setMobileVisible] = useState(false);
  const [mobileAnimating, setMobileAnimating] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  // ── User Profile ──────────────────────────────────────────────────────────
  const meQuery = authApi.query.useGetProfile(isAuthenticated);
  useEffect(() => {
    if (meQuery.data) {
      dispatch(setCurrentUser(meQuery.data));
    }
  }, [dispatch, meQuery.data]);

  // ── Scroll Detector ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Mobile Sidebar Transitions ────────────────────────────────────────────
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

  // ── Close dropdowns on route changes ──────────────────────────────────────
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsSearchOpen(false);
      setIsUserMenuOpen(false);
      setIsNotificationsOpen(false);
      setMenuQuery('');
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  // ── Keyboard Shortcuts & Outside Clicks ───────────────────────────────────
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

  // ── Fullscreen ────────────────────────────────────────────────────────────
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

  // ── Menu Filter ───────────────────────────────────────────────────────────
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

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await httpRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
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

  // ─── Sidebar Renderer ──────────────────────────────────────────────────────
  const renderSidebar = (isMobile = false) => {
    const collapsed = !isMobile && isSidebarCollapsed;

    return (
      <div className="flex h-full flex-col select-none">
        {/* ── Brand Header ──────────────────────────────────────────── */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center',
            'transition-[padding] duration-200',
            collapsed ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          <Link
            to="/admin"
            onClick={() => dispatch(setSidebarOpen(false))}
            className="flex items-center gap-2.5 group/brand shrink-0"
          >
            {/* Brand Icon - Matching template's play/arrow icon */}
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/30 transition-transform duration-300 group-hover/brand:scale-105">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-0.5">
                <path d="M4 2L13 8L4 14V2Z" fill="currentColor" />
              </svg>
            </div>

            {!collapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="font-display text-[15px] font-bold tracking-tight text-gray-900 dark:text-white">
                  Dashboard
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close */}
          {isMobile && (
            <button
              type="button"
              onClick={() => dispatch(setSidebarOpen(false))}
              aria-label="Close navigation drawer"
              className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────── */}
        <nav
          aria-label="Admin sidebar navigation"
          className="custom-scrollbar flex-1 overflow-y-auto px-3 py-3 space-y-5"
        >
          {ADMIN_MENU_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => !item.hidden);
            if (visibleItems.length === 0) return null;
            const isGroupCollapsed = Boolean(collapsedGroups[group.id]);

            return (
              <div key={group.id} className="space-y-0.5">
                {/* Group Heading */}
                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={!isGroupCollapsed}
                    className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      className={cn(
                        'h-3 w-3 text-gray-400 transition-transform duration-200 ease-out',
                        isGroupCollapsed && '-rotate-90',
                      )}
                    />
                  </button>
                ) : (
                  <div className="my-2 mx-auto w-5 border-t border-gray-200/60 dark:border-gray-700/40" />
                )}

                {/* Items */}
                <div
                  className={cn(
                    'grid transition-[grid-template-rows,opacity] duration-250 ease-out',
                    !isGroupCollapsed || collapsed
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0 pointer-events-none',
                  )}
                >
                  <div className="overflow-hidden">
                    <ul className="space-y-0.5 pt-0.5">
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

        {/* ── Sidebar Footer ─────────────────────────────────────── */}
        <div className="shrink-0 border-t border-gray-100 p-3 dark:border-white/[0.06]">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 rounded-xl p-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
              {/* Avatar */}
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-brand-500/20"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                  {userInitials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-900 dark:text-white/90">
                  {user?.name ?? 'Authenticated User'}
                </p>
                <p className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                  {user?.email ?? 'user@pln.co.id'}
                </p>
              </div>

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

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-surface-light text-gray-900 dark:bg-surface-dark dark:text-white/90 font-sans antialiased">
      {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:shrink-0',
          'sticky top-0 h-screen z-30',
          /* Light: white sidebar with right border */
          'bg-white border-r border-gray-200/70',
          /* Dark: deep dark sidebar */
          'dark:bg-surface-dark-sidebar dark:border-white/[0.06]',
          'transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isSidebarCollapsed ? 'lg:w-19' : 'lg:w-60',
        )}
      >
        {renderSidebar(false)}
      </aside>

      {/* ── Mobile Slide-Over ─────────────────────────────────────────── */}
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
          <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm" />

          <aside
            className={cn(
              'relative z-10 h-full w-64 flex flex-col',
              'bg-white dark:bg-surface-dark-sidebar',
              'border-r border-gray-200/80 dark:border-white/[0.06]',
              'shadow-2xl shadow-gray-950/30',
              'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              mobileAnimating ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            {renderSidebar(true)}
          </aside>
        </div>
      )}

      {/* ── Main Viewport ──────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Top Header ─────────────────────────────────────────────── */}
        <header
          className={cn(
            'sticky top-0 z-20 flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8',
            /* Light: clean white header */
            'bg-white/90 border-b border-gray-200/60',
            /* Dark: deep dark header */
            'dark:bg-surface-dark/90 dark:border-white/[0.06]',
            'backdrop-blur-xl',
            'transition-shadow duration-200',
            isScrolled && 'shadow-sm shadow-gray-900/5 dark:shadow-black/30',
          )}
        >
          {/* Left: Toggle + Search */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={() => dispatch(toggleSidebarCollapsed())}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'hidden lg:flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl',
                'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                'dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/[0.06]',
                'transition-all duration-150',
              )}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-4.5 w-4.5" />
              ) : (
                <PanelLeftClose className="h-4.5 w-4.5" />
              )}
            </button>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => dispatch(setSidebarOpen(true))}
              aria-label="Open mobile navigation"
              className={cn(
                'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl lg:hidden',
                'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
                'dark:text-gray-500 dark:hover:bg-white/[0.06] dark:hover:text-gray-200',
                'transition-colors',
              )}
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            {/* Search Box */}
            <div ref={searchBoxRef} className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
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
                  'h-9 w-full rounded-xl pl-9 pr-14 text-xs font-medium',
                  'border border-gray-200/80 bg-gray-50/80 text-gray-800 placeholder:text-gray-400',
                  'transition-all duration-200',
                  'focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/10',
                  'dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/90 dark:placeholder:text-gray-500',
                  'dark:focus:border-brand-500/60 dark:focus:bg-white/[0.06] dark:focus:ring-brand-500/15',
                )}
              />

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
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-400 sm:inline-flex dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-500">
                  ⌘K
                </kbd>
              )}

              {/* Search Results */}
              {isSearchOpen && (
                <div
                  className={cn(
                    'absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-2xl',
                    'border border-gray-200/90 bg-white dark:border-white/[0.08] dark:bg-surface-dark-card',
                    'shadow-2xl shadow-gray-950/10 dark:shadow-black/40',
                    'animate-dropdown-enter',
                  )}
                >
                  <div className="border-b border-gray-100 dark:border-white/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
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
                    <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-white/[0.04] p-1">
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
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
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

          {/* Right Header Controls */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className={cn(
                'hidden sm:flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl',
                'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                'dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/[0.06]',
                'transition-all duration-150',
              )}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Notifications */}
            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                aria-label="Open notifications"
                aria-expanded={isNotificationsOpen}
                className={cn(
                  'relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl',
                  'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                  'dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/[0.06]',
                  'transition-all duration-150',
                  isNotificationsOpen && 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
                )}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white dark:ring-surface-dark" />
                </span>
              </button>

              {isNotificationsOpen && (
                <div
                  className={cn(
                    'absolute right-0 top-11.5 z-50 w-80 overflow-hidden rounded-2xl',
                    'border border-gray-200/90 bg-white dark:border-white/[0.08] dark:bg-surface-dark-card',
                    'shadow-2xl shadow-gray-950/10 dark:shadow-black/40',
                    'animate-dropdown-enter',
                  )}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] px-4 py-3">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Notifications
                    </span>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      Live Updates
                    </span>
                  </div>
                  <div className="p-5 text-center">
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

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className={cn(
                'flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl',
                'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                'dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/[0.06]',
                'transition-all duration-300',
              )}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 transition-transform duration-500 hover:rotate-90 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12 text-slate-600" />
              )}
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-gray-200 dark:bg-white/[0.08] mx-0.5" />

            {/* User Profile */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-xl p-1 sm:pr-2.5',
                  'hover:bg-gray-50 dark:hover:bg-white/[0.04]',
                  'transition-all duration-150',
                  isUserMenuOpen && 'bg-gray-50 dark:bg-white/[0.04]',
                )}
              >
                <div className="relative">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-brand-500/20"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                      {userInitials}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-surface-dark" />
                </div>

                <div className="hidden sm:block text-left leading-tight">
                  <p className="max-w-28 truncate text-xs font-semibold text-gray-800 dark:text-gray-200">
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

              {/* Profile Dropdown */}
              {isUserMenuOpen && (
                <div
                  role="menu"
                  className={cn(
                    'absolute right-0 top-11.5 z-50 w-64 overflow-hidden rounded-2xl',
                    'border border-gray-200/90 bg-white dark:border-white/[0.08] dark:bg-surface-dark-card',
                    'shadow-2xl shadow-gray-950/10 dark:shadow-black/40',
                    'animate-dropdown-enter',
                  )}
                >
                  {/* User badge area */}
                  <div className="p-4 border-b border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-sm font-bold text-white shadow-md">
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
                          <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                            <Sparkles className="h-2.5 w-2.5" />
                            {user.roles[0].name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to="/admin/auth"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium',
                        'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-white',
                        'transition-colors duration-150',
                      )}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
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
                        'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-white',
                        'transition-colors duration-150',
                      )}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
                        <UserCheck className="h-3.5 w-3.5" />
                      </span>
                      <span>User Management</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 p-1.5 dark:border-white/[0.06]">
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

        {/* ── Main Content ───────────────────────────────────────────── */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs">
            <Link
              to="/admin"
              className="flex items-center gap-1 text-gray-400 hover:text-brand-600 dark:text-gray-500 dark:hover:text-brand-400 transition-colors"
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

          {/* Page Content */}
          <div key={location.pathname} className="animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
