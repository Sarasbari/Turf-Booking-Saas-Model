import { SlotType, BookingType } from '../../types/owner';

interface SlotItemProps {
    slot: SlotType;
    status: 'available' | 'booked' | 'blocked' | 'pending';
    booking?: BookingType;
    onBlock?: () => void;
    onUnblock?: () => void;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export function SlotItem({
    slot,
    status,
    booking,
    onBlock,
    onUnblock,
    onConfirm,
    onCancel
}: SlotItemProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'available':
                return {
                    icon: '🟢',
                    label: 'Available',
                    bg: '#ECFDF5',
                    border: '#10B981',
                    textColor: '#065F46'
                };
            case 'booked':
                return {
                    icon: '🔴',
                    label: 'Booked',
                    bg: '#FEF2F2',
                    border: '#DC2626',
                    textColor: '#991B1B'
                };
            case 'blocked':
                return {
                    icon: '⚫',
                    label: 'Blocked',
                    bg: '#F3F4F6',
                    border: '#6B7280',
                    textColor: '#374151'
                };
            case 'pending':
                return {
                    icon: '🟡',
                    label: 'Pending',
                    bg: '#FFFBEB',
                    border: '#F59E0B',
                    textColor: '#92400E'
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: booking ? '16px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: '#111827'
                    }}>
                        {slot.label}
                    </div>
                    <span style={{
                        padding: '4px 12px',
                        backgroundColor: config.bg,
                        color: config.textColor,
                        border: `1px solid ${config.border}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        {config.icon} {config.label}
                    </span>
                </div>
                <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                }}>
                    {slot.startTime} - {slot.endTime}
                </div>
            </div>

            {/* Booking details if booked or pending */}
            {booking && (status === 'booked' || status === 'pending') && (
                <div style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px'
                }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                        <img
                            src={booking.customerPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(booking.customerName)}
                            alt={booking.customerName}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                            }}
                        />
                        <div>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#111827',
                                marginBottom: '2px'
                            }}>
                                {booking.customerName}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: '#6B7280'
                            }}>
                                {booking.customerPhone}
                            </div>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        fontSize: '13px',
                        color: '#6B7280',
                        flexWrap: 'wrap'
                    }}>
                        <span>⚽ {booking.sport}</span>
                        <span>💰 ₹{booking.amount}</span>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {status === 'available' && onBlock && (
                    <button
                        onClick={onBlock}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: 'white',
                            color: '#6B7280',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#DC2626';
                            e.currentTarget.style.color = '#DC2626';
                            e.currentTarget.style.backgroundColor = '#FEF2F2';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#E5E7EB';
                            e.currentTarget.style.color = '#6B7280';
                            e.currentTarget.style.backgroundColor = 'white';
                        }}
                    >
                        🚫 Block Slot
                    </button>
                )}

                {status === 'blocked' && onUnblock && (
                    <button
                        onClick={onUnblock}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#EA580C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#C2410C'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EA580C'}
                    >
                        ✓ Unblock
                    </button>
                )}

                {(status === 'booked' || status === 'pending') && booking && (
                    <>
                        <a
                            href={`tel:${booking.customerPhone}`}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#EFF6FF',
                                color: '#3B82F6',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'background-color 0.2s',
                                display: 'inline-block'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                        >
                            📞 Call
                        </a>

                        {status === 'pending' && onConfirm && (
                            <button
                                onClick={onConfirm}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#EA580C',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#C2410C'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EA580C'}
                            >
                                ✓ Confirm
                            </button>
                        )}

                        {onCancel && (
                            <button
                                onClick={onCancel}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'white',
                                    color: '#DC2626',
                                    border: '1px solid #FEE2E2',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FEF2F2';
                                    e.currentTarget.style.borderColor = '#DC2626';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.borderColor = '#FEE2E2';
                                }}
                            >
                                ✕ Cancel
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
