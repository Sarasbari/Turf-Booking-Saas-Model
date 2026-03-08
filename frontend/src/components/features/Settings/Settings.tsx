import { useState } from 'react';
import './Settings.css';

export function Settings() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const handleDeleteAccount = () => {
        console.log('Account deletion requested');
        // TODO: Implement account deletion
        setDeleteModalOpen(false);
    };

    return (
        <div className="settings-section">
            <div className="section-header">
                <h2>Account Settings</h2>
            </div>

            {/* Notifications Settings */}
            <div className="settings-subsection">
                <h3 className="subsection-title">Notifications</h3>

                <div className="setting-item">
                    <div className="setting-info">
                        <label className="setting-label">Email Notifications</label>
                        <p className="setting-description">
                            Get booking confirmations and reminders via email
                        </p>
                    </div>
                    <button
                        className={`toggle-switch ${emailNotifications ? 'on' : 'off'}`}
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        aria-label="Toggle email notifications"
                    >
                        <span className="toggle-circle"></span>
                    </button>
                </div>

                <div className="setting-item">
                    <div className="setting-info">
                        <label className="setting-label">
                            SMS Notifications
                            <span className="coming-soon-badge">Coming Soon</span>
                        </label>
                        <p className="setting-description">
                            Receive SMS updates for your bookings
                        </p>
                    </div>
                    <button
                        className="toggle-switch off disabled"
                        disabled
                        aria-label="SMS notifications (coming soon)"
                    >
                        <span className="toggle-circle"></span>
                    </button>
                </div>
            </div>

            {/* Language Preference */}
            <div className="settings-subsection">
                <h3 className="subsection-title">Language</h3>

                <div className="setting-item">
                    <div className="setting-info">
                        <label className="setting-label">Preferred Language</label>
                        <select className="language-select" disabled>
                            <option>English</option>
                        </select>
                        <p className="setting-description info-text">
                            More languages coming soon
                        </p>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-subsection danger-zone">
                <h3 className="subsection-title danger">Danger Zone</h3>

                <div className="setting-item">
                    <div className="setting-info">
                        <label className="setting-label">Delete Account</label>
                        <p className="setting-description">
                            Permanently delete your account and all your data. This action cannot be undone.
                        </p>
                    </div>
                    <button
                        className="delete-button"
                        onClick={() => setDeleteModalOpen(true)}
                    >
                        Delete My Account
                    </button>
                </div>
            </div>

            {/* Delete Account Modal */}
            {deleteModalOpen && (
                <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon danger">⚠️</div>
                        <h3>Delete Account?</h3>
                        <p>
                            Are you sure you want to delete your account? All your bookings, favorites,
                            and personal data will be permanently deleted. This action cannot be undone.
                        </p>
                        <div className="warning-box">
                            <strong>This will delete your account</strong>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="modal-button secondary"
                                onClick={() => setDeleteModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-button danger"
                                onClick={handleDeleteAccount}
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
