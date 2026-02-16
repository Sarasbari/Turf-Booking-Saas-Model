import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { OwnerData, TurfData } from '../../types/owner';
import styles from '../../styles/Owner/OwnerTurf.module.css';

export function OwnerTurf() {
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [turfData, setTurfData] = useState<TurfData | null>(null);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<TurfData>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            setLoading(true);

            const ownerDocRef = doc(db, 'owners', user.uid);
            const ownerDoc = await getDoc(ownerDocRef);
            
            if (!ownerDoc.exists()) return;
            
            const owner = ownerDoc.data() as OwnerData;
            setOwnerData(owner);

            const turfDocRef = doc(db, 'turf', owner.turfId);
            const turfDoc = await getDoc(turfDocRef);
            
            if (!turfDoc.exists()) return;
            
            const turf = { id: turfDoc.id, ...turfDoc.data() } as TurfData;
            setTurfData(turf);
            setFormData(turf);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (section: string) => {
        if (editingSection && editingSection !== section) {
            if (!confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }
        setEditingSection(section);
    };

    const handleCancel = () => {
        setFormData(turfData || {});
        setEditingSection(null);
    };

    const handleSave = async (section: string) => {
        if (!ownerData || !turfData) return;

        try {
            setSaving(true);

            const turfRef = doc(db, 'turf', ownerData.turfId);
            await updateDoc(turfRef, formData);

            setTurfData({ ...turfData, ...formData });
            setEditingSection(null);

            // Show success message
            alert('✅ Updated successfully');
        } catch (error) {
            console.error('Error saving turf data:', error);
            alert('Failed to update. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <div style={{ color: '#6B7280' }}>Loading turf details...</div>
            </div>
        );
    }

    if (!turfData) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                <div style={{ color: '#6B7280' }}>Unable to load turf data</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Turf</h1>
                <p className={styles.subtitle}>Manage your turf details and settings</p>
            </div>

            {/* About Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>About</h2>
                    <button 
                        className={styles.editButton}
                        onClick={() => handleEdit('about')}
                    >
                        ✏️ Edit
                    </button>
                </div>
                {editingSection === 'about' ? (
                    <>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: '12px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                        <div className={styles.formActions}>
                            <button 
                                className={styles.saveButton}
                                onClick={() => handleSave('about')}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button 
                                className={styles.cancelButton}
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <p style={{ color: '#6B7280', lineHeight: '1.6' }}>
                        {turfData.description || 'No description provided'}
                    </p>
                )}
            </div>

            {/* Location Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Location</h2>
                    <button 
                        className={styles.editButton}
                        onClick={() => handleEdit('location')}
                    >
                        ✏️ Edit
                    </button>
                </div>
                {editingSection === 'location' ? (
                    <>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                        Area
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.area || ''}
                                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city || ''}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <button 
                                className={styles.saveButton}
                                onClick={() => handleSave('location')}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button 
                                className={styles.cancelButton}
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ color: '#6B7280', fontSize: '14px' }}>
                        <p>{turfData.address}</p>
                        <p>{turfData.area}, {turfData.city}</p>
                    </div>
                )}
            </div>

            {/* Pricing Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Pricing</h2>
                    <button 
                        className={styles.editButton}
                        onClick={() => handleEdit('pricing')}
                    >
                        ✏️ Edit
                    </button>
                </div>
                {editingSection === 'pricing' ? (
                    <>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                    Price per Hour (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.pricePerHour || 0}
                                    onChange={(e) => setFormData({ ...formData, pricePerHour: parseInt(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <button 
                                className={styles.saveButton}
                                onClick={() => handleSave('pricing')}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button 
                                className={styles.cancelButton}
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#EA580C' }}>
                        ₹{turfData.pricePerHour}/hour
                    </div>
                )}
            </div>

            {/* Timings Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Timings</h2>
                    <button 
                        className={styles.editButton}
                        onClick={() => handleEdit('timings')}
                    >
                        ✏️ Edit
                    </button>
                </div>
                {editingSection === 'timings' ? (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                    Opening Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.openTime || ''}
                                    onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                    Closing Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.closeTime || ''}
                                    onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                    Weekly Off
                                </label>
                                <select
                                    value={formData.weeklyOff || ''}
                                    onChange={(e) => setFormData({ ...formData, weeklyOff: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="">None</option>
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                    <option value="Saturday">Saturday</option>
                                    <option value="Sunday">Sunday</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <button 
                                className={styles.saveButton}
                                onClick={() => handleSave('timings')}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button 
                                className={styles.cancelButton}
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ color: '#6B7280', fontSize: '14px' }}>
                        <p>Open: {turfData.openTime} - {turfData.closeTime}</p>
                        <p>Weekly Off: {turfData.weeklyOff || 'None'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
