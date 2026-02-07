import { useState, useEffect } from 'react';
import { UserProfile } from '../../types/profile';
import { updateUserProfile, validatePhoneNumber } from '../../utils/firestoreUtils';
import './PersonalInfo.css';

interface PersonalInfoProps {
    userId: string;
    profile: UserProfile;
    onProfileUpdate: () => void;
}

export function PersonalInfo({ userId, profile, onProfileUpdate }: PersonalInfoProps) {
    // Split name into firstName and lastName
    const nameParts = profile.name?.split(' ') || ['', ''];
    const initialFirstName = profile.firstName || nameParts[0] || '';
    const initialLastName = profile.lastName || nameParts.slice(1).join(' ') || '';

    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const [phone, setPhone] = useState(profile.phone || '');
    const [birthday, setBirthday] = useState(profile.birthday || '');
    const [gender, setGender] = useState<'Woman' | 'Man' | ''>(profile.gender || '');

    const [editingPhone, setEditingPhone] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Track changes
    useEffect(() => {
        const changed =
            firstName !== initialFirstName ||
            lastName !== initialLastName ||
            phone !== (profile.phone || '') ||
            birthday !== (profile.birthday || '') ||
            gender !== (profile.gender || '');

        setHasChanges(changed);
    }, [firstName, lastName, phone, birthday, gender, initialFirstName, initialLastName, profile]);

    const handleSavePhone = () => {
        if (phone && !validatePhoneNumber(phone)) {
            setErrors({ ...errors, phone: 'Please enter a valid 10-digit phone number' });
            return;
        }
        setErrors({ ...errors, phone: '' });
        setEditingPhone(false);
    };

    const handleSave = async () => {
        // Validate required fields
        const newErrors: { [key: string]: string } = {};

        if (!firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (phone && !validatePhoneNumber(phone)) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setSaving(true);

            // Update profile with new fields
            await updateUserProfile(userId, {
                name: `${firstName} ${lastName}`.trim(),
                firstName,
                lastName,
                phone,
                birthday,
                gender: gender || undefined,
            });

            showToast('Profile updated successfully!', 'success');
            setHasChanges(false);
            onProfileUpdate();
        } catch (error) {
            showToast('Failed to save changes. Please try again.', 'error');
            console.error('Error saving profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    return (
        <div className="personal-info">
            {/* Profile Picture Section */}
            <div className="profile-picture-section">
                <img src={profile.picture} alt={profile.name} className="large-profile-pic" />
                <div className="profile-name-section">
                    <h2 className="profile-name">{profile.name}</h2>
                    <p className="profile-email">{profile.email}</p>
                </div>
            </div>

            {/* Account Details Section */}
            <section className="account-details">
                <h3>Account Details</h3>
                <div className="two-column">
                    {/* Mobile Number */}
                    <div className="field-group">
                        <label>
                            Mobile Number
                            {!editingPhone && (
                                <button className="edit-link" onClick={() => setEditingPhone(true)}>
                                    ✏️ Edit
                                </button>
                            )}
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={!editingPhone}
                            placeholder="Get tickets on Whatsapp/SMS"
                        />
                        {errors.phone && <span className="error-text">{errors.phone}</span>}
                        {editingPhone && (
                            <div className="field-actions">
                                <button className="action-btn save-btn" onClick={handleSavePhone}>
                                    Save
                                </button>
                                <button
                                    className="action-btn cancel-btn"
                                    onClick={() => {
                                        setEditingPhone(false);
                                        setPhone(profile.phone || '');
                                        setErrors({ ...errors, phone: '' });
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Email Address (Read-only) */}
                    <div className="field-group">
                        <label>
                            Email Address
                            <span className="edit-disabled">✏️ Edit</span>
                        </label>
                        <div className="input-with-icon">
                            <input type="email" value={profile.email} disabled />
                            <span className="verified-badge">✓</span>
                        </div>
                        <span className="field-hint">Email cannot be changed</span>
                    </div>
                </div>
            </section>

            {/* Personal Details Section */}
            <section className="personal-details">
                <h3>Personal Details</h3>

                {/* First Name + Last Name */}
                <div className="two-column">
                    <div className="field-group">
                        <label>First Name *</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => {
                                setFirstName(e.target.value);
                                setErrors({ ...errors, firstName: '' });
                            }}
                            placeholder="Enter first name here"
                            required
                        />
                        {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                    </div>
                    <div className="field-group">
                        <label>Last Name *</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => {
                                setLastName(e.target.value);
                                setErrors({ ...errors, lastName: '' });
                            }}
                            placeholder="Enter last name here"
                            required
                        />
                        {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                    </div>
                </div>

                {/* Birthday + Gender */}
                <div className="two-column">
                    <div className="field-group">
                        <label>Birthday (Optional)</label>
                        <input
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                        />
                    </div>
                    <div className="field-group">
                        <label>Identity (Optional)</label>
                        <div className="radio-pills">
                            <label className={gender === 'Woman' ? 'active' : ''}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="Woman"
                                    checked={gender === 'Woman'}
                                    onChange={(e) => setGender(e.target.value as 'Woman')}
                                />
                                Woman
                            </label>
                            <label className={gender === 'Man' ? 'active' : ''}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="Man"
                                    checked={gender === 'Man'}
                                    onChange={(e) => setGender(e.target.value as 'Man')}
                                />
                                Man
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            {/* Save Button */}
            <button
                className="save-changes-btn"
                onClick={handleSave}
                disabled={!hasChanges || saving}
            >
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
}
