import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Menu,
    Search,
    Bell,
    ChevronDown,
    Settings,
    Eye,
    MessageSquare,
    LogOut,
    Calendar,
    User,
    ArrowRight,
    Plus,
    BarChart3,
    X,
    Clock,
} from 'lucide-react';
import { OwnerData, TurfData } from '../../types/owner';

/* ─── Types ──────────────────────────────────────────────────────────── */

interface DashboardHeaderProps {
    onToggleSidebar: () => void;
    onSignOut: () => void;
    ownerData: OwnerData | null;
    turfData: TurfData | null;
}

interface Notification {
    id: number;
    icon: string;
    iconColor: string;
    title: string;
    body: string;
    time: string;
    unread: boolean;
    route: string; // where clicking takes you
}

/* ─── Mock data ──────────────────────────────────────────────────────── */

const NOTIFICATIONS: Notification[] = [
    {
        id: 1,
        icon: '⏳',
        iconColor: 'bg-yellow-100 text-yellow-600',
        title: 'New Booking Request',
        body: 'Abhay booked Ground 2 · 18:00–19:00',
        time: '30 mins ago',
        unread: true,
        route: '/owner/bookings',
    },
    {
        id: 2,
        icon: '⭐',
        iconColor: 'bg-orange-100 text-orange-600',
        title: 'New Review Received',
        body: 'Rahul M. left a 4-star review',
        time: '2 hours ago',
        unread: true,
        route: '/owner/reviews',
    },
    {
        id: 3,
        icon: '💰',
        iconColor: 'bg-green-100 text-green-600',
        title: 'Payment Received',
        body: '₹500 received · Booking #BK2026021',
        time: '3 hours ago',
        unread: false,
        route: '/owner/revenue',
    },
];

interface QuickAction {
    label: string;
    icon: typeof ArrowRight;
    route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
    { label: "View Today's Bookings", icon: ArrowRight, route: '/owner/bookings' },
    { label: 'Add New Booking', icon: Plus, route: '/owner/slots' },
    { label: 'Check Revenue', icon: BarChart3, route: '/owner/revenue' },
];

interface SearchResult {
    label: string;
    icon: typeof Calendar;
    route: string;
}

const SEARCH_DATA = {
    bookings: [
        { label: 'Abhay · Ground 2 · 18:00 today', icon: Calendar, route: '/owner/bookings' },
        { label: 'Tushar · Ground 1 · 15:00 today', icon: Calendar, route: '/owner/bookings' },
    ] as SearchResult[],
    customers: [
        { label: 'Rahul M. · 3 bookings · ₹1,500 spent', icon: User, route: '/owner/bookings' },
    ] as SearchResult[],
};

/* ─── Helpers ────────────────────────────────────────────────────────── */

