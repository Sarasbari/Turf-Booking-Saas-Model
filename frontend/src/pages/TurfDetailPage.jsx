import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

// --- Icons (SVGs) ---
const IconStar = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);

const IconMapPin = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

const IconClock = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
    </svg>
);

const IconCalendar = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
    </svg>
);

const IconShare = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
    </svg>
);

const IconInfo = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);

// --- Helper Functions ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

// --- Normalize Firestore data to match component expectations ---
const normalizeTurf = (id, data) => ({
    id,
    name: data.name || 'Unnamed Turf',
    about: data.description || data.about || '',
    images: data.images || (data.coverImage ? [data.coverImage] : []),
    sports: data.sport ? [data.sport] : (data.sports || []),
    groundSize: data.turfSize || data.groundSize || '5-a-side',
    totalGrounds: data.totalGrounds || 1,
    status: data.status === 'active' ? 'available' : (data.status || 'closed'),
    rating: data.rating || 0,
    totalReviews: data.totalReviews || 0,
    totalBookings: data.totalBookings || 0,
    bookingsLast30Days: data.bookingsLast30Days || 0,
    pricePerHour: data.pricing?.basePrice || data.pricePerHour || 0,
    openTime: data.operatingHours?.opensAt || data.openTime || '06:00',
    closeTime: data.operatingHours?.closesAt || data.closeTime || '22:00',
    weeklyOff: data.weeklyOff || null,
    amenities: data.amenities || [],
    address: data.location?.address || data.address || '',
    city: data.location?.city || data.city || '',
    state: data.location?.state || data.state || '',
    pincode: data.location?.pincode || data.pincode || '',
    geoPoint: data.location?.coordinates
        ? { latitude: data.location.coordinates.lat, longitude: data.location.coordinates.lng }
        : (data.geoPoint || null),
    ownerName: data.ownerName || '',
    ownerPhone: data.ownerPhone || '',
    isDiscountActive: data.isDiscountActive || false,
    discountPercent: data.discountPercent || 0,
    discountDescription: data.discountDescription || '',
    isUnderMaintenance: data.isUnderMaintenance || false,
    maintenanceNote: data.maintenanceNote || '',
});

// --- Sub-Components ---

