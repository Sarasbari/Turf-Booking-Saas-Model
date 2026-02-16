import { BookingType } from '../../types/owner';

interface BookingCardProps {
    booking: BookingType;
    onConfirm?: () => void;
    onCancel?: () => void;
    showActions: boolean;
}

export function BookingCard({ booking, onConfirm, onCancel, showActions }: BookingCardProps) {
    const getStatusStyle = () => {
        switch (booking.status) {
            case 'confirmed':
                return {
                    backgroundColor: '#F0FDF4',
                    color: '#16A34A',
                    border: '1px solid #BBF7D0'
                };
            case 'pending':
                return {
                    backgroundColor: '#FFFBEB',
                    color: '#D97706',
                    border: '1px solid #FDE68A'
                };
            case 'cancelled':
                return {
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    border: '1px solid #FECACA'
                };
            default:
                return {
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280',
                    border: '1px solid #E5E7EB'
                };
        }
    };

    const statusStyle = getStatusStyle();

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
            e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
            <div style={{ display: 'flex', gap: '16px' }}>
                {/* Avatar */}
                <img
                    src={booking.customerPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(booking.customerName)}
                    alt={booking.customerName}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #F3F4F6'
                    }}
                />
                
                {/* Content */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#111827',
                                marginBottom: '4px'
                            }}>
                                {booking.customerName}
                            </div>
                            <div style={{
                                fontSize: '14px',
                                color: '#6B7280'
                            }}>
                                {booking.customerPhone}
                            </div>
                        </div>
                        <span style={{
                            ...statusStyle,
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'capitalize'
                        }}>
                            {booking.status}
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '16px',
                        marginBottom: '12px',
                        fontSize: '14px',
                        color: '#6B7280'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>⚽</span>
                            <span>{booking.sport}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📅</span>
                            <span>{new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>⏰</span>
                            <span>{booking.startTime} - {booking.endTime}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>💰</span>
                            <span style={{ fontWeight: 600, color: '#111827' }}>₹{booking.amount}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    {showActions && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                            >
                                📞 Call
                            </a>
                            <a
                                href={`https://wa.me/91${booking.customerPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#ECFDF5',
                                    color: '#10B981',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#D1FAE5'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ECFDF5'}
                            >
                                💬 WhatsApp
                            </a>
                            {booking.status === 'pending' && onConfirm && (
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
                            {(booking.status === 'pending' || booking.status === 'confirmed') && onCancel && (
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
