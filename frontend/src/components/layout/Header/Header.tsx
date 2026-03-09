import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserData, UserData, onAuthStateChange } from '../../../utils/auth';
import { NavigationDrawer } from '../NavigationDrawer/NavigationDrawer';
import { LocationModal } from '../../features/LocationModal/LocationModal';
import { SignInModal } from '../../../pages/SignIn/SignIn';

interface HeaderProps {
    onSearchChange?: (query: string) => void;
}

export function Header({ onSearchChange }: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<UserData | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState('Mumbai');

    // Core Mobile Navbar States
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChange((firebaseUser) => {
            if (firebaseUser) {
                const userData = getUserData();
                setUser(userData);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    // Close mobile menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearchChange?.(query);
    };

    const handleCitySelect = (city: string) => {
        setSelectedCity(city);
    };

    return (
        <header className="sticky top-0 z-[100] bg-white shadow-sm" ref={menuRef}>
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-[68px] flex items-center justify-between gap-6">

                {/* Left Section: Logo */}
                <div
                    className="flex-shrink-0 text-xl md:text-2xl font-bold text-orange-600 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => navigate('/')}
                >
                    BookMyTurf
                </div>

                {/* Center Section: Search Bar (Desktop only) */}
                <div className="hidden md:block flex-1 max-w-[460px] relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" strokeWidth={2} />
                        <path d="m21 21-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        className="w-full h-10 pl-[42px] pr-4 border border-gray-200 rounded-md text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-orange-600 focus:bg-white transition-colors"
                        placeholder="Search for turfs, locations, or sports"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>

                {/* Right Section (Desktop only) */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Location Selector */}
                    <button
                        className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-800 cursor-pointer flex items-center gap-1.5 transition-colors hover:border-orange-600 hover:bg-white whitespace-nowrap min-h-[44px]"
                        onClick={() => setIsLocationModalOpen(true)}
                    >
                        📍 {selectedCity}
                        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Nav Links */}
                    <a href="/listings" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors min-h-[44px] flex items-center">
                        Browse Turfs
                    </a>

                    {/* Sign In / Profile */}
                    {!user ? (
                        <button
                            className="h-10 px-5 bg-orange-600 border-none rounded-md text-sm font-semibold text-white cursor-pointer transition-transform hover:bg-red-600 hover:scale-105 whitespace-nowrap min-h-[44px]"
                            onClick={() => setIsSignInModalOpen(true)}
                        >
                            Sign In
                        </button>
                    ) : (
                        <button
                            className="w-10 h-10 p-0 bg-transparent border-2 border-gray-200 rounded-full cursor-pointer transition-colors overflow-hidden hover:border-orange-600 min-h-[44px] min-w-[44px]"
                            onClick={() => setIsDrawerOpen(true)}
                            aria-label="User menu"
                        >
                            <img src={user.picture} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                    )}
                </div>

                {/* Hamburger button (Mobile only) */}
                <button
                    className="md:hidden p-2 ml-auto focus:outline-none min-h-[44px] min-w-[44px] flex flex-col justify-center items-center"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <div className={`w-5 h-0.5 bg-gray-800 mb-1 transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                    <div className={`w-5 h-0.5 bg-gray-800 mb-1 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
                    <div className={`w-5 h-0.5 bg-gray-800 transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                </button>
            </div>

            {/* Mobile Dropdown Menu (Mobile Only) */}
            <div className={`md:hidden absolute top-full left-0 right-0 bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out origin-top border-t border-gray-100 ${isMenuOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible'}`}>
                <div className="flex flex-col py-2">

                    {/* Mobile Search */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8" strokeWidth={2} />
                                <path d="m21 21-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
                            </svg>
                            <input
                                type="text"
                                className="w-full h-10 pl-9 pr-4 border border-gray-200 rounded-md text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-orange-600 focus:bg-white"
                                placeholder="Search turfs..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>

                    {/* Mobile Location */}
                    <button
                        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100 text-left min-h-[44px]"
                        onClick={() => {
                            setIsMenuOpen(false);
                            setIsLocationModalOpen(true);
                        }}
                    >
                        <span>📍 {selectedCity}</span>
                        <span className="text-gray-400 text-xs ml-auto">Change</span>
                    </button>

                    {/* Basic Nav Links */}
                    <a href="/" className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100 min-h-[44px] flex items-center">
                        Home
                    </a>
                    <a href="/listings" className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100 min-h-[44px] flex items-center">
                        Browse Turfs
                    </a>

                    {/* Auth Elements */}
                    {!user ? (
                        <div className="p-4 pt-5">
                            <button
                                className="w-full h-11 bg-orange-600 rounded-md text-sm font-bold text-white shadow-sm"
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setIsSignInModalOpen(true);
                                }}
                            >
                                Sign In
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                                    <span className="text-xs text-gray-500">{user.email}</span>
                                </div>
                            </div>
                            <button
                                className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 text-left border-b border-gray-100 min-h-[44px] w-full"
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setIsDrawerOpen(true);
                                }}
                            >
                                My Account Menu
                            </button>
                            <div className="px-4 py-3 min-h-[44px] flex items-center">
                                <button
                                    className="text-sm font-medium text-red-600 text-left min-w-[50%] min-h-[44px]"
                                    onClick={() => {
                                        // Trigger sign-out from NavigationDrawer or via auth utility
                                        setIsMenuOpen(false);
                                        // For full implementation: we'd want to expose signOut from auth context here 
                                        // but opening the drawer achieves the same core functionality for now
                                        setIsDrawerOpen(true);
                                    }}
                                >
                                    Log out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation Drawer */}
            <NavigationDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                user={user}
                onSignInClick={() => setIsSignInModalOpen(true)}
            />

            {/* Location Modal */}
            <LocationModal
                isOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
                selectedCity={selectedCity}
                onCitySelect={handleCitySelect}
            />

            {/* Sign In Modal */}
            <SignInModal
                isOpen={isSignInModalOpen}
                onClose={() => setIsSignInModalOpen(false)}
            />
        </header>
    );
}
