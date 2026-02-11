import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTurfById } from '../firebase/turfs';

export default function TurfDetailPage() {
    const { turfId } = useParams();
    const navigate = useNavigate();

    const [turf, setTurf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Fetch turf data from Firebase
    useEffect(() => {
        const fetchTurf = async () => {
            try {
                setLoading(true);
                setError(null);
                const turfData = await getTurfById(turfId);
                setTurf(turfData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching turf:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (turfId) {
            fetchTurf();
        }
    }, [turfId]);

    // Set default date
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
    }, []);

    if (loading) {
        return (
            <div style={{ background: '#1a1a2e', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚽</div>
                    <div style={{ fontSize: '18px' }}>Loading turf details...</div>
                </div>
            </div>
        );
    }

    if (error || !turf) {
        return (
            <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏟️</div>
                    <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Turf Not Found</h2>
                    <p style={{ color: '#666', marginBottom: '24px' }}>{error || 'This turf may no longer be available'}</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: '#ea580c',
                            color: 'white',
                            border: 'none',
                            padding: '12px 32px',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Extract data from turf
    const {
        name,
        description,
        images = [],
        coverImage,
        sport,
        turfSize,
        location = {},
        amenities = [],
        pricing = {},
        operatingHours = {},
        ownerName,
        ownerPhone,
        rating = 0,
        totalReviews = 0,
        totalBookings = 0,
        status
    } = turf;

    const displayImages = images.length > 0 ? images : [coverImage];
    const mainImage = displayImages[activeImageIndex] || coverImage;
    const pricePerHour = pricing.basePrice || 0;
    const openTime = operatingHours.opensAt || '06:00';
    const closeTime = operatingHours.closesAt || '23:00';

    // Generate time slots
    const generateSlots = () => {
        const slots = [];
        const start = parseInt(openTime.split(':')[0]);
        const end = parseInt(closeTime.split(':')[0]);

        for (let i = start; i < end; i += 2) {
            const startTime = `${i.toString().padStart(2, '0')}:00`;
            const endTime = `${(i + 2).toString().padStart(2, '0')}:00`;
            const formatTime = (time) => {
                const [hours] = time.split(':');
                const h = parseInt(hours);
                const ampm = h >= 12 ? 'PM' : 'AM';
                const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
                return `${displayHour}:00 ${ampm}`;
            };
            slots.push({
                start: startTime,
                end: endTime,
                label: `${formatTime(startTime)}\n${formatTime(endTime)}`
            });
        }
        return slots;
    };

    const slots = generateSlots();

    // Calculate total
    const calculateTotal = () => {
        if (!selectedSlot) return { basePrice: 0, total: 0 };
        const basePrice = pricePerHour * 2;
        return { basePrice, total: basePrice };
    };

    const pricing_calc = calculateTotal();

    return (
        <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
            {/* Hero Section - BookMyShow Style */}
            <div style={{
                background: '#1a1a2e',
                padding: '48px 80px',
                minHeight: '420px',
                display: 'grid',
                gridTemplateColumns: '280px 1fr 320px',
                gap: '40px',
                alignItems: 'center'
            }}>
                {/* Left - Portrait Image */}
                <div>
                    <div style={{ position: 'relative', width: '260px', height: '360px' }}>
                        <img
                            src={mainImage}
                            alt={name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                            }}
                        />
                    </div>

                    {/* Thumbnails */}
                    {displayImages.length > 1 && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            {displayImages.slice(0, 4).map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Thumbnail ${idx + 1}`}
                                    onClick={() => setActiveImageIndex(idx)}
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        objectFit: 'cover',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        opacity: activeImageIndex === idx ? 1 : 0.5,
                                        border: activeImageIndex === idx ? '2px solid #ea580c' : 'none'
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Center - Turf Info */}
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px 0' }}>
                        {name}
                    </h1>

                    <div style={{ color: '#E0E0E0', fontSize: '16px', margin: '12px 0' }}>
                        {sport}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '16px 0' }}>
                        <span style={{
                            background: 'rgba(255,255,255,0.15)',
                            color: 'white',
                            padding: '6px 16px',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}>
                            {turfSize}
                        </span>
                        <span style={{
                            background: status === 'active' ? '#27ae60' : '#e74c3c',
                            color: 'white',
                            padding: '6px 16px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: 600
                        }}>
                            {status === 'active' ? 'Open Now ✓' : 'Closed'}
                        </span>
                    </div>

                    <div style={{ color: '#E0E0E0', fontSize: '14px', margin: '16px 0' }}>
                        ⭐ {rating.toFixed(1)} · {totalReviews} ratings · {totalBookings} bookings
                    </div>

                    <button
                        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                        style={{
                            background: '#ea580c',
                            color: 'white',
                            border: 'none',
                            padding: '14px 48px',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginTop: '8px'
                        }}
                    >
                        Book Now
                    </button>
                </div>

                {/* Right - Promo */}
                <div style={{
                    background: '#0d0d0d',
                    borderRadius: '8px',
                    padding: '32px 24px',
                    textAlign: 'center',
                    border: '1px solid #222'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏟️</div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>Book your slot now!</div>
                    <div style={{ color: '#999', fontSize: '14px', marginTop: '8px' }}>
                        ₹{pricePerHour}/hour
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', alignItems: 'start' }}>

                    {/* Left Column */}
                    <div>
                        {/* About */}
                        <section style={{ marginBottom: '48px', paddingBottom: '48px', borderBottom: '1px solid #F0F0F0' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#333' }}>About This Turf</h2>
                            <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.8, margin: 0 }}>
                                {description}
                            </p>
                        </section>

                        {/* Amenities */}
                        <section style={{ marginBottom: '48px', paddingBottom: '48px', borderBottom: '1px solid #F0F0F0' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#333' }}>Amenities</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                {amenities.map((amenity, idx) => (
                                    <div key={idx} style={{
                                        background: '#F8F9FA',
                                        border: '1px solid #EEEEEE',
                                        borderRadius: '12px',
                                        padding: '20px 16px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                                            {amenity === 'Parking' ? '🚗' : amenity === 'Floodlights' ? '💡' :
                                                amenity === 'Changing Room' ? '👕' : amenity === 'Water' ? '💧' :
                                                    amenity === 'First Aid' ? '🏥' : amenity === 'Cafeteria' ? '☕' : '✓'}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}>{amenity}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Location */}
                        <section>
                            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#333' }}>Location</h2>
                            <div style={{
                                background: '#F8F9FA',
                                borderRadius: '12px',
                                padding: '20px'
                            }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: '#333' }}>
                                    {location.address}
                                </div>
                                <div style={{ fontSize: '13px', color: '#666' }}>
                                    {location.city}, {location.pincode}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Booking Card */}
                    <div style={{
                        position: 'sticky',
                        top: '88px',
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                        border: '1px solid #EEEEEE',
                        padding: '24px'
                    }}>
                        <div style={{ marginBottom: '24px' }}>
                            <span style={{ fontSize: '28px', fontWeight: 800, color: '#333' }}>₹{pricePerHour}</span>
                            <span style={{ fontSize: '14px', color: '#666', marginLeft: '4px' }}>/hour</span>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                SELECT DATE
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    border: '1px solid #E5E5E5',
                                    borderRadius: '8px',
                                    padding: '0 16px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                AVAILABLE SLOTS <span style={{ fontWeight: 400, color: '#999' }}>(2 hr sessions)</span>
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                                {slots.map((slot, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedSlot(slot)}
                                        style={{
                                            height: '52px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            border: selectedSlot?.start === slot.start ? 'none' : '1px solid #E5E5E5',
                                            background: selectedSlot?.start === slot.start ? '#ea580c' : 'white',
                                            color: selectedSlot?.start === slot.start ? 'white' : '#333',
                                            fontWeight: selectedSlot?.start === slot.start ? 600 : 400,
                                            cursor: 'pointer',
                                            whiteSpace: 'pre-line',
                                            lineHeight: '1.3'
                                        }}
                                    >
                                        {slot.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedSlot && (
                            <div style={{
                                background: '#FFF7ED',
                                border: '1px solid #FDBA74',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '16px',
                                fontSize: '14px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#666' }}>📅 Date</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#666' }}>⏰ Time</span>
                                    <span style={{ fontWeight: 600 }}>{selectedSlot.label.replace('\n', ' - ')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#666' }}>⏳ Duration</span>
                                    <span style={{ fontWeight: 600 }}>2 hours</span>
                                </div>
                                <div style={{
                                    borderTop: '1px solid #FDBA74',
                                    paddingTop: '8px',
                                    marginTop: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    color: '#333'
                                }}>
                                    <span>Total</span>
                                    <span style={{ color: '#ea580c' }}>₹{pricing_calc.total}</span>
                                </div>
                            </div>
                        )}

                        <button
                            disabled={!selectedSlot}
                            onClick={() => alert(`Booking confirmed!\nTurf: ${name}\nDate: ${selectedDate}\nSlot: ${selectedSlot?.label.replace('\n', ' - ')}\nTotal: ₹${pricing_calc.total}`)}
                            style={{
                                width: '100%',
                                height: '52px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 700,
                                border: 'none',
                                background: !selectedSlot ? '#CCCCCC' : '#ea580c',
                                color: 'white',
                                cursor: !selectedSlot ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {!selectedSlot ? 'Select a time slot' : 'Proceed to Book →'}
                        </button>

                        <div style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '12px' }}>
                            💰 Pay on arrival · ✓ Free cancellation 24hrs before
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
