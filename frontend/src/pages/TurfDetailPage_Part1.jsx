import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';

// Mock data fallback
const MOCK_TURF = {
    name: "Green Arena Turf",
    about: "Premium artificial grass turf perfect for 7-a-side football. Located in the heart of Andheri with easy access and ample parking. Features professional-grade floodlights for evening matches. Our turf is maintained to international standards with regular cleaning and maintenance schedules.",
    images: [
        "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800",
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
        "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800",
        "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800"
    ],
    pricePerHour: 600,
    status: "available",
    address: "Shop 5, Veera Desai Road, Andheri West",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400053",
    geoPoint: { latitude: 19.1136, longitude: 72.8697 },
    sports: ["Football", "Cricket"],
    groundSize: "7-a-side",
    totalGrounds: 2,
    amenities: ["Parking", "Floodlights", "Changing Room", "Washrooms", "Drinking Water", "First Aid"],
    openTime: "06:00",
    closeTime: "23:00",
    weeklyOff: null,
    ownerId: "owner123",
    ownerName: "PlayGround Sports Pvt Ltd",
    ownerPhone: "+91 9876543210",
    rating: 4.5,
    totalReviews: 234,
    totalBookings: 1567,
    bookingsLast30Days: 89,
    isUnderMaintenance: false,
    maintenanceNote: "",
    isDiscountActive: true,
    discountPercent: 20,
    discountDescription: "Early Bird Offer"
};

const COLORS = {
    heroBg: '#1a1a2e',
    primary: '#ea580c',
    primaryHover: '#dc2626',
    primaryLight: '#FFF7ED',
    available: '#27ae60',
    closed: '#e74c3c',
    maintenance: '#f39c12',
    pageBg: '#F5F5F5',
    cardBg: '#FFFFFF',
    text: '#333333',
    textSub: '#666666',
    textMuted: '#999999',
    border: '#E5E5E5',
};

