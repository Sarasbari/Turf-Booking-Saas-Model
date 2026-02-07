import { useNavigate } from 'react-router-dom';
import { signOut } from '../../utils/auth';
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

export function ProfileSidebar({
    user,
    activeSection,
    onSectionChange,
    isMobileMenuOpen = false,
    onCloseMobileMenu,
}: ProfileSidebarProps) {
    const navigate = useNavigate();

    const menuItems = [
        { id: 'personal', label: 'Profile', icon: '👤' },
        { id: 'bookings', label: 'Your Bookings', icon: '📋' },
        { id: 'favorites', label: 'My Wishlist', icon: '❤️' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
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

                    {/* Divider */}
                    <div className="sidebar-divider"></div>

                    {/* Sign Out */}
                    <button className="sidebar-nav-item" onClick={handleSignOut}>
                        <span className="nav-icon">🚪</span>
                        <span className="nav-label">Sign Out</span>
                    </button>
                </nav>
            </aside>
        </>
    );
}
