import { useState, useEffect } from 'react';
import { UserProfile } from '../../../types/profile';
import { updateUserProfile, validatePhoneNumber } from '../../../utils/firestoreUtils';
import './PersonalInfo.css';

interface PersonalInfoProps {
    userId: string;
    profile: UserProfile;
    onProfileUpdate: () => void;
}

const timeWindowOptions = [
    { value: 'weekday-morning', label: 'Weekday Morning' },
    { value: 'weekday-evening', label: 'Weekday Evening' },
    { value: 'weekend-morning', label: 'Weekend Morning' },
    { value: 'weekend-evening', label: 'Weekend Evening' },
] as const;

export function PersonalInfo({ userId, profile, onProfileUpdate }: PersonalInfoProps) {
    const nameParts = profile.name?.split(' ') || ['', ''];
    const initialFirstName = profile.firstName || nameParts[0] || '';
    const initialLastName = profile.lastName || nameParts.slice(1).join(' ') || '';

    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const [phone, setPhone] = useState(profile.phone || '');
    const [birthday, setBirthday] = useState(profile.birthday || '');
    const [gender, setGender] = useState<'Woman' | 'Man' | ''>(profile.gender || '');
    const [preferredLocation, setPreferredLocation] = useState(profile.preferredLocation || '');
    const [favoriteSport, setFavoriteSport] = useState(profile.favoriteSport || '');
    const [preferredTurfSize, setPreferredTurfSize] = useState<'5-a-side' | '7-a-side' | '11-a-side' | ''>(
        profile.preferredTurfSize || ''
    );

    const [primaryGoal, setPrimaryGoal] = useState<'fitness' | 'fun' | 'competitive' | 'practice' | 'social' | ''>(
        profile.primaryGoal || ''
    );
    const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | ''>(
        profile.skillLevel || ''
    );
    const [groupType, setGroupType] = useState<'solo' | 'friends' | 'team' | ''>(profile.groupType || '');
    const [preferredTimeWindows, setPreferredTimeWindows] = useState<string[]>(profile.preferredTimeWindows || []);
    const [maxBudgetPerSession, setMaxBudgetPerSession] = useState<string>(
        profile.maxBudgetPerSession ? String(profile.maxBudgetPerSession) : ''
    );
    const [maxTravelDistanceKm, setMaxTravelDistanceKm] = useState<string>(
        profile.maxTravelDistanceKm ? String(profile.maxTravelDistanceKm) : ''
    );
    const [surfacePreference, setSurfacePreference] = useState<
        'natural-grass' | 'artificial-turf' | 'hard-court' | 'any' | ''
    >(profile.surfacePreference || '');
    const [lightingPreference, setLightingPreference] = useState<'daylight' | 'floodlights' | 'any' | ''>(
        profile.lightingPreference || ''
    );
    const [venueTypePreference, setVenueTypePreference] = useState<'indoor' | 'outdoor' | 'any' | ''>(
        profile.venueTypePreference || ''
    );
    const [playFrequencyPerWeek, setPlayFrequencyPerWeek] = useState<string>(
        profile.playFrequencyPerWeek ? String(profile.playFrequencyPerWeek) : ''
    );
    const [preferredSessionDurationHours, setPreferredSessionDurationHours] = useState<string>(
        profile.preferredSessionDurationHours ? String(profile.preferredSessionDurationHours) : ''
    );

    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const arrayChanged =
            preferredTimeWindows.length !== (profile.preferredTimeWindows || []).length ||
            preferredTimeWindows.some((item) => !(profile.preferredTimeWindows || []).includes(item));

        const changed =
            firstName !== initialFirstName ||
            lastName !== initialLastName ||
            phone !== (profile.phone || '') ||
            birthday !== (profile.birthday || '') ||
            gender !== (profile.gender || '') ||
            preferredLocation !== (profile.preferredLocation || '') ||
            favoriteSport !== (profile.favoriteSport || '') ||
            preferredTurfSize !== (profile.preferredTurfSize || '') ||
            primaryGoal !== (profile.primaryGoal || '') ||
            skillLevel !== (profile.skillLevel || '') ||
            groupType !== (profile.groupType || '') ||
            maxBudgetPerSession !== (profile.maxBudgetPerSession ? String(profile.maxBudgetPerSession) : '') ||
            maxTravelDistanceKm !== (profile.maxTravelDistanceKm ? String(profile.maxTravelDistanceKm) : '') ||
            surfacePreference !== (profile.surfacePreference || '') ||
            lightingPreference !== (profile.lightingPreference || '') ||
            venueTypePreference !== (profile.venueTypePreference || '') ||
            playFrequencyPerWeek !== (profile.playFrequencyPerWeek ? String(profile.playFrequencyPerWeek) : '') ||
            preferredSessionDurationHours !==
            (profile.preferredSessionDurationHours ? String(profile.preferredSessionDurationHours) : '') ||
            arrayChanged;

        setHasChanges(changed);
    }, [
        firstName,
        lastName,
        phone,
        birthday,
        gender,
        preferredLocation,
        favoriteSport,
        preferredTurfSize,
        primaryGoal,
        skillLevel,
        groupType,
        preferredTimeWindows,
        maxBudgetPerSession,
        maxTravelDistanceKm,
        surfacePreference,
        lightingPreference,
        venueTypePreference,
        playFrequencyPerWeek,
        preferredSessionDurationHours,
        initialFirstName,
        initialLastName,
        profile,
    ]);

    const toggleTimeWindow = (window: string) => {
        setPreferredTimeWindows((prev) =>
            prev.includes(window) ? prev.filter((item) => item !== window) : [...prev, window]
        );
    };

    const handleSave = async () => {
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

        if (maxBudgetPerSession && Number(maxBudgetPerSession) <= 0) {
            newErrors.maxBudgetPerSession = 'Budget should be greater than 0';
        }

        if (maxTravelDistanceKm && Number(maxTravelDistanceKm) <= 0) {
            newErrors.maxTravelDistanceKm = 'Distance should be greater than 0';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setSaving(true);

            await updateUserProfile(userId, {
                name: `${firstName} ${lastName}`.trim(),
                email: profile.email,
                firstName,
                lastName,
                phone,
                birthday,
                gender: gender || undefined,
                preferredLocation,
                favoriteSport,
                preferredTurfSize: preferredTurfSize || undefined,
                primaryGoal: primaryGoal || undefined,
                skillLevel: skillLevel || undefined,
                groupType: groupType || undefined,
                preferredTimeWindows,
                maxBudgetPerSession: maxBudgetPerSession ? Number(maxBudgetPerSession) : undefined,
                maxTravelDistanceKm: maxTravelDistanceKm ? Number(maxTravelDistanceKm) : undefined,
                surfacePreference: surfacePreference || undefined,
                lightingPreference: lightingPreference || undefined,
                venueTypePreference: venueTypePreference || undefined,
                playFrequencyPerWeek: playFrequencyPerWeek ? Number(playFrequencyPerWeek) as 1 | 2 | 3 | 4 | 5 | 6 | 7 : undefined,
                preferredSessionDurationHours: preferredSessionDurationHours ? Number(preferredSessionDurationHours) as 1 | 2 | 3 : undefined,
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
            <header className="profile-hero">
                <div className="profile-picture-section">
                    <img
                        src={profile.picture || 'https://ui-avatars.com/api/?name=User&background=fde68a&color=78350f'}
                        alt={profile.name}
                        className="large-profile-pic"
                    />
                    <div className="profile-name-section">
                        <h2 className="profile-name">{profile.name}</h2>
                        <p className="profile-email">{profile.email}</p>
                        <p className="profile-subtitle">Refine your profile to unlock smarter turf and slot recommendations.</p>
                    </div>
                </div>
            </header>

            <section className="account-details">
                <h3>Account Details</h3>
                <div className="two-column">
                    <div className="field-group">
                        <label>Mobile Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Get booking updates on WhatsApp/SMS"
                        />
                        {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>

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

            <section className="personal-details">
                <h3>Personal Details</h3>
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

            <section className="preferences-details">
                <h3>Play Preferences</h3>
                <div className="two-column">
                    <div className="field-group">
                        <label>Preferred Location</label>
                        <input
                            type="text"
                            value={preferredLocation}
                            onChange={(e) => setPreferredLocation(e.target.value)}
                            placeholder="e.g. Koramangala, Bangalore"
                        />
                    </div>
                    <div className="field-group">
                        <label>Favorite Sport</label>
                        <input
                            type="text"
                            value={favoriteSport}
                            onChange={(e) => setFavoriteSport(e.target.value)}
                            placeholder="e.g. Football"
                        />
                    </div>
                </div>

                <div className="two-column">
                    <div className="field-group">
                        <label>Preferred Turf Size</label>
                        <select value={preferredTurfSize} onChange={(e) => setPreferredTurfSize(e.target.value as '5-a-side' | '7-a-side' | '11-a-side' | '')}>
                            <option value="">Select turf size</option>
                            <option value="5-a-side">5-a-side</option>
                            <option value="7-a-side">7-a-side</option>
                            <option value="11-a-side">11-a-side</option>
                        </select>
                    </div>
                    <div className="field-group">
                        <label>Primary Goal</label>
                        <select value={primaryGoal} onChange={(e) => setPrimaryGoal(e.target.value as 'fitness' | 'fun' | 'competitive' | 'practice' | 'social' | '')}>
                            <option value="">Select goal</option>
                            <option value="fitness">Fitness</option>
                            <option value="fun">Fun</option>
                            <option value="competitive">Competitive</option>
                            <option value="practice">Practice</option>
                            <option value="social">Social</option>
                        </select>
                    </div>
                </div>

                <div className="two-column">
                    <div className="field-group">
                        <label>Skill Level</label>
                        <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced' | '')}>
                            <option value="">Select skill level</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    <div className="field-group">
                        <label>Group Type</label>
                        <select value={groupType} onChange={(e) => setGroupType(e.target.value as 'solo' | 'friends' | 'team' | '')}>
                            <option value="">Select group type</option>
                            <option value="solo">Solo</option>
                            <option value="friends">Friends</option>
                            <option value="team">Team</option>
                        </select>
                    </div>
                </div>

                <div className="two-column">
                    <div className="field-group">
                        <label>Max Budget Per Session (INR)</label>
                        <input
                            type="number"
                            min="0"
                            value={maxBudgetPerSession}
                            onChange={(e) => setMaxBudgetPerSession(e.target.value)}
                            placeholder="e.g. 1200"
                        />
                        {errors.maxBudgetPerSession && <span className="error-text">{errors.maxBudgetPerSession}</span>}
                    </div>
                    <div className="field-group">
                        <label>Max Travel Distance (km)</label>
                        <input
                            type="number"
                            min="0"
                            value={maxTravelDistanceKm}
                            onChange={(e) => setMaxTravelDistanceKm(e.target.value)}
                            placeholder="e.g. 8"
                        />
                        {errors.maxTravelDistanceKm && <span className="error-text">{errors.maxTravelDistanceKm}</span>}
                    </div>
                </div>

                <div className="two-column">
                    <div className="field-group">
                        <label>Surface Preference</label>
                        <select value={surfacePreference} onChange={(e) => setSurfacePreference(e.target.value as 'natural-grass' | 'artificial-turf' | 'hard-court' | 'any' | '')}>
                            <option value="">Select surface</option>
                            <option value="natural-grass">Natural Grass</option>
                            <option value="artificial-turf">Artificial Turf</option>
                            <option value="hard-court">Hard Court</option>
                            <option value="any">Any</option>
                        </select>
                    </div>
                    <div className="field-group">
                        <label>Lighting Preference</label>
                        <select value={lightingPreference} onChange={(e) => setLightingPreference(e.target.value as 'daylight' | 'floodlights' | 'any' | '')}>
                            <option value="">Select lighting</option>
                            <option value="daylight">Daylight</option>
                            <option value="floodlights">Floodlights</option>
                            <option value="any">Any</option>
                        </select>
                    </div>
                </div>

                <div className="two-column">
                    <div className="field-group">
                        <label>Venue Type Preference</label>
                        <select value={venueTypePreference} onChange={(e) => setVenueTypePreference(e.target.value as 'indoor' | 'outdoor' | 'any' | '')}>
                            <option value="">Select venue type</option>
                            <option value="indoor">Indoor</option>
                            <option value="outdoor">Outdoor</option>
                            <option value="any">Any</option>
                        </select>
                    </div>
                    <div className="field-group">
                        <label>Play Frequency (per week)</label>
                        <select value={playFrequencyPerWeek} onChange={(e) => setPlayFrequencyPerWeek(e.target.value)}>
                            <option value="">Select frequency</option>
                            <option value="1">1 time</option>
                            <option value="2">2 times</option>
                            <option value="3">3 times</option>
                            <option value="4">4 times</option>
                            <option value="5">5 times</option>
                            <option value="6">6 times</option>
                            <option value="7">7 times</option>
                        </select>
                    </div>
                </div>

                <div className="two-column">
                    <div className="field-group">
                        <label>Preferred Session Duration</label>
                        <select value={preferredSessionDurationHours} onChange={(e) => setPreferredSessionDurationHours(e.target.value)}>
                            <option value="">Select duration</option>
                            <option value="1">1 hour</option>
                            <option value="2">2 hours</option>
                            <option value="3">3 hours</option>
                        </select>
                    </div>
                    <div className="field-group">
                        <label>Preferred Time Windows</label>
                        <div className="checkbox-grid">
                            {timeWindowOptions.map((option) => (
                                <label className="checkbox-item" key={option.value}>
                                    <input
                                        type="checkbox"
                                        checked={preferredTimeWindows.includes(option.value)}
                                        onChange={() => toggleTimeWindow(option.value)}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

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
