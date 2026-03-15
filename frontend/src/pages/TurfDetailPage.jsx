import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, onSnapshot, query, orderBy, limit, getDocs, where, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { auth } from '../services/firebase';
import { createOrder, openRazorpayCheckout } from '../services/paymentService';
import { Header } from '../components/layout/Header/Header';
import './TurfDetailPage.css';

// ── Icons (inline SVGs) ────────────────────────────────────────────────────
const IconStar = ({ filled = true }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
        className={filled ? 'star--filled' : 'star--empty'}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);

const IconMapPin = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

const IconClock = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
    </svg>
);

const IconCalendar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
    </svg>
);

const IconShare = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
    </svg>
);

const IconInfo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);

const IconTrend = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const IconClipboard = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);

// ── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

/**
 * Normalize Firestore data — handles BOTH schemas:
 *  1) seedTurf1 schema (flat: pricePerHour, address, city, openTime, etc.)
 *  2) seedSampleTurfs schema (nested: pricing.basePrice, location.city, operatingHours.opensAt, etc.)
 */
const normalizeTurf = (id, data) => ({
    id,
    name: data.name || 'Unnamed Turf',
    about: data.about || data.description || '',
    images: data.images || (data.coverImage ? [data.coverImage] : []),
    sports: data.sports || (data.sport ? [data.sport] : []),
    groundSize: data.groundSize || data.turfSize || '5-a-side',
    totalGrounds: data.totalGrounds || 1,
    status: data.status === 'active' ? 'available' : (data.status || 'closed'),
    rating: data.rating || 0,
    totalReviews: data.totalReviews || 0,
    totalBookings: data.totalBookings || 0,
    bookingsLast30Days: data.bookingsLast30Days || 0,
    pricePerHour: data.pricePerHour || data.pricing?.basePrice || 0,
    priceRange: data.priceRange || '',
    openTime: data.openTime || data.operatingHours?.opensAt || '06:00',
    closeTime: data.closeTime || data.operatingHours?.closesAt || '22:00',
    weeklyOff: data.weeklyOff || null,
    amenities: data.amenities || [],
    address: data.address || data.location?.address || '',
    city: data.city || data.location?.city || '',
    state: data.state || data.location?.state || '',
    pincode: data.pincode || data.location?.pincode || '',
    geoPoint: data.geoPoint
        ? { latitude: data.geoPoint.latitude || data.geoPoint._lat, longitude: data.geoPoint.longitude || data.geoPoint._long }
        : (data.location?.coordinates
            ? { latitude: data.location.coordinates.lat, longitude: data.location.coordinates.lng }
            : null),
    ownerName: data.ownerName || '',
    ownerPhone: data.ownerPhone || '',
    website: data.website || '',
    area: data.area || '',
    isDiscountActive: data.isDiscountActive || false,
    discountPercent: data.discountPercent || 0,
    discountDescription: data.discountDescription || '',
    isUnderMaintenance: data.isUnderMaintenance || false,
    maintenanceNote: data.maintenanceNote || '',
});

// ── Amenity icon map ────────────────────────────────────────────────────────
const AMENITY_ICONS = {
    "Parking": "🚗", "Floodlights": "💡", "Changing Room": "👕",
    "Washrooms": "🚿", "Drinking Water": "💧", "First Aid Kit": "🏥",
    "First Aid": "🏥", "Seating Area": "🪑", "Seating": "🪑",
    "AC": "❄️", "Cafeteria": "☕", "WiFi": "📶",
    "Water": "💧", "Equipment Rental": "⚽", "Scoreboard": "📊",
};

const getSportChipClass = (sport) => {
    const s = sport.toLowerCase();
    if (s === 'cricket') return 'td-sports__chip--cricket';
    if (s === 'football') return 'td-sports__chip--football';
    if (s === 'volleyball') return 'td-sports__chip--volleyball';
    if (s === 'pickleball') return 'td-sports__chip--pickleball';
    if (s.includes('multi')) return 'td-sports__chip--multi-sport';
    return 'td-sports__chip--default';
};


