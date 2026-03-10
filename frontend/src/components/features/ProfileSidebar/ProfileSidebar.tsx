import { useNavigate } from 'react-router-dom';
import { signOut } from '../../../utils/auth';
import './ProfileSidebar.css';

interface ProfileSidebarProps {
    user: {
        name: string;
        email: string;
        picture: string;
    };
    activeSection: string;
    onSectionChange: (section: string) => void;
    isMobileMenuOpen?: boolean;
    onCloseMobileMenu?: () => void;
}

const icons = {
    profile: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    ),
    bookings: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    ),
    favorites: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
    ),
    settings: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    ),
    logout: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
    )
};

export function ProfileSidebar({
    user,
    activeSection,
    onSectionChange,
    isMobileMenuOpen = false,
    onCloseMobileMenu,
}: ProfileSidebarProps) {
    const navigate = useNavigate();

    const menuItems = [
        { id: 'personal', label: 'Profile', icon: icons.profile },
        { id: 'bookings', label: 'Your Bookings', icon: icons.bookings },
        { id: 'favorites', label: 'My Wishlist', icon: icons.favorites },
        { id: 'settings', label: 'Settings', icon: icons.settings },
    ];

    const handleMenuClick = (itemId: string) => {
        onSectionChange(itemId);
        if (onCloseMobileMenu) {
            onCloseMobileMenu();
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <>
            {/* Mobile backdrop */}
            {isMobileMenuOpen && (
                <div className="sidebar-backdrop" onClick={onCloseMobileMenu}></div>
            )}

            {/* Sidebar */}
            <aside className={`profile-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                {/* Profile Picture */}
                <div className="sidebar-profile-picture">
                    <img src={user.picture} alt={user.name} />
                </div>

                {/* User Info */}
                <div className="sidebar-user-info">
                    <h3 className="sidebar-user-name">{user.name}</h3>
                    <p className="sidebar-user-email">{user.email}</p>
                </div>

                {/* Navigation Menu */}
                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => handleMenuClick(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}

                    <button className="sidebar-nav-item sign-out-btn" onClick={handleSignOut}>
                        <span className="nav-icon">{icons.logout}</span>
                        <span className="nav-label">Sign Out</span>
                    </button>
                </nav>
            </aside>
        </>
    );
}
