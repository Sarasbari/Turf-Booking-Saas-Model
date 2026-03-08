import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import './TurfDetailPage.css';

/**
 * TurfDetailPage - Simplified version with better error handling
 */
const TurfDetailPage = () => {
    const { turfId } = useParams();
    const navigate = useNavigate();

    const [turf, setTurf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch turf data with real-time updates
    useEffect(() => {
        if (!turfId) {
            setError('No turf ID provided');
            setLoading(false);
            return;
        }

        const turfRef = doc(db, 'turf', turfId);

        const unsubscribe = onSnapshot(
            turfRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setTurf({ id: snapshot.id, ...data });
                    setLoading(false);
                    document.title = `${data.name || 'Turf'} - BookMyTurf`;
                } else {
                    setError('Turf not found');
                    setLoading(false);
                }
            },
            (err) => {
                console.error('Error fetching turf:', err);
                setError('Failed to load turf data');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [turfId]);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="turf-detail-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading turf details...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !turf) {
        return (
            <div className="turf-detail-page">
                <div className="error-container">
                    <div className="error-icon">🏟️</div>
                    <h2>Turf Not Found</h2>
                    <p>{error || 'This turf may no longer be available'}</p>
                    <button onClick={() => navigate('/')} className="back-btn">
                        Browse All Turfs
                    </button>
                </div>
            </div>
        );
    }

    // Extract data safely with defaults
    const {
        name = 'Unnamed Turf',
        description = '',
        coverImage = '',
        images = [],
        sport = 'Football',
        turfSize = '5-a-side',
        location = {},
        pricing = {},
        rating = 0,
        totalReviews = 0,
    } = turf;

    const displayImage = coverImage || images[0] || 'https://via.placeholder.com/800x600?text=No+Image';
    const pricePerHour = pricing?.basePrice || 0;
    const city = location?.city || 'Unknown';
    const address = location?.address || 'Address not available';

    return (
        <div className="turf-detail-page" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            {/* Simple Header */}
            <div style={{
                background: '#1a1a2e',
                color: 'white',
                padding: '20px',
                marginBottom: '30px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'transparent',
                            border: '1px solid white',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginBottom: '15px'
                        }}
                    >
                        ← Back
                    </button>
                    <h1 style={{ margin: '10px 0', fontSize: '32px' }}>{name}</h1>
                    <p style={{ margin: '5px 0', opacity: 0.8 }}>📍 {city}</p>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    {/* Left Column */}
                    <div>
                        {/* Image */}
                        <img
                            src={displayImage}
                            alt={name}
                            style={{
                                width: '100%',
                                height: '400px',
                                objectFit: 'cover',
                                borderRadius: '10px',
                                marginBottom: '20px'
                            }}
                        />

                        {/* Description */}
                        <div style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '10px',
                            marginBottom: '20px'
                        }}>
                            <h2>About</h2>
                            <p>{description || 'No description available'}</p>
                        </div>

                        {/* Location */}
                        <div style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '10px'
                        }}>
                            <h2>Location</h2>
                            <p>{address}</p>
                            <p><strong>City:</strong> {city}</p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div>
                        {/* Booking Card */}
                        <div style={{
                            background: 'white',
                            padding: '25px',
                            borderRadius: '10px',
                            position: 'sticky',
                            top: '20px'
                        }}>
                            <h2 style={{ marginTop: 0 }}>Book This Turf</h2>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '14px', color: '#666' }}>Price</div>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6b35' }}>
                                    ₹{pricePerHour}
                                    <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#666' }}>/hour</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Sport</div>
                                <div style={{
                                    padding: '10px',
                                    background: '#f0f0f0',
                                    borderRadius: '5px',
                                    fontWeight: '500'
                                }}>
                                    {sport}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Size</div>
                                <div style={{
                                    padding: '10px',
                                    background: '#f0f0f0',
                                    borderRadius: '5px',
                                    fontWeight: '500'
                                }}>
                                    {turfSize}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Rating</div>
                                <div style={{ fontSize: '18px', fontWeight: '500' }}>
                                    ⭐ {rating.toFixed(1)} ({totalReviews} reviews)
                                </div>
                            </div>

                            <button style={{
                                width: '100%',
                                padding: '15px',
                                background: '#ff6b35',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}>
                                Book Now
                            </button>

                            <p style={{
                                marginTop: '15px',
                                fontSize: '12px',
                                color: '#666',
                                textAlign: 'center'
                            }}>
                                💰 Pay on arrival · Free cancellation
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TurfDetailPage;