// ═══════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function HeroSection({ turf, activeImg, setActiveImg }) {
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: turf.name, text: `Check out ${turf.name} on TurfBookaro!`, url: window.location.href }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const statusClass =
        turf.status === 'available' ? 'td-hero__tag--open' :
            turf.status === 'closed' ? 'td-hero__tag--closed' : 'td-hero__tag--maintenance';
    const statusLabel =
        turf.status === 'available' ? 'Open Now ✓' :
            turf.status === 'closed' ? 'Closed' : 'Maintenance';

    return (
        <section className="td-hero">
            {/* Blurred background from active image */}
            {turf.images?.[activeImg] && (
                <div
                    className="td-hero__bg-blur"
                    style={{ backgroundImage: `url(${turf.images[activeImg]})` }}
                />
            )}

            <div className="td-hero__inner">

                {/* ── LEFT: Landscape image + thumbnail strip ── */}
                <div className="td-hero__media">
                    <div className="td-hero__poster-main">
                        <img
                            src={turf.images?.[activeImg] || 'https://via.placeholder.com/520x300?text=No+Image'}
                            alt={turf.name}
                        />
                        {turf.isDiscountActive && (
                            <div className="td-hero__poster-badge">
                                <div className="td-hero__poster-badge-title">{turf.discountPercent}% DISCOUNT</div>
                                <div className="td-hero__poster-badge-sub">{turf.discountDescription}</div>
                            </div>
                        )}
                        {turf.isUnderMaintenance && (
                            <div className="td-hero__poster-maintenance">
                                <div className="td-hero__poster-maintenance-icon">🔧</div>
                                <div className="td-hero__poster-maintenance-title">Under Maintenance</div>
                                <div className="td-hero__poster-maintenance-note">{turf.maintenanceNote}</div>
                            </div>
                        )}
                    </div>
                    <div className="td-hero__thumbs">
                        {turf.images?.slice(0, 5).map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImg(idx)}
                                className={`td-hero__thumb ${activeImg === idx ? 'td-hero__thumb--active' : ''}`}
                            >
                                <img src={img} alt={`Thumbnail ${idx + 1}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT: Info ── */}
                <div className="td-hero__info">

                    {(turf.isUnderMaintenance || turf.maintenanceNote) && (
                        <div className="td-hero__notice">
                            <IconInfo />
                            <div>
                                <div className="td-hero__notice-label">Important Information</div>
                                <div className="td-hero__notice-text">{turf.maintenanceNote}</div>
                            </div>
                        </div>
                    )}

                    <div className="td-hero__meta">{turf.sports?.join(' · ')}</div>
                    <h1 className="td-hero__name">{turf.name}</h1>

                    <div className="td-hero__tags">
                        <span className="td-hero__tag">{turf.groundSize}</span>
                        <span className="td-hero__tag">{turf.totalGrounds} Ground{turf.totalGrounds > 1 ? 's' : ''}</span>
                        <span className={`td-hero__tag td-hero__tag--status ${statusClass}`}>{statusLabel}</span>
                    </div>

                    <div className="td-hero__rating-row">
                        <div className="td-hero__rating-star"><span>⭐</span> {turf.rating}</div>
                        <span className="td-hero__rating-dot">·</span>
                        <span>{turf.totalReviews} ratings</span>
                        <span className="td-hero__rating-dot">·</span>
                        <span>{turf.totalBookings?.toLocaleString()} bookings</span>
                    </div>

                    {/* Inline stats strip */}
                    {turf.isDiscountActive ? (
                        <div className="td-hero__deal">
                            <div className="td-hero__deal-title">{turf.discountDescription}</div>
                            <div className="td-hero__deal-label">EXCLUSIVE LIMITED TIME DEAL</div>
                            <div className="td-hero__deal-code">
                                <div>
                                    <div className="td-hero__deal-code-label">USE CODE</div>
                                    <div className="td-hero__deal-code-value">TURF{turf.id}</div>
                                </div>
                                <div className="td-hero__deal-code-percent">GET {turf.discountPercent}% OFF</div>
                            </div>
                        </div>
                    ) : (
                        <div className="td-hero__stats-strip">
                            <div className="td-hero__stat-pill">
                                <IconCalendar />
                                <div>
                                    <div className="td-hero__stat-value">{turf.totalBookings?.toLocaleString()}</div>
                                    <div className="td-hero__stat-label">Total Bookings</div>
                                </div>
                            </div>
                            <div className="td-hero__stat-divider" />
                            <div className="td-hero__stat-pill">
                                <IconTrend />
                                <div>
                                    <div className="td-hero__stat-value">{turf.bookingsLast30Days}</div>
                                    <div className="td-hero__stat-label">This Month</div>
                                </div>
                            </div>
                            <div className="td-hero__stat-divider" />
                            <div className="td-hero__stat-pill">
                                <IconClock />
                                <div>
                                    <div className="td-hero__stat-value">{turf.openTime} – {turf.closeTime}</div>
                                    <div className="td-hero__stat-label">Working Hours</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="td-hero__actions">
                        <button
                            className="td-hero__book-btn"
                            disabled={turf.status === 'closed' || turf.isUnderMaintenance}
                            onClick={() => document.getElementById('td-booking')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Book Now
                        </button>
                        <button className="td-hero__share-btn" onClick={handleShare}>
                            <IconShare />
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
}

function StickyBar({ turf, visible }) {
    if (!visible) return null;
    return (
        <div className="td-sticky">
            <div className="td-sticky__left">
                <span className="td-sticky__name">{turf.name}</span>
                <span className="td-sticky__city">{turf.city}{turf.area ? ` · ${turf.area}` : ''}</span>
            </div>
            <div className="td-sticky__right">
                <div className="td-sticky__rating"><span>⭐</span> {turf.rating}</div>
                <div className="td-sticky__price">
                    {formatCurrency(turf.pricePerHour)}<small>/hr</small>
                </div>
                <button className="td-sticky__btn"
                    onClick={() => document.getElementById('td-booking')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    Book Now
                </button>
            </div>
        </div>
    );
}

function AboutSection({ turf }) {
    const [expanded, setExpanded] = useState(false);
    const shouldTruncate = turf.about?.length > 200;
    const content = expanded || !shouldTruncate ? turf.about : turf.about.slice(0, 200) + '...';

    return (
        <div className="td-card">
            <h2 className="td-card__title">About This Turf</h2>
            <p className="td-about__text">{content}</p>
            {shouldTruncate && (
                <button className="td-about__toggle" onClick={() => setExpanded(!expanded)}>
                    {expanded ? 'Read less ▲' : 'Read more ▼'}
                </button>
            )}
        </div>
    );
}

function SportsSection({ turf }) {
    return (
        <div className="td-card">
            <h2 className="td-card__title">Sports &amp; Details</h2>
            <div className="td-sports__grid">
                <div>
                    <div className="td-sports__label">Sports Available</div>
                    <div className="td-sports__chips">
                        {turf.sports?.map(sport => (
                            <span key={sport} className={`td-sports__chip ${getSportChipClass(sport)}`}>
                                {sport}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="td-sports__size">
                    <div className="td-sports__size-value">{turf.groundSize}</div>
                    <div className="td-sports__size-label">Ground Size</div>
                    <div className="td-sports__grounds">{turf.totalGrounds} Ground{turf.totalGrounds > 1 ? 's' : ''} Available</div>
                </div>
            </div>
        </div>
    );
}

function AmenitiesSection({ turf }) {
    return (
        <div className="td-card">
            <h2 className="td-card__title">Amenities</h2>
            <div className="td-amenities__grid">
                {turf.amenities?.map(amenity => (
                    <div key={amenity} className="td-amenity">
                        <span className="td-amenity__icon">{AMENITY_ICONS[amenity] || '⚽'}</span>
                        <span className="td-amenity__name">{amenity}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TimingsSection({ turf }) {
    const now = new Date();
    const [oh, om] = (turf.openTime || '06:00').split(':').map(Number);
    const [ch, cm] = (turf.closeTime || '22:00').split(':').map(Number);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const openMins = oh * 60 + (om || 0);
    const closeMins = ch * 60 + (cm || 0);
    const isOpen = nowMins >= openMins && nowMins < closeMins;
    const totalSlots = Math.floor((closeMins - openMins) / 120);

    return (
        <div className="td-card">
            <h2 className="td-card__title">Timings</h2>
            <div className="td-timings__box">
                <div className="td-timings__row">
                    <div className="td-timings__row-left">
                        <IconClock />
                        <span>{turf.openTime} – {turf.closeTime}</span>
                    </div>
                    <span className={`td-timings__badge ${isOpen ? 'td-timings__badge--open' : 'td-timings__badge--closed'}`}>
                        {isOpen ? 'Open Now' : 'Closed'}
                    </span>
                </div>
                <div className="td-timings__info">
                    <IconCalendar />
                    {turf.weeklyOff
                        ? <span>Closed on <strong>{turf.weeklyOff}s</strong></span>
                        : <em>Open all 7 days</em>
                    }
                </div>
                <div className="td-timings__info">
                    <IconClipboard />
                    <span>{totalSlots} slots available daily (approx)</span>
                </div>
            </div>
        </div>
    );
}

function LocationSection({ turf }) {
    const hasGeo = turf.geoPoint?.latitude && turf.geoPoint?.longitude;
    const mapSrc = hasGeo
        ? `https://maps.google.com/maps?q=${turf.geoPoint.latitude},${turf.geoPoint.longitude}&output=embed&z=15`
        : `https://maps.google.com/maps?q=${encodeURIComponent(`${turf.address}, ${turf.city}`)}&output=embed&z=15`;
    const mapUrl = hasGeo
        ? `https://maps.google.com/?q=${turf.geoPoint.latitude},${turf.geoPoint.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${turf.address}, ${turf.city}`)}`;

    return (
        <div className="td-card">
            <h2 className="td-card__title">Location</h2>
            <div className="td-location__address-box">
                <div className="td-location__address-row">
                    <IconMapPin />
                    <div>
                        <div className="td-location__address-main">{turf.address}</div>
                        <div className="td-location__address-sub">
                            {turf.city}{turf.state ? `, ${turf.state}` : ''}{turf.pincode ? ` – ${turf.pincode}` : ''}
                        </div>
                    </div>
                </div>
                <button className="td-location__dir-btn" onClick={() => window.open(mapUrl, '_blank')}>
                    Get Directions →
                </button>
            </div>
            <iframe
                className="td-location__map"
                src={mapSrc}
                title="Turf Location"
                loading="lazy"
            />
        </div>
    );
}

function ReviewsSection({ turf, reviews, turfId }) {
    const [showForm, setShowForm] = useState(false);
    const [hoverStar, setHoverStar] = useState(0);
    const [selectedStar, setSelectedStar] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState(null);

    const handleSubmitReview = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert('Please sign in to write a review.');
            return;
        }
        if (selectedStar === 0) {
            alert('Please select a star rating.');
            return;
        }
        if (!comment.trim()) {
            alert('Please write a comment.');
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'turf', turfId, 'reviews'), {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userPicture: user.photoURL || '',
                rating: selectedStar,
                comment: comment.trim(),
                timestamp: Timestamp.now(),
                isVerifiedBooking: false,
            });
            setSubmitMsg('success');
            setComment('');
            setSelectedStar(0);
            setShowForm(false);
            setTimeout(() => setSubmitMsg(null), 4000);
        } catch (err) {
            console.error('Error submitting review:', err);
            setSubmitMsg('error');
            setTimeout(() => setSubmitMsg(null), 4000);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="td-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h2 className="td-card__title" style={{ marginBottom: 0 }}>Ratings &amp; Reviews</h2>
                <button
                    onClick={() => {
                        if (!auth.currentUser) {
                            alert('Please sign in to write a review.');
                            return;
                        }
                        setShowForm(!showForm);
                    }}
                    className="td-review__write-btn"
                >
                    {showForm ? '✕ Cancel' : '✍️ Write a Review'}
                </button>
            </div>

            {/* Success / Error Messages */}
            {submitMsg === 'success' && (
                <div className="td-review__alert td-review__alert--success">
                    ✅ Your review has been submitted! Thank you.
                </div>
            )}
            {submitMsg === 'error' && (
                <div className="td-review__alert td-review__alert--error">
                    ❌ Failed to submit review. Please try again.
                </div>
            )}

            {/* Write Review Form */}
            {showForm && (
                <div className="td-review__form">
                    <div className="td-review__form-label">Your Rating</div>
                    <div className="td-review__star-picker">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                className={`td-review__star-btn ${star <= (hoverStar || selectedStar) ? 'td-review__star-btn--active' : ''}`}
                                onMouseEnter={() => setHoverStar(star)}
                                onMouseLeave={() => setHoverStar(0)}
                                onClick={() => setSelectedStar(star)}
                                type="button"
                            >
                                ★
                            </button>
                        ))}
                        <span className="td-review__star-label">
                            {selectedStar === 1 && 'Poor'}
                            {selectedStar === 2 && 'Fair'}
                            {selectedStar === 3 && 'Good'}
                            {selectedStar === 4 && 'Very Good'}
                            {selectedStar === 5 && 'Excellent'}
                        </span>
                    </div>
                    <div className="td-review__form-label" style={{ marginTop: '16px' }}>Your Review</div>
                    <textarea
                        className="td-review__textarea"
                        placeholder="Share your experience at this turf..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        maxLength={500}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{comment.length}/500</span>
                        <button
                            className="td-review__submit-btn"
                            onClick={handleSubmitReview}
                            disabled={submitting || selectedStar === 0 || !comment.trim()}
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="td-reviews__summary">
                <div className="td-reviews__score">
                    <div className="td-reviews__score-num">{turf.rating}</div>
                    <div className="td-reviews__stars">
                        {[...Array(5)].map((_, i) => <IconStar key={i} filled={i < Math.round(turf.rating)} />)}
                    </div>
                    <div className="td-reviews__count">{turf.totalReviews} ratings</div>
                </div>
                <div className="td-reviews__bars">
                    {[
                        { s: 5, p: 65 }, { s: 4, p: 20 }, { s: 3, p: 10 }, { s: 2, p: 3 }, { s: 1, p: 2 }
                    ].map(r => (
                        <div key={r.s} className="td-reviews__bar-row">
                            <span className="td-reviews__bar-label">{r.s}★</span>
                            <div className="td-reviews__bar-track">
                                <div className="td-reviews__bar-fill" style={{ width: `${r.p}%` }} />
                            </div>
                            <span className="td-reviews__bar-pct">{r.p}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="td-reviews__list">
                {reviews.length === 0 ? (
                    <div className="td-reviews__empty">No reviews yet. Be the first to review!</div>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="td-review">
                            <div className="td-review__header">
                                <div className="td-review__avatar">
                                    {review.userPicture
                                        ? <img src={review.userPicture} alt={review.userName} />
                                        : review.userName?.charAt(0)}
                                </div>
                                <div className="td-review__body">
                                    <div className="td-review__top">
                                        <div>
                                            <div className="td-review__name">{review.userName}</div>
                                            <div className="td-review__rating-stars">
                                                {[...Array(Math.round(review.rating || 0))].map((_, i) => (
                                                    <IconStar key={i} filled />
                                                ))}
                                            </div>
                                        </div>
                                        {review.timestamp && (
                                            <div className="td-review__date">
                                                {review.timestamp?.toDate ? review.timestamp.toDate().toLocaleDateString() : 'Recent'}
                                            </div>
                                        )}
                                    </div>
                                    <p className="td-review__comment">{review.comment}</p>
                                    {review.isVerifiedBooking && (
                                        <div className="td-review__verified">✓ Verified Booking</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function OwnerSection({ turf }) {
    return (
        <div className="td-card">
            <div className="td-owner">
                <div>
                    <div className="td-owner__label">Managed By</div>
                    <div className="td-owner__name">{turf.ownerName}</div>
                </div>
                <button className="td-owner__btn" onClick={() => window.location.href = `tel:${turf.ownerPhone}`}>
                    Contact Owner
                </button>
            </div>
        </div>
    );
}

function BookingCard({ turf }) {
    const navigate = useNavigate();
    const [date, setDate] = useState('');
    const [duration, setDuration] = useState(1);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedSport, setSelectedSport] = useState('');
    const [bookedSlots, setBookedSlots] = useState([]);
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Ground support — use totalGrounds from database
    const grounds = (() => {
        if (turf.grounds && turf.grounds.length > 0) return turf.grounds;
        const count = turf.totalGrounds && turf.totalGrounds > 0 ? turf.totalGrounds : 1;
        const arr = [];
        for (let i = 1; i <= count; i++) {
            arr.push({
                id: `ground-${i}`,
                name: `Ground ${i}`,
                openTime: turf.openTime || '06:00',
                closeTime: turf.closeTime || '22:00',
            });
        }
        return arr;
    })();
    const [selectedGround, setSelectedGround] = useState(grounds[0]);

    // Set default sport
    useEffect(() => {
        if (turf.sports?.length > 0) setSelectedSport(turf.sports[0]);
    }, [turf.sports]);

    // Real-time listener for booked slots — updates instantly when owner or user books
    useEffect(() => {
        if (!date || !turf.id) {
            setBookedSlots([]);
            return;
        }
        setLoadingSlots(true);
        // Real-time listener for booked slots
        const bookingsRef = collection(db, 'bookings');
        const bq = query(
            bookingsRef,
            where('turfId', '==', turf.id),
            where('bookedDate', '==', date),
            where('status', '==', 'confirmed')
        );

        const unsubscribe = onSnapshot(bq, (snapshot) => {
            const booked = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.groundId && data.groundId !== selectedGround.id) return;

                // Schema 1: Backend bookings have timeSlots array ["06:00", "07:00"]
                if (Array.isArray(data.timeSlots) && data.timeSlots.length > 0) {
                    data.timeSlots.forEach((slot) => {
                        const hour = parseInt(slot.split(':')[0], 10);
                        if (!isNaN(hour)) booked.push(hour);
                    });
                }
                // Schema 2: Client bookings have startHour (number) + duration (number)
                else if (data.startHour !== undefined && data.duration) {
                    for (let h = 0; h < data.duration; h++) {
                        booked.push(data.startHour + h);
                    }
                }
                // Schema 3: Fallback — startTime as "HH:MM" string
                else if (data.startTime) {
                    const hour = parseInt(data.startTime.split(':')[0], 10);
                    if (!isNaN(hour)) {
                        const dur = data.duration || 1;
                        for (let h = 0; h < dur; h++) {
                            booked.push(hour + h);
                        }
                    }
                }
            });
            setBookedSlots(booked);
            setLoadingSlots(false);
        }, (err) => {
            console.warn('Could not listen to bookings:', err);
            setBookedSlots([]);
            setLoadingSlots(false);
        });

        return () => unsubscribe();
    }, [date, turf.id, selectedGround?.id]);

    // Real-time listener for blocked slots — updates instantly when owner blocks/unblocks
    useEffect(() => {
        if (!date || !turf.id) {
            setBlockedSlots([]);
            return;
        }

        const blockedRef = collection(db, 'blockedSlots');
        const blq = query(
            blockedRef,
            where('turfId', '==', turf.id),
            where('date', '==', date)
        );

        const unsubscribe = onSnapshot(blq, (snapshot) => {
            const blocked = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.groundId && data.groundId !== selectedGround.id) return;
                if (data.startTime) {
                    const hour = parseInt(data.startTime.split(':')[0]);
                    if (!isNaN(hour)) blocked.push(hour);
                }
            });
            setBlockedSlots(blocked);
        }, (error) => {
            console.warn('Could not listen to blocked slots:', error);
            setBlockedSlots([]);
        });

        return () => unsubscribe();
    }, [date, turf.id, selectedGround?.id]);

    const price = turf.pricePerHour;
    const discountedPrice = turf.isDiscountActive
        ? Math.round(price * (1 - turf.discountPercent / 100))
        : price;

    // ✅ Bill Calculation
    const subtotal = discountedPrice * duration;
    const convenienceFee = Math.round(subtotal * 0.02);  // 2% convenience fee
    const totalAmount = subtotal + convenienceFee;

    // Generate 1-hour slots, respecting duration, booked, blocked & past-time status
    const generateSlots = () => {
        const openTime = selectedGround.openTime || turf.openTime;
        const closeTime = selectedGround.closeTime || turf.closeTime;
        if (!openTime || !closeTime) return [];
        const slots = [];
        let [oh, om] = openTime.split(':').map(Number);
        const [ch, cm] = closeTime.split(':').map(Number);
        const openMins = oh * 60 + (om || 0);
        const closeMins = ch * 60 + (cm || 0);

        // Past-time detection
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const isToday = date === todayStr;
        const currentHourNow = now.getHours();
        const currentMinuteNow = now.getMinutes();

        let currentHour = oh;

        while (true) {
            const startMins = currentHour * 60;
            const endMins = (currentHour + duration) * 60;

            if (endMins > closeMins || startMins < openMins) {
                currentHour++;
                if (currentHour * 60 >= closeMins) break;
                continue;
            }

            const format = (hr) => {
                const p = hr >= 12 ? 'PM' : 'AM';
                const dHr = hr % 12 || 12;
                return `${dHr}:00 ${p}`;
            };

            // Check booked
            let isBooked = false;
            for (let h = 0; h < duration; h++) {
                if (bookedSlots.includes(currentHour + h)) {
                    isBooked = true;
                    break;
                }
            }

            // Check blocked
            let isBlocked = false;
            for (let h = 0; h < duration; h++) {
                if (blockedSlots.includes(currentHour + h)) {
                    isBlocked = true;
                    break;
                }
            }

            // Check past
            const isPast = isToday && (currentHour < currentHourNow || (currentHour === currentHourNow && currentMinuteNow > 0));

            slots.push({
                id: `slot-${currentHour}`,
                startHour: currentHour,
                label: `${format(currentHour)} – ${format(currentHour + duration)}`,
                isBooked,
                isBlocked,
                isPast,
            });

            currentHour++;
            if (slots.length > 30) break;
        }
        return slots;
    };

    const slots = generateSlots();
    const today = new Date().toISOString().split('T')[0];

    // ✅ DURATION OPTIONS
    const durationOptions = [1, 2, 3, 4];

    // ✅ PAYMENT + BOOKING HANDLER
    const handlePayment = async () => {
        if (!date || !selectedSlot) return;

        const user = auth.currentUser;
        if (!user) {
            alert('Please sign in to book a turf.');
            navigate('/signin');
            return;
        }

        setIsProcessing(true);
        setPaymentStatus(null);

        const format12 = (hr) => {
            const p = hr >= 12 ? 'PM' : 'AM';
            const dHr = hr % 12 || 12;
            return `${dHr}:00 ${p}`;
        };

        // Build timeSlots array in "HH:00" format (what backend + useBookedSlots expect)
        const timeSlots = Array.from({ length: duration }, (_, i) => {
            const hr = selectedSlot.startHour + i;
            return `${hr.toString().padStart(2, '0')}:00`;
        });

        // Razorpay API requires a minimum order amount of 1 INR (100 paise)
        const orderTotalPrice = totalAmount > 0 ? totalAmount : 1;

        try {
            // 1. Create Razorpay order via backend
            const orderData = await createOrder({
                turfId: turf.id,
                slots: timeSlots,
                totalPrice: orderTotalPrice,
                date: date,
            });

            // 2. Open Razorpay checkout → backend verifies → writes booking → sends email
            openRazorpayCheckout({
                orderData,
                bookingMeta: {
                    // Core booking fields
                    turfId: turf.id,
                    slots: timeSlots,
                    date: date,
                    totalPrice: totalAmount,
                    // Turf details — backend stores these in Firestore doc + uses for email
                    turfName: turf.name || '',
                    turfAddress: [turf.address, turf.city].filter(Boolean).join(', '),
                    turfImage: turf.images?.[0] || '',
                    ownerContact: turf.ownerPhone || turf.ownerName || '',
                    // User details — backend stores these in Firestore doc + uses for email
                    userEmail: user.email || '',
                    userName: user.displayName || '',
                },
                userInfo: {
                    name: user.displayName || '',
                    email: user.email || '',
                },
                onSuccess: (bookingId) => {
                    console.log('✅ Booking confirmed via backend:', bookingId);
                    setPaymentStatus('success');
                    setIsProcessing(false);
                },
                onFailure: (error) => {
                    console.error('❌ Payment/verification failed:', error);
                    if (error === 'Payment cancelled by user') {
                        setIsProcessing(false);
                        return;
                    }
                    setPaymentStatus('failed');
                    setIsProcessing(false);
                },
            });
        } catch (err) {
            console.error('Payment initialization error:', err);
            setIsProcessing(false);
            alert(`Failed to initialize payment: ${err.message || 'Please try again.'}`);
        }
    };

    return (
        <div id="td-booking" className="td-booking">
            {/* Price */}
            <div className="td-booking__price">
                {turf.isDiscountActive ? (
                    <>
                        <div>
                            <span className="td-booking__price-original">{formatCurrency(price)}</span>
                            <span className="td-booking__price-discount-badge">{turf.discountPercent}% OFF</span>
                        </div>
                        <div className="td-booking__price-main">{formatCurrency(discountedPrice)}<small>/hour</small></div>
                    </>
                ) : (
                    <div className="td-booking__price-normal">{formatCurrency(price)}<small>/hour</small></div>
                )}
            </div>

            {/* Date */}
            <div className="td-booking__field">
                <label className="td-booking__label">Select Date</label>
                <input
                    type="date"
                    className="td-booking__date-input"
                    min={today}
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); setPaymentStatus(null); }}
                />
            </div>

            {/* Ground Selector */}
            <div className="td-booking__field">
                <label className="td-booking__label">Select Ground</label>
                <div className="td-booking__sport-pills">
                    {grounds.map((g) => (
                        <button
                            key={g.id}
                            onClick={() => { setSelectedGround(g); setSelectedSlot(null); }}
                            className={`td-booking__sport-pill ${selectedGround?.id === g.id ? 'td-booking__sport-pill--active' : ''}`}
                        >
                            🏟️ {g.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Duration Selector */}
            <div className="td-booking__field">
                <label className="td-booking__label">Select Duration</label>
                <div className="td-booking__sport-pills">
                    {durationOptions.map((d) => (
                        <button
                            key={d}
                            onClick={() => { setDuration(d); setSelectedSlot(null); }}
                            className={`td-booking__sport-pill ${duration === d ? 'td-booking__sport-pill--active' : ''}`}
                        >
                            🕐 {d} Hour{d > 1 ? 's' : ''}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sport Type */}
            {turf.sports?.length > 0 && (
                <div className="td-booking__field">
                    <label className="td-booking__label">Select Sport</label>
                    <div className="td-booking__sport-pills">
                        {turf.sports.map(sport => (
                            <button
                                key={sport}
                                onClick={() => setSelectedSport(sport)}
                                className={`td-booking__sport-pill ${selectedSport === sport ? 'td-booking__sport-pill--active' : ''}`}
                            >
                                {sport === 'Cricket' && '🏏 '}
                                {sport === 'Football' && '⚽ '}
                                {sport === 'Volleyball' && '🏐 '}
                                {sport === 'Badminton' && '🏸 '}
                                {sport === 'Basketball' && '🏀 '}
                                {sport === 'Pickleball' && '🎾 '}
                                {!['Cricket', 'Football', 'Volleyball', 'Badminton', 'Basketball', 'Pickleball'].includes(sport) && '🏅 '}
                                {sport}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Slots with booked/blocked/past greyed out logic */}
            <div className="td-booking__field">
                <label className="td-booking__label">
                    Select Time
                    {loadingSlots && <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>Loading availability...</span>}
                </label>
                {!date ? (
                    <div style={{ color: '#999', fontSize: '14px', padding: '12px 0' }}>
                        Please select a date first to see available slots
                    </div>
                ) : (
                    <div className="td-booking__slots">
                        {slots.map(slot => {
                            const isDisabled = slot.isBooked || slot.isBlocked || slot.isPast;
                            const statusLabel = slot.isPast ? 'Passed' : (slot.isBlocked || slot.isBooked) ? 'Booked' : null;
                            return (
                                <button
                                    key={slot.id}
                                    onClick={() => !isDisabled && setSelectedSlot(slot)}
                                    disabled={isDisabled}
                                    className={`td-booking__slot ${selectedSlot?.id === slot.id ? 'td-booking__slot--active' : ''
                                        } ${slot.isBooked ? 'td-booking__slot--booked' : ''}
                                        ${slot.isBlocked ? 'td-booking__slot--booked' : ''}
                                        ${slot.isPast ? 'td-booking__slot--past' : ''}`}
                                    title={statusLabel ? `This slot is ${statusLabel.toLowerCase()}` : `Book ${slot.label}`}
                                >
                                    {slot.label}
                                    {statusLabel && <span style={{ display: 'block', fontSize: '10px', marginTop: '2px' }}>{statusLabel}</span>}
                                </button>
                            );
                        })}
                        {slots.length === 0 && date && (
                            <div style={{ color: '#999', fontSize: '14px' }}>
                                No slots available for {duration}-hour duration
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ✅ Bill Breakdown */}
            {selectedSlot && date && (
                <div className="td-booking__summary">
                    {/* Bill Header */}
                    <div style={{
                        fontWeight: 700, fontSize: '15px', color: '#1f2937',
                        marginBottom: '12px', paddingBottom: '8px',
                        borderBottom: '1px dashed #e5e7eb'
                    }}>
                        🧾 Bill Details
                    </div>

                    {/* Booking Info */}
                    <div className="td-booking__summary-row">
                        <span className="td-booking__summary-label">📅 Date</span>
                        <span className="td-booking__summary-value">
                            {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="td-booking__summary-row">
                        <span className="td-booking__summary-label">⏰ Time</span>
                        <span className="td-booking__summary-value">{selectedSlot.label}</span>
                    </div>
                    <div className="td-booking__summary-row">
                        <span className="td-booking__summary-label">⏳ Duration</span>
                        <span className="td-booking__summary-value">{duration} hour{duration > 1 ? 's' : ''}</span>
                    </div>
                    {selectedSport && (
                        <div className="td-booking__summary-row">
                            <span className="td-booking__summary-label">🏅 Sport</span>
                            <span className="td-booking__summary-value">{selectedSport}</span>
                        </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="td-booking__summary-divider" />

                    <div className="td-booking__summary-row">
                        <span className="td-booking__summary-label">
                            Turf Charges ({formatCurrency(discountedPrice)} × {duration}hr)
                        </span>
                        <span className="td-booking__summary-value">{formatCurrency(subtotal)}</span>
                    </div>

                    {turf.isDiscountActive && (
                        <div className="td-booking__summary-row" style={{ color: '#059669' }}>
                            <span className="td-booking__summary-label">🎉 Discount ({turf.discountPercent}%)</span>
                            <span className="td-booking__summary-value">
                                − {formatCurrency((price - discountedPrice) * duration)}
                            </span>
                        </div>
                    )}

                    <div className="td-booking__summary-row">
                        <span className="td-booking__summary-label">Convenience Fee (2%)</span>
                        <span className="td-booking__summary-value">+ {formatCurrency(convenienceFee)}</span>
                    </div>

                    {/* Total */}
                    <div className="td-booking__summary-divider" />

                    <div className="td-booking__summary-total">
                        <span>Total Amount</span>
                        <span>{formatCurrency(totalAmount)}</span>
                    </div>

                    {turf.isDiscountActive && (
                        <div className="td-booking__summary-saved">
                            You saved {formatCurrency((price - discountedPrice) * duration)}!
                        </div>
                    )}
                </div>
            )}

            {/* ✅ Success Message */}
            {paymentStatus === 'success' && (
                <div style={{
                    background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '12px',
                    padding: '16px', textAlign: 'center', marginBottom: '12px'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                    <div style={{ fontWeight: 700, color: '#065f46', fontSize: '16px' }}>Booking Confirmed!</div>
                    <div style={{ color: '#047857', fontSize: '14px', marginTop: '4px' }}>
                        {turf.name} · {selectedSlot?.label} · {duration}hr · {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                    <button
                        onClick={() => navigate('/profile')}
                        style={{
                            marginTop: '12px', background: '#059669', color: 'white', border: 'none',
                            padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        View My Bookings →
                    </button>
                </div>
            )}

            {/* ❌ Failed Message */}
            {paymentStatus === 'failed' && (
                <div style={{
                    background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '12px',
                    padding: '16px', textAlign: 'center', marginBottom: '12px'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
                    <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '16px' }}>Payment Failed</div>
                    <div style={{ color: '#b91c1c', fontSize: '14px', marginTop: '4px' }}>
                        Please try again or use a different payment method.
                    </div>
                </div>
            )}

            {/* Submit */}
            <button
                className={`td-booking__submit ${!date || !selectedSlot || turf.status === 'closed' || isProcessing ? 'td-booking__submit--disabled' : 'td-booking__submit--active'}`}
                disabled={!date || !selectedSlot || turf.status === 'closed' || isProcessing}
                onClick={handlePayment}
            >
                {isProcessing
                    ? '⏳ Processing...'
                    : paymentStatus === 'success'
                        ? '✅ Booked!'
                        : !date
                            ? 'Select Date First'
                            : !selectedSlot
                                ? 'Select Time Slot'
                                : `Pay ${formatCurrency(totalAmount)} →`
                }
            </button>

            <div className="td-booking__footer">🔒 Secure payment via Razorpay &nbsp;·&nbsp; ✓ Instant confirmation</div>
        </div>
    );
}

function MobileBookingBar({ turf }) {
    const displayPrice = turf.isDiscountActive
        ? Math.round(turf.pricePerHour * (1 - turf.discountPercent / 100))
        : turf.pricePerHour;

    return (
        <div className="td-mobile-bar">
            <div>
                {turf.isDiscountActive && (
                    <div className="td-mobile-bar__original">{formatCurrency(turf.pricePerHour)}</div>
                )}
                <div className="td-mobile-bar__price">
                    {formatCurrency(displayPrice)}<small>/hr</small>
                </div>
            </div>
            <button
                className="td-mobile-bar__btn"
                onClick={() => document.getElementById('td-booking')?.scrollIntoView({ behavior: 'smooth' })}
            >
                Book Now
            </button>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function TurfDetailPage() {
    const { turfId } = useParams();
    const navigate = useNavigate();

    const [turf, setTurf] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImg, setActiveImg] = useState(0);
    const [showSticky, setShowSticky] = useState(false);
    const heroRef = useRef(null);

    // ── Fetch turf data ──────────────────────────────────────────
    useEffect(() => {
        if (!db) {
            setError('Firebase is not initialized. Please check your .env configuration.');
            setLoading(false);
            return;
        }
        if (!turfId) {
            setError('Invalid Turf ID');
            setLoading(false);
            return;
        }

        const ref = doc(db, 'turf', turfId);
        const unsub = onSnapshot(ref,
            (snap) => {
                if (snap.exists()) {
                    setTurf(normalizeTurf(snap.id, snap.data()));
                    setLoading(false);
                } else {
                    setError('Turf not found');
                    setLoading(false);
                }
            },
            (err) => {
                console.error('Fetch Error:', err);
                setError('Failed to load turf');
                setLoading(false);
            }
        );
        return () => unsub();
    }, [turfId]);

    // ── Fetch reviews sub-collection ─────────────────────────────
    useEffect(() => {
        if (!turf || !turfId || !db) return;
        const q = query(
            collection(db, 'turf', turfId, 'reviews'),
            orderBy('timestamp', 'desc'),
            limit(5)
        );
        const unsub = onSnapshot(q,
            (snap) => setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            (err) => console.warn('Reviews fetch error (may not exist yet):', err)
        );
        return () => unsub();
    }, [turf, turfId]);

    // ── Scroll detection for sticky bar ──────────────────────────
    useEffect(() => {
        const handleScroll = () => {
            if (heroRef.current) {
                setShowSticky(heroRef.current.getBoundingClientRect().bottom < 0);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ── LOADING STATE ────────────────────────────────────────────
    if (loading) {
        return (
            <div className="turf-detail-page td-loading">
                <Header />
                <div className="td-loading__grid">
                    <div className="td-loading__block td-loading__poster" />
                    <div className="td-loading__info">
                        <div className="td-loading__block td-loading__title" />
                        <div className="td-loading__block td-loading__sub" />
                        <div className="td-loading__block td-loading__desc" />
                    </div>
                    <div className="td-loading__block td-loading__stats" />
                </div>
            </div>
        );
    }

    // ── ERROR STATE ──────────────────────────────────────────────
    if (error) {
        return (
            <div className="turf-detail-page td-error">
                <Header />
                <div className="td-error__icon">🏟️</div>
                <h2 className="td-error__title">Turf Not Found</h2>
                <p className="td-error__msg">{error}</p>
                <button className="td-error__btn" onClick={() => navigate('/')}>← Back to Home</button>
            </div>
        );
    }

    // ── MAIN RENDER ──────────────────────────────────────────────
    // ── MAIN RENDER ──────────────────────────────────────────────
    return (
        <div className="turf-detail-page">
            <Header />                {/* ✅ ADD THIS — same header as Home & Listings */}
            <StickyBar turf={turf} visible={showSticky} />

            <div ref={heroRef}>
                <HeroSection turf={turf} activeImg={activeImg} setActiveImg={setActiveImg} />
            </div>

            <div className="td-content">
                {/* Left Column */}
                <div className="td-left-col">
                    <AboutSection turf={turf} />
                    <SportsSection turf={turf} />
                    <AmenitiesSection turf={turf} />
                    <TimingsSection turf={turf} />
                    <LocationSection turf={turf} />
                    <ReviewsSection turf={turf} reviews={reviews} turfId={turfId} />
                    {turf.ownerName && <OwnerSection turf={turf} />}
                </div>

                {/* Right Column — Booking */}
                <div className="td-right-col">
                    <BookingCard turf={turf} />
                </div>
            </div>

            <MobileBookingBar turf={turf} />
        </div>
    );
}