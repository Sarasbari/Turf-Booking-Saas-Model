import { useState, useEffect } from 'react';
import { SlotType } from '@/types/owner';
import styles from '@/styles/Owner/OwnerSlots.module.css';

interface BookingFormData {
    customerName: string;
    customerPhone: string;
    sportType: string;
    teamName: string;
    amount: string;
    paymentMethod: string;
    notes: string;
}

interface BookSlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: BookingFormData) => Promise<void>;
    slot: SlotType & { date: string, price: number };
    groundName: string;
    editData?: BookingFormData;
}

export function BookSlotModal({ isOpen, onClose, onConfirm, slot, groundName, editData }: BookSlotModalProps) {
    const [formData, setFormData] = useState<BookingFormData>({
        customerName: '',
        customerPhone: '',
        sportType: '',
        teamName: '',
        amount: slot.price.toString(),
        paymentMethod: 'Cash',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Partial<BookingFormData>>({});

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({ ...editData });
            } else {
                setFormData({
                    customerName: '',
                    customerPhone: '',
                    sportType: '',
                    teamName: '',
                    amount: slot.price.toString(),
                    paymentMethod: 'Cash',
                    notes: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, slot.price, editData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name as keyof BookingFormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = () => {
        const newErrors: Partial<BookingFormData> = {};
        if (!formData.customerName.trim()) newErrors.customerName = 'Name is required';
        if (!formData.customerPhone.trim()) {
            newErrors.customerPhone = 'Phone is required';
        } else if (!/^\d{10}$/.test(formData.customerPhone)) {
            newErrors.customerPhone = 'Must be 10 digits';
        }
        if (!formData.sportType) newErrors.sportType = 'Sport is required';
        if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = 'Valid amount required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await onConfirm(formData);
            onClose();
        } catch (error) {
            console.error(error);
            // Handle error (maybe show toast in parent or here)
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatTime = (time: string) => {
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${display}:${m} ${ampm}`;
    };

    const formattedDate = new Date(slot.date).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    return (
        <>
            <div className={styles.popupOverlay} onClick={onClose}></div>
            <div className={styles.modalContent}> {/* Reusing popupContent or creating new modal style if needed, assuming styles exist or I reused logic */}
                {/* 
                   Wait, I need to check OwnerSlots.module.css to see if I can reuse classes 
                   or if I should define new inline styles for the MODAL since I can't easily edit CSS.
                   The prompt said "Light theme — do NOT change colors or existing styling".
                   I'll use inline styles for layout where specific classes might be missing, 
                   but try to reuse `popupHeader` etc if they fit, OR build a standard interaction modal.
                   Actually, `styles.popupOverlay` exists.
                   I will create a distinct modal look with inline styles for the box to ensure it centers.
                */}
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    width: '90%',
                    maxWidth: '500px',
                    zIndex: 1001,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '4px' }}>
                        {editData ? '✏️ Edit Booking' : 'Book Slot'} — {formatTime(slot.startTime)} to {formatTime(slot.endTime)}
                    </h2>
                    <p style={{ color: '#6B7280', marginBottom: '20px' }}>{groundName} · {formattedDate}</p>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Customer Name *</label>
                            <input
                                type="text"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                            />
                            {errors.customerName && <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>{errors.customerName}</span>}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Customer Phone *</label>
                            <input
                                type="text"
                                name="customerPhone"
                                value={formData.customerPhone}
                                onChange={handleChange}
                                maxLength={10}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                            />
                            {errors.customerPhone && <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>{errors.customerPhone}</span>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Sport Type *</label>
                                <select
                                    name="sportType"
                                    value={formData.sportType}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                                >
                                    <option value="">Select Sport</option>
                                    <option value="Football">Football</option>
                                    <option value="Cricket">Cricket</option>
                                    <option value="Badminton">Badminton</option>
                                    <option value="Basketball">Basketball</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.sportType && <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>{errors.sportType}</span>}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Team / Group Name</label>
                                <input
                                    type="text"
                                    name="teamName"
                                    value={formData.teamName}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Amount to Collect *</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '8px', color: '#6B7280' }}>₹</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '8px 12px 8px 28px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                                    />
                                </div>
                                {errors.amount && <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>{errors.amount}</span>}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Payment Method</label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Card">Card</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>Notes (optional)</label>
                            <input
                                type="text"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                            <button
                                onClick={onClose}
                                disabled={loading}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #D1D5DB',
                                    backgroundColor: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    backgroundColor: '#10B981',
                                    color: 'white',
                                    border: 'none',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? (editData ? 'Updating...' : 'Booking...') : (editData ? '✓ Update Booking' : '✓ Confirm Book')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