function formatDate(date: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function highlightMatch(text: string, query: string) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <span className="text-[#F97316] font-semibold">{text.slice(idx, idx + query.length)}</span>
            {text.slice(idx + query.length)}
        </>
    );
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function DashboardHeader({
    onToggleSidebar,
    onSignOut,
    ownerData,
    turfData,
}: DashboardHeaderProps) {
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [supportToast, setSupportToast] = useState(false);
    const [notifications, setNotifications] = useState(NOTIFICATIONS);

    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const ownerName = ownerData?.name || 'Owner';
    const ownerInitials = getInitials(ownerName);
    const turfName = turfData?.name || 'Personal Turf';
    const turfId = ownerData?.turfId || turfData?.id || 'TRF001';
    const openTime = turfData?.openTime || '6:00 AM';
    const closeTime = turfData?.closeTime || '11:00 PM';
    const unreadCount = notifications.filter((n) => n.unread).length;

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchFocused(false);
                setMobileSearchOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Close search on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setSearchFocused(false);
                setMobileSearchOpen(false);
                setNotifOpen(false);
                setProfileOpen(false);
            }
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    // Auto-dismiss support toast
    useEffect(() => {
        if (!supportToast) return;
        const t = setTimeout(() => setSupportToast(false), 3000);
        return () => clearTimeout(t);
    }, [supportToast]);

    /* ────── Navigation helpers ────── */

    const closeAllDropdowns = useCallback(() => {
        setNotifOpen(false);
        setProfileOpen(false);
        setSearchFocused(false);
        setMobileSearchOpen(false);
        setSearchQuery('');
    }, []);

    const handleNavigation = useCallback(
        (route: string) => {
            closeAllDropdowns();
            navigate(route);
        },
        [navigate, closeAllDropdowns],
    );

    const handleNotificationClick = useCallback(
        (notif: Notification) => {
            // Mark as read
            setNotifications((prev) =>
                prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n)),
            );
            handleNavigation(notif.route);
        },
        [handleNavigation],
    );

    const handleSearchResultClick = useCallback(
        (route: string) => {
            handleNavigation(route);
        },
        [handleNavigation],
    );

    const handleViewPublicPage = useCallback(() => {
        closeAllDropdowns();
        if (turfId) {
            // opens in new tab so owner doesn't lose dashboard context
            window.open(`/turf/${turfId}`, '_blank');
        }
    }, [turfId, closeAllDropdowns]);

    const handleSupport = useCallback(() => {
        closeAllDropdowns();
        setSupportToast(true);
    }, [closeAllDropdowns]);

    const handleSignOutClick = useCallback(() => {
        closeAllDropdowns();
        onSignOut();
    }, [onSignOut, closeAllDropdowns]);

    /* ────── Search filtering ────── */

    const showSearchResults = searchFocused && searchQuery.length > 0;

    const filteredBookings = SEARCH_DATA.bookings.filter((b) =>
        b.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    const filteredCustomers = SEARCH_DATA.customers.filter((c) =>
        c.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    const hasResults = filteredBookings.length > 0 || filteredCustomers.length > 0 || searchQuery.length === 0;

    /* ────── Shared search results renderer ────── */
    const renderSearchResults = () => (
        <>
            {hasResults ? (
                <div className="p-2">
                    {filteredBookings.length > 0 && (
                        <>
                            <div className="px-3 py-1.5 text-[10px] font-bold text-[#9CA3AF] tracking-wider uppercase">
                                Bookings
                            </div>
                            {filteredBookings.map((b, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSearchResultClick(b.route)}
                                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#FFF7ED] text-left transition-colors cursor-pointer"
                                >
                                    <b.icon size={15} className="text-[#F97316]" />
                                    <span className="text-sm text-[#111827]">{highlightMatch(b.label, searchQuery)}</span>
                                </button>
                            ))}
                        </>
                    )}

                    {filteredCustomers.length > 0 && (
                        <>
                            <div className="px-3 py-1.5 text-[10px] font-bold text-[#9CA3AF] tracking-wider uppercase mt-1">
                                Customers
                            </div>
                            {filteredCustomers.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSearchResultClick(c.route)}
                                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#FFF7ED] text-left transition-colors cursor-pointer"
                                >
                                    <c.icon size={15} className="text-[#F97316]" />
                                    <span className="text-sm text-[#111827]">{highlightMatch(c.label, searchQuery)}</span>
                                </button>
                            ))}
                        </>
                    )}

                    {/* Always show quick actions */}
                    <div className="px-3 py-1.5 text-[10px] font-bold text-[#9CA3AF] tracking-wider uppercase mt-1">
                        Quick Actions
                    </div>
                    {QUICK_ACTIONS.map((a, i) => (
                        <button
                            key={i}
                            onClick={() => handleSearchResultClick(a.route)}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#FFF7ED] text-left transition-colors cursor-pointer"
                        >
                            <a.icon size={15} className="text-[#F97316]" />
                            <span className="text-sm text-[#111827]">{a.label}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center py-6 text-[#9CA3AF]">
                    <Search size={24} className="mb-2" />
                    <span className="text-sm">No results for "{searchQuery}"</span>
                </div>
            )}
        </>
    );

    /* ────── Render ────── */
    return (
        <>
            <header
                className="w-full sticky top-0 z-[100] select-none"
                style={{
                    background: 'linear-gradient(to right, #FFF7ED, #FFFBEB)',
                    borderBottom: '2px solid #F97316',
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
                }}
            >
                {/* ═══ ROW 1 — Main Bar ═══ */}
                <div className="flex items-center h-16 px-4 md:px-6 gap-3">
                    {/* Left: Hamburger + Logo */}
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-white/60 transition-colors text-[#111827] cursor-pointer"
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={22} />
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xl leading-none">🏟️</span>
                        <span className="font-bold text-lg text-[#111827] hidden sm:inline">BookMyTurf Owner</span>
                    </div>

                    {/* Center: Search (desktop) */}
                    <div ref={searchRef} className="relative flex-1 max-w-md mx-auto hidden md:block">
                        <div
                            className={`flex items-center bg-white rounded-full border px-4 py-2 transition-all duration-200 ${searchFocused
                                ? 'border-[#F97316] ring-2 ring-[#F97316]/20'
                                : 'border-[#E5E7EB]'
                                }`}
                        >
                            <Search size={16} className="text-[#9CA3AF] shrink-0 mr-2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                placeholder="Search bookings, customers, revenue..."
                                className="w-full bg-transparent outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF]"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="text-[#9CA3AF] hover:text-[#6B7280] ml-1 cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Search Dropdown */}
                        {showSearchResults && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                {renderSearchResults()}
                            </div>
                        )}
                    </div>

                    {/* Mobile search toggle */}
                    <button
                        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-white/60 transition-colors text-[#6B7280] ml-auto cursor-pointer"
                        aria-label="Search"
                    >
                        <Search size={20} />
                    </button>

                    {/* Right: Notifications + Profile */}
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        {/* Notification Bell */}
                        <div ref={notifRef} className="relative">
                            <button
                                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                                className="relative p-2 rounded-lg hover:bg-white/60 transition-colors text-[#6B7280] cursor-pointer"
                                aria-label="Notifications"
                            >
                                <Bell size={20} className={notifOpen ? 'text-[#F97316]' : ''} />
                                {/* Badge */}
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full animate-[badgeBounce_0.4s_ease] border-2 border-[#FFF7ED]">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {notifOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <span className="font-semibold text-[#111827] text-sm">🔔 Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F97316] text-white">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    <div className="border-t border-[#E5E7EB]" />

                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`flex items-start gap-3 px-4 py-3 hover:bg-[#FFF7ED] transition-colors cursor-pointer ${!n.unread ? 'opacity-70' : ''
                                                }`}
                                        >
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 ${n.iconColor}`}>
                                                {n.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-[#111827]">{n.title}</div>
                                                <div className="text-xs text-[#6B7280] mt-0.5 truncate">{n.body}</div>
                                                <div className="text-[10px] text-[#9CA3AF] mt-1">{n.time}</div>
                                            </div>
                                            {n.unread && (
                                                <span className="w-2 h-2 rounded-full bg-[#F97316] shrink-0 mt-2" />
                                            )}
                                        </div>
                                    ))}

                                    <div className="border-t border-[#E5E7EB]" />
                                    <button
                                        onClick={() => handleNavigation('/owner/bookings')}
                                        className="w-full text-center py-3 text-sm font-medium text-[#F97316] hover:bg-[#FFF7ED] transition-colors cursor-pointer"
                                    >
                                        View All Notifications →
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Profile */}
                        <div ref={profileRef} className="relative">
                            <button
                                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#F97316] flex items-center justify-center text-white text-sm font-bold transition-transform hover:scale-105">
                                    {ownerInitials}
                                </div>
                                <span className="hidden md:inline text-sm font-medium text-[#111827]">{ownerName}</span>
                                <ChevronDown size={14} className={`hidden md:block text-[#6B7280] transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Profile Dropdown */}
                            {profileOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* Top section */}
                                    <div className="bg-[#FFF7ED] px-4 py-4 rounded-t-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-[#F97316] flex items-center justify-center text-white font-bold text-base">
                                                {ownerInitials}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-[#111827] text-sm">{ownerName}</div>
                                                <div className="text-xs text-[#6B7280]">{turfName}</div>
                                                <div className="text-[10px] text-[#9CA3AF] mt-0.5">ID: {turfId}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#E5E7EB]" />

                                    {/* Menu items */}
                                    <div className="py-1">
                                        {/* Settings */}
                                        <button
                                            onClick={() => handleNavigation('/owner/settings')}
                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#111827] hover:bg-[#FFF7ED] transition-colors cursor-pointer"
                                        >
                                            <Settings size={16} className="text-[#6B7280]" />
                                            Settings
                                        </button>

                                        {/* View Public Page */}
                                        <button
                                            onClick={handleViewPublicPage}
                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#111827] hover:bg-[#FFF7ED] transition-colors cursor-pointer"
                                        >
                                            <Eye size={16} className="text-[#6B7280]" />
                                            View Public Page
                                        </button>

                                        {/* Support — Coming Soon */}
                                        <button
                                            onClick={handleSupport}
                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#111827] hover:bg-[#FFF7ED] transition-colors cursor-pointer"
                                        >
                                            <MessageSquare size={16} className="text-[#6B7280]" />
                                            Support
                                            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FFF7ED] text-[#F97316] border border-[#F97316]/20">
                                                SOON
                                            </span>
                                        </button>
                                    </div>

                                    <div className="border-t border-[#E5E7EB]" />

                                    {/* Sign Out */}
                                    <div className="py-1">
                                        <button
                                            onClick={handleSignOutClick}
                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ Mobile Search Overlay ═══ */}
                {mobileSearchOpen && (
                    <div ref={searchRef} className="md:hidden px-4 pb-3 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center bg-white rounded-full border border-[#F97316] ring-2 ring-[#F97316]/20 px-4 py-2">
                            <Search size={16} className="text-[#9CA3AF] shrink-0 mr-2" />
                            <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                placeholder="Search bookings, customers, revenue..."
                                className="w-full bg-transparent outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF]"
                            />
                            <button
                                onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }}
                                className="text-[#6B7280] ml-1 cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Mobile Search Results */}
                        {searchQuery.length > 0 && (
                            <div className="mt-2 bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden">
                                {renderSearchResults()}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ ROW 2 — Context Strip ═══ */}
                <div className="hidden md:flex items-center gap-0 px-6 py-1.5 border-t border-[#F97316]/10 text-xs text-[#6B7280]">
                    <span className="flex items-center gap-1">
                        📍 <span>{turfName}</span>
                    </span>

                    <span className="mx-3 text-[#E5E7EB]">|</span>

                    <span className="flex items-center gap-1">
                        📅 <span>{formatDate(new Date())}</span>
                    </span>

                    <span className="mx-3 text-[#E5E7EB]">|</span>

                    {/* Status pill */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-medium text-[11px]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]" />
                        </span>
                        Open Now
                    </span>

                    <span className="mx-3 text-[#E5E7EB]">|</span>

                    <span className="flex items-center gap-1">
                        <Clock size={12} className="text-[#9CA3AF]" />
                        <span>{openTime} – {closeTime}</span>
                    </span>

                    <span className="ml-auto text-[#9CA3AF] font-mono text-[11px]">ID: {turfId}</span>
                </div>

                {/* ─── inline keyframe for badge bounce ─── */}
                <style>{`
          @keyframes badgeBounce {
            0% { transform: scale(0); }
            50% { transform: scale(1.25); }
            100% { transform: scale(1); }
          }
        `}</style>
            </header>

            {/* ═══ Support Coming Soon Toast ═══ */}
            {supportToast && (
                <div className="fixed bottom-6 right-6 z-[200] animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-2xl border border-[#E5E7EB]">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] flex items-center justify-center">
                            <MessageSquare size={16} className="text-[#F97316]" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-[#111827]">Coming Soon!</div>
                            <div className="text-xs text-[#6B7280]">Support chat is under development.</div>
                        </div>
                        <button
                            onClick={() => setSupportToast(false)}
                            className="text-[#9CA3AF] hover:text-[#6B7280] ml-2 cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