// Utility functions
const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minutes} ${ampm}`;
};

const generateSlots = (openTime, closeTime) => {
    const slots = [];
    const start = parseInt(openTime?.split(':')[0] || '6');
    const end = parseInt(closeTime?.split(':')[0] || '23');

    for (let i = start; i < end; i += 2) {
        const startTime = `${i.toString().padStart(2, '0')}:00`;
        const endTime = `${(i + 2).toString().padStart(2, '0')}:00`;
        slots.push({
            start: startTime,
            end: endTime,
            label: `${formatTime(startTime)} - ${formatTime(endTime)}`
        });
    }
    return slots;
};

// Loading Skeleton Component
function LoadingSkeleton() {
    return (
        <div style={{ background: COLORS.heroBg, minHeight: '420px', padding: '48px 80px' }}>
            <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                <div style={{ width: '260px', height: '360px', background: '#2a2a3e', borderRadius: '8px' }} />
                <div style={{ flex: 1 }}>
                    <div style={{ height: '40px', background: '#2a2a3e', borderRadius: '8px', width: '70%', marginBottom: '16px' }} />
                    <div style={{ height: '20px', background: '#2a2a3e', borderRadius: '8px', width: '50%', marginBottom: '24px' }} />
                    <div style={{ height: '48px', background: '#2a2a3e', borderRadius: '8px', width: '180px' }} />
                </div>
                <div style={{ width: '320px', height: '280px', background: '#2a2a3e', borderRadius: '8px' }} />
            </div>
        </div>
    );
}

// Sticky Bar Component
function StickyBar({ show, name, city, rating, pricePerHour, onBookClick }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: COLORS.cardBg,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            padding: '12px 80px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transform: show ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.2s ease'
        }}>
            <div>
                <span style={{ fontWeight: 700, fontSize: '16px', color: COLORS.text }}>{name}</span>
                <span style={{ color: COLORS.textSub, fontSize: '14px', marginLeft: '8px' }}>· {city}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span style={{ fontSize: '14px' }}>⭐ {rating}</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: COLORS.primary }}>₹{pricePerHour}/hr</span>
                <button onClick={onBookClick} style={{
                    background: COLORS.primary,
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer'
                }}>
                    Book Now
                </button>
            </div>
        </div>
    );
}

// Image Gallery Component
function ImageGallery({ images, activeIndex, onImageChange, isDiscountActive, discountPercent, discountDescription, isUnderMaintenance, maintenanceNote }) {
    return (
        <div>
            <div style={{ position: 'relative', width: '260px', height: '360px' }}>
                <img
                    src={images[activeIndex]}
                    alt="Turf"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }}
                />

                {isDiscountActive && (
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                        padding: '14px',
                        borderRadius: '0 0 8px 8px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>
                            {discountPercent}% DISCOUNT
                        </div>
                        <div style={{ fontSize: '11px', color: 'white', opacity: 0.9 }}>
                            {discountDescription}
                        </div>
                    </div>
                )}

                {isUnderMaintenance && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.75)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px'
                    }}>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>
                            🔧 Under Maintenance
                        </div>
                        {maintenanceNote && (
                            <div style={{ color: '#ccc', fontSize: '13px', marginTop: '8px', textAlign: 'center', padding: '0 20px' }}>
                                {maintenanceNote}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {images.slice(0, 4).map((img, idx) => (
                    <img
                        key={idx}
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        onClick={() => onImageChange(idx)}
                        style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            opacity: activeIndex === idx ? 1 : 0.5,
                            border: activeIndex === idx ? `2px solid ${COLORS.primary}` : 'none',
                            transition: 'all 0.2s'
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// Turf Info Component
function TurfInfo({ name, sports, groundSize, totalGrounds, status, rating, totalReviews, totalBookings, isUnderMaintenance, maintenanceNote, onBookClick }) {
    const getStatusConfig = () => {
        if (isUnderMaintenance) return { bg: COLORS.maintenance, text: 'Maintenance' };
        if (status === 'available') return { bg: COLORS.available, text: 'Open Now ✓' };
        return { bg: COLORS.closed, text: 'Closed' };
    };

    const statusConfig = getStatusConfig();

    return (
        <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', marginBottom: '16px', margin: 0 }}>
                {name}
            </h1>

            {(isUnderMaintenance || maintenanceNote) && (
                <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                }}>
                    <span style={{ fontSize: '24px' }}>💡</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>Important Information</div>
                        <div style={{ color: '#ccc', fontSize: '12px' }}>{maintenanceNote || 'Under maintenance'}</div>
                    </div>
                    <span style={{ color: '#999' }}>›</span>
                </div>
            )}

            <div style={{ color: '#E0E0E0', fontSize: '16px', margin: '12px 0' }}>
                {sports.join(', ')}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '16px 0' }}>
                <span style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    {groundSize}
                </span>
                <span style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    {totalGrounds} Grounds
                </span>
                <span style={{
                    background: statusConfig.bg,
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 600
                }}>
                    {statusConfig.text}
                </span>
            </div>

            <div style={{ color: '#E0E0E0', fontSize: '14px', margin: '16px 0' }}>
                ⭐ {rating} · {totalReviews} ratings · {totalBookings.toLocaleString()} bookings
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                    onClick={onBookClick}
                    disabled={isUnderMaintenance || status === 'closed'}
                    style={{
                        background: isUnderMaintenance || status === 'closed' ? '#666' : COLORS.primary,
                        color: 'white',
                        border: 'none',
                        padding: '14px 48px',
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: 700,
                        cursor: isUnderMaintenance || status === 'closed' ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {isUnderMaintenance ? 'Not Available' : status === 'closed' ? 'Currently Closed' : 'Book Now'}
                </button>
                <button style={{
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'transparent',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                }}>
                    ↗ Share
                </button>
            </div>
        </div>
    );
}

// Promo Banner Component
function PromoBanner({ isDiscountActive, discountPercent, discountDescription, totalBookings, bookingsLast30Days, openTime, closeTime, city }) {
    if (isDiscountActive) {
        return (
            <div style={{
                background: '#0d0d0d',
                borderRadius: '8px',
                padding: '32px 24px',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#f39c12',
                    letterSpacing: '-1px',
                    marginBottom: '8px'
                }}>
                    {discountDescription}
                </div>
                <div style={{
                    fontSize: '11px',
                    color: '#999',
                    letterSpacing: '3px',
                    marginBottom: '20px'
                }}>
                    EXCLUSIVE LIMITED TIME DEAL
                </div>
                <div style={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '16px 20px'
                }}>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>USE CODE</div>
                    <div style={{ color: 'white', fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>TURF20</div>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>
                        GET {discountPercent}% DISCOUNT
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '8px',
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
        }}>
            {[
                { icon: '📅', value: totalBookings.toLocaleString(), label: 'Total Bookings' },
                { icon: '📊', value: bookingsLast30Days, label: 'This Month' },
                { icon: '⏰', value: `${formatTime(openTime)} – ${formatTime(closeTime)}`, label: 'Hours' },
                { icon: '📍', value: city, label: 'Location' }
            ].map((stat, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                        {stat.value}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{stat.label}</div>
                </div>
            ))}
        </div>
    );
}

// Continue in next message...