function HeroSection({ turf, activeImg, setActiveImg }) {
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: turf.name,
                text: `Check out ${turf.name} on TurfBookaro!`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const statusColor =
        turf.status === 'available' ? 'text-green-500' :
            turf.status === 'closed' ? 'text-red-500' : 'text-amber-500';

    const statusText =
        turf.status === 'available' ? 'Open Now ✓' :
            turf.status === 'closed' ? 'Closed' : 'Maintenance';

    return (
        <div className="bg-[#1a1a2e] w-full px-6 py-12 md:px-20 grid grid-cols-1 md:grid-cols-[280px_1fr_320px] gap-10 items-center text-white">
            {/* Left: Image */}
            <div className="flex flex-col gap-4">
                <div className="relative w-full h-[360px] md:w-[260px] rounded-lg overflow-hidden shadow-2xl shadow-black/50 mx-auto">
                    <img
                        src={turf.images?.[activeImg] || 'https://via.placeholder.com/260x360?text=No+Image'}
                        alt={turf.name}
                        className="w-full h-full object-cover"
                    />
                    {turf.isDiscountActive && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-red-700 to-red-500 p-3 text-white">
                            <div className="font-bold text-xl">{turf.discountPercent}% DISCOUNT</div>
                            <div className="text-[11px] opacity-90">{turf.discountDescription}</div>
                        </div>
                    )}
                    {turf.isUnderMaintenance && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4">
                            <div className="text-3xl mb-2">🔧</div>
                            <div className="font-bold text-lg">Under Maintenance</div>
                            <div className="text-sm text-gray-300 mt-1">{turf.maintenanceNote}</div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 justify-center md:justify-start overflow-x-auto py-2">
                    {turf.images?.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveImg(idx)}
                            className={`w-[60px] h-[60px] rounded-md overflow-hidden border-2 flex-shrink-0 ${activeImg === idx ? 'border-orange-600' : 'border-transparent'}`}
                        >
                            <img src={img} alt="thumb" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Center: Info */}
            <div className="flex flex-col gap-4 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold">{turf.name}</h1>

                {(turf.isUnderMaintenance || turf.maintenanceNote) && (
                    <div className="max-w-md bg-white/10 rounded-lg p-3 flex items-start gap-3">
                        <IconInfo className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                            <div className="font-bold text-sm text-white">Important Information</div>
                            <div className="text-sm text-gray-300">{turf.maintenanceNote}</div>
                        </div>
                    </div>
                )}

                <div className="text-gray-300 text-lg">{turf.sports?.join(', ')}</div>

                <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm hover:bg-white/20 transition">{turf.groundSize}</span>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm hover:bg-white/20 transition">{turf.totalGrounds} Grounds</span>
                    <span className={`px-3 py-1 bg-white/10 rounded-full text-sm font-semibold border border-white/10 ${statusColor}`}>
                        {statusText}
                    </span>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-300 mt-2">
                    <div className="flex items-center gap-1 text-white font-bold text-lg">
                        <span className="text-orange-500">⭐</span> {turf.rating}
                    </div>
                    <span>•</span>
                    <div>{turf.totalReviews} ratings</div>
                    <span>•</span>
                    <div>{turf.totalBookings?.toLocaleString()} bookings</div>
                </div>

                <div className="flex gap-4 mt-6 justify-center md:justify-start">
                    <button
                        className="bg-orange-600 text-white px-12 py-3.5 rounded-lg font-bold text-lg hover:bg-orange-700 transition transform hover:-translate-y-0.5 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        disabled={turf.status === 'closed' || turf.isUnderMaintenance}
                        onClick={() => document.getElementById('booking-card')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Book Now
                    </button>
                    <button
                        onClick={handleShare}
                        className="border border-white/30 text-white px-4 py-3 rounded-lg hover:bg-white/10 transition"
                    >
                        <IconShare className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Right: Promo/Stats - Hidden on small mobile */}
            <div className="hidden md:block">
                {turf.isDiscountActive ? (
                    <div className="bg-[#0a0a0a] rounded-xl p-8 border border-white/5">
                        <div className="text-amber-500 text-2xl font-black tracking-tight leading-tight mb-2">
                            {turf.discountDescription}
                        </div>
                        <div className="text-[10px] text-gray-500 tracking-[0.2em] font-bold mb-6">EXCLUSIVE LIMITED TIME DEAL</div>

                        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 flex justify-between items-center">
                            <div>
                                <div className="text-[10px] text-gray-500 font-bold mb-1">USE CODE</div>
                                <div className="text-white text-xl font-bold tracking-wider">TURF{turf.id}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-white text-sm font-bold">GET {turf.discountPercent}% OFF</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/5 rounded-xl p-6 grid grid-cols-2 gap-6">
                        <div className="text-center">
                            <IconCalendar className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                            <div className="text-white font-bold text-xl">{turf.totalBookings?.toLocaleString()}</div>
                            <div className="text-xs text-gray-400 mt-1">Total Bookings</div>
                        </div>
                        <div className="text-center">
                            <svg className="w-6 h-6 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <div className="text-white font-bold text-xl">{turf.bookingsLast30Days}</div>
                            <div className="text-xs text-gray-400 mt-1">This Month</div>
                        </div>
                        <div className="text-center col-span-2 border-t border-white/10 pt-6">
                            <IconClock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                            <div className="text-white font-bold">{turf.openTime} – {turf.closeTime}</div>
                            <div className="text-xs text-gray-400 mt-1">Working Hours</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StickyBar({ turf, visible }) {
    if (!visible) return null;
    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md h-16 flex items-center justify-between px-6 md:px-20 animate-slideDown">
            <div className="flex flex-col">
                <span className="font-bold text-gray-900">{turf.name}</span>
                <span className="text-xs text-gray-500">{turf.city}</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-1 font-bold text-gray-800">
                    <span className="text-orange-500">⭐</span> {turf.rating}
                </div>
                <div className="font-bold text-orange-600 text-lg">
                    {formatCurrency(turf.pricePerHour)}<span className="text-sm text-gray-500 font-normal">/hr</span>
                </div>
                <button
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition"
                    onClick={() => document.getElementById('booking-card')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    Book Now
                </button>
            </div>
        </div>
    );
}

function AboutSection({ turf }) {
    const [expanded, setExpanded] = useState(false);
    const shouldTruncate = turf.about?.length > 220;
    const content = expanded || !shouldTruncate ? turf.about : turf.about.slice(0, 220) + '...';

    return (
        <div className="bg-white rounded-xl p-7 shadow-sm mb-5">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-3 mb-5">About This Turf</h3>
            <p className="text-[#555] text-[15px] leading-relaxed">
                {content}
            </p>
            {shouldTruncate && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-orange-600 font-semibold text-sm mt-3 hover:underline"
                >
                    {expanded ? 'Read less ▲' : 'Read more ▼'}
                </button>
            )}
        </div>
    );
}

function SportsSection({ turf }) {
    const getSportStyle = (sport) => {
        switch (sport) {
            case 'Cricket': return 'bg-blue-50 text-blue-800 border-blue-200';
            case 'Football': return 'bg-green-50 text-green-800 border-green-200';
            case 'Volleyball': return 'bg-orange-50 text-orange-800 border-orange-200';
            case 'Pickleball': return 'bg-pink-50 text-pink-800 border-pink-200';
            default: return 'bg-purple-50 text-purple-800 border-purple-200';
        }
    };

    return (
        <div className="bg-white rounded-xl p-7 shadow-sm mb-5">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-3 mb-5">Sports & Details</h3>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">SPORTS AVAILABLE</div>
                    <div className="flex flex-wrap gap-2">
                        {turf.sports?.map(sport => (
                            <span key={sport} className={`px-5 py-2 rounded-full text-sm font-semibold border ${getSportStyle(sport)}`}>
                                {sport}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col justify-center">
                    <div className="text-3xl font-bold text-gray-800">{turf.groundSize}</div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">Ground Size</div>
                    <div className="text-base text-gray-600 mt-2">{turf.totalGrounds} Ground(s) Available</div>
                </div>
            </div>
        </div>
    );
}

function AmenitiesSection({ turf }) {
    const getIcon = (amenity) => {
        const map = {
            "Parking": "🚗", "Floodlights": "💡", "Changing Room": "👕",
            "Washrooms": "🚿", "Drinking Water": "💧", "First Aid Kit": "🏥",
            "First Aid": "🏥", "Seating Area": "🪑", "Seating": "🪑",
            "AC": "❄️", "Cafeteria": "☕", "WiFi": "📶",
            "Water": "💧", "Equipment Rental": "⚽", "Scoreboard": "📊"
        };
        return map[amenity] || "⚽";
    };

    return (
        <div className="bg-white rounded-xl p-7 shadow-sm mb-5">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-3 mb-5">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {turf.amenities?.map(amenity => (
                    <div key={amenity} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center hover:border-orange-500 hover:bg-orange-50 transition transform hover:-translate-y-0.5">
                        <span className="text-2xl mb-2">{getIcon(amenity)}</span>
                        <span className="text-sm font-medium text-gray-600 text-center">{amenity}</span>
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
        <div className="bg-white rounded-xl p-7 shadow-sm mb-5">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-3 mb-5">Timings</h3>
            <div className="bg-gray-50 rounded-xl p-6 grid gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <IconClock className="w-6 h-6 text-orange-500" />
                        <div className="font-bold text-lg text-gray-800">{turf.openTime} – {turf.closeTime}</div>
                    </div>
                    {isOpen ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Open Now</span>
                    ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Closed</span>
                    )}
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                    <IconCalendar className="w-5 h-5 text-gray-400" />
                    {turf.weeklyOff ? (
                        <span>Closed on <span className="font-bold text-orange-600">{turf.weeklyOff}s</span></span>
                    ) : (
                        <span className="text-green-600 font-medium">Open all 7 days</span>
                    )}
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
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
        <div className="bg-white rounded-xl p-7 shadow-sm mb-5">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-3 mb-5">Location</h3>
            <div className="bg-gray-50 rounded-xl p-5 mb-5 border border-gray-100">
                <div className="flex items-start gap-3">
                    <IconMapPin className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                        <div className="font-bold text-gray-900 text-sm md:text-base">{turf.address}</div>
                        <div className="text-sm text-gray-500 mt-1">
                            {turf.city}{turf.state ? `, ${turf.state}` : ''}{turf.pincode ? ` – ${turf.pincode}` : ''}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => window.open(mapUrl, '_blank')}
                    className="mt-4 w-full md:w-auto text-orange-600 border border-orange-600 rounded-lg px-4 py-2 text-sm font-bold hover:bg-orange-600 hover:text-white transition"
                >
                    Get Directions →
                </button>
            </div>
            <iframe
                src={mapSrc}
                width="100%"
                height="280"
                style={{ borderRadius: '12px', border: 'none' }}
                title="Turf Location"
                loading="lazy"
            />
        </div>
    );
}

function ReviewsSection({ turf, reviews }) {
    return (
        <div className="bg-white rounded-xl p-7 shadow-sm mb-5">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-3 mb-5">Ratings & Reviews</h3>

            {/* Summary */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="text-6xl font-black text-gray-900">{turf.rating}</div>
                    <div className="flex text-orange-500 my-2">
                        {[...Array(5)].map((_, i) => (
                            <IconStar key={i} className={`w-5 h-5 ${i < Math.round(turf.rating) ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                    </div>
                    <div className="text-sm text-gray-500">{turf.totalReviews} ratings</div>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-2">
                    {[
                        { s: 5, p: 65 }, { s: 4, p: 20 }, { s: 3, p: 10 }, { s: 2, p: 3 }, { s: 1, p: 2 }
                    ].map(r => (
                        <div key={r.s} className="flex items-center gap-3">
                            <span className="w-3 text-xs font-bold text-gray-600">{r.s}★</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-600 rounded-full" style={{ width: `${r.p}%` }}></div>
                            </div>
                            <span className="w-8 text-xs text-gray-400 text-right">{r.p}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-6">
                {reviews.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No reviews yet. Be the first to review!</div>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {review.userPicture ? <img src={review.userPicture} alt="u" className="w-full h-full rounded-full" /> : review.userName?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-gray-800 text-sm">{review.userName}</div>
                                            <div className="flex text-orange-400 text-xs my-1">
                                                {[...Array(Math.round(review.rating || 0))].map((_, i) => <IconStar key={i} className="w-3 h-3" />)}
                                            </div>
                                        </div>
                                        {review.timestamp && (
                                            <div className="text-xs text-gray-400">
                                                {review.timestamp?.toDate ? review.timestamp.toDate().toLocaleDateString() : 'Recent'}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">{review.comment}</p>
                                    {review.isVerifiedBooking && (
                                        <div className="mt-2 inline-block px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded uppercase tracking-wide border border-green-100">
                                            ✓ Verified Booking
                                        </div>
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
        <div className="bg-white rounded-xl p-7 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Managed By</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{turf.ownerName}</div>
            </div>
            <button
                onClick={() => window.location.href = `tel:${turf.ownerPhone}`}
                className="w-full md:w-auto border border-orange-600 text-orange-600 px-6 py-2.5 rounded-lg font-bold hover:bg-orange-600 hover:text-white transition"
            >
                Contact Owner
            </button>
        </div>
    );
}

function BookingCard({ turf }) {
    const [date, setDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);

    const price = turf.pricePerHour;
    const discountedPrice = turf.isDiscountActive ? Math.round(price * (1 - turf.discountPercent / 100)) : price;

    const generateSlots = () => {
        if (!turf.openTime || !turf.closeTime) return [];
        const slots = [];
        let [h, m] = turf.openTime.split(':').map(Number);
        const [ch, cm] = turf.closeTime.split(':').map(Number);

        let count = 0;
        while (count < 20) {
            const startMins = h * 60 + (m || 0);
            const endMinsLine = ch * 60 + (cm || 0);
            if (startMins + 120 > endMinsLine) break;

            const endH = h + 2;

            const format = (hr, mn) => {
                const p = hr >= 12 ? 'PM' : 'AM';
                const dHr = hr % 12 || 12;
                return `${dHr}:${(mn || 0).toString().padStart(2, '0')} ${p}`;
            };

            slots.push({
                id: `${h}-${m || 0}`,
                label: `${format(h, m)} – ${format(endH, m)}`,
                start: format(h, m)
            });

            h = endH;
            count++;
        }
        return slots;
    };

    const slots = generateSlots();
    const today = new Date().toISOString().split('T')[0];

    return (
        <div id="booking-card" className="sticky top-24 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            {/* Price */}
            <div className="mb-6">
                {turf.isDiscountActive ? (
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-400 line-through text-lg">{formatCurrency(price)}</span>
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">{turf.discountPercent}% OFF</span>
                        </div>
                        <div className="text-3xl font-extrabold text-[#ea580c]">{formatCurrency(discountedPrice)}</div>
                    </div>
                ) : (
                    <div className="text-3xl font-extrabold text-gray-900">
                        {formatCurrency(price)}<span className="text-base text-gray-500 font-normal">/hour</span>
                    </div>
                )}
            </div>

            {/* Date */}
            <div className="mb-6">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select Date</label>
                <div className="relative">
                    <input
                        type="date"
                        className="w-full h-12 border border-gray-300 rounded-lg px-4 font-semibold text-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                        min={today}
                        value={date}
                        onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }}
                    />
                </div>
            </div>

            {/* Slots */}
            <div className="mb-6">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select Time</label>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                    {slots.map(slot => (
                        <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`h-12 rounded-lg text-xs font-bold transition border ${selectedSlot?.id === slot.id
                                ? 'bg-orange-600 border-orange-600 text-white'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-orange-500 hover:text-orange-600'
                                }`}
                        >
                            {slot.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary */}
            {selectedSlot && date && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 animate-fadeIn">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">📅 Date</span>
                        <span className="font-bold text-gray-900">
                            {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">⏰ Time</span>
                        <span className="font-bold text-gray-900">{selectedSlot.label}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">⏳ Duration</span>
                        <span className="font-bold text-gray-900">2 hours</span>
                    </div>
                    <div className="h-px bg-orange-200 my-2"></div>
                    <div className="flex justify-between text-lg font-bold text-orange-800">
                        <span>Total</span>
                        <span>{formatCurrency(discountedPrice * 2)}</span>
                    </div>
                    {turf.isDiscountActive && (
                        <div className="text-right text-xs text-green-600 font-bold mt-1">
                            You saved {formatCurrency((price - discountedPrice) * 2)}!
                        </div>
                    )}
                </div>
            )}

            {/* Button */}
            <button
                className={`w-full h-12 rounded-lg font-bold text-lg transition flex items-center justify-center ${!date || !selectedSlot || turf.status === 'closed'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-red-600 transform hover:-translate-y-0.5 shadow-lg shadow-orange-200'
                    }`}
                disabled={!date || !selectedSlot || turf.status === 'closed'}
                onClick={() => alert(`Proceeding to book ${turf.name} on ${date} at ${selectedSlot.start}`)}
            >
                {!date ? 'Select Date First' : !selectedSlot ? 'Select Time Slot' : 'Proceed to Book →'}
            </button>

            <div className="text-center text-xs text-gray-400 mt-4">
                💰 Pay on arrival &nbsp;·&nbsp; ✓ Free cancellation
            </div>
        </div>
    );
}

function MobileBookingSheet({ turf }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between md:hidden z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <div>
                {turf.isDiscountActive && (
                    <div className="text-xs text-gray-500 line-through">{formatCurrency(turf.pricePerHour)}</div>
                )}
                <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(turf.isDiscountActive ? Math.round(turf.pricePerHour * (1 - turf.discountPercent / 100)) : turf.pricePerHour)}
                    <span className="text-sm font-normal text-gray-500">/hr</span>
                </div>
            </div>
            <button
                onClick={() => document.getElementById('booking-card')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-orange-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg"
            >
                Book Now
            </button>
        </div>
    );
}

// --- Main Page Component ---

export default function TurfDetailPage() {
    const { turfId } = useParams();   // ✅ Fixed: matches route param
    const navigate = useNavigate();

    const [turf, setTurf] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImg, setActiveImg] = useState(0);
    const [showSticky, setShowSticky] = useState(false);

    const heroRef = useRef(null);

    // ✅ Fixed: Data Fetching with correct collection name + normalization
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

        const ref = doc(db, 'turf', turfId);   // ✅ Fixed: 'turfs' not 'turf'
        const unsub = onSnapshot(ref,
            (snap) => {
                if (snap.exists()) {
                    setTurf(normalizeTurf(snap.id, snap.data()));  // ✅ Fixed: normalize data
                    setLoading(false);
                } else {
                    setError('Turf not found');
                    setLoading(false);
                }
            },
            (err) => {
                console.error("Fetch Error:", err);
                setError('Failed to load turf');
                setLoading(false);
            }
        );
        return () => unsub();
    }, [turfId]);

    // ✅ Fixed: Reviews sub-collection with correct path
    useEffect(() => {
        if (!turf || !turfId) return;
        const q = query(
            collection(db, 'turfs', turfId, 'reviews'),   // ✅ Fixed: 'turfs' not 'turf'
            orderBy('timestamp', 'desc'),
            limit(5)
        );
        const unsub = onSnapshot(q, (snap) => {
            setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [turf, turfId]);

    // Scroll Detection for Sticky Bar
    useEffect(() => {
        const handleScroll = () => {
            if (heroRef.current) {
                const bottom = heroRef.current.getBoundingClientRect().bottom;
                setShowSticky(bottom < 0);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Loading State
    if (loading) {
        return (
            <div className="w-full min-h-screen bg-[#1a1a2e] animate-pulse p-8 md:p-20">
                <div className="grid md:grid-cols-[280px_1fr_320px] gap-10">
                    <div className="h-[360px] bg-white/5 rounded-xl"></div>
                    <div className="flex flex-col gap-4">
                        <div className="h-10 w-2/3 bg-white/10 rounded"></div>
                        <div className="h-6 w-1/3 bg-white/10 rounded"></div>
                        <div className="h-20 w-full bg-white/10 rounded mt-4"></div>
                    </div>
                    <div className="h-[280px] bg-white/5 rounded-xl hidden md:block"></div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="text-6xl mb-4">🏟️</div>
                <h2 className="text-2xl font-bold text-gray-900">Turf Not Found</h2>
                <p className="text-gray-600 mt-2">{error}</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 transition"
                >
                    ← Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="bg-[#f5f5f5] min-h-screen font-sans">
            <StickyBar turf={turf} visible={showSticky} />

            <div ref={heroRef}>
                <HeroSection turf={turf} activeImg={activeImg} setActiveImg={setActiveImg} />
            </div>

            <div id="main-content" className="max-w-[1240px] mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">

                {/* Left Column */}
                <div className="w-full">
                    <AboutSection turf={turf} />
                    <SportsSection turf={turf} />
                    <AmenitiesSection turf={turf} />
                    <TimingsSection turf={turf} />
                    <LocationSection turf={turf} />
                    <ReviewsSection turf={turf} reviews={reviews} />
                    <OwnerSection turf={turf} />
                </div>

                {/* Right Column - Booking */}
                <div className="hidden lg:block relative">
                    <BookingCard turf={turf} />
                </div>

            </div>

            <MobileBookingSheet turf={turf} />
        </div>
    );
}