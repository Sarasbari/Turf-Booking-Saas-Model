/**
 * HomePage Component
 * 
 * Displays all active turfs in a responsive grid layout.
 * Includes loading states and error handling.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTurfs, seedSampleTurfs } from '../firebase/turfs';

const HomePage = () => {
    const [turfs, setTurfs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTurfs = async () => {
            try {
                setLoading(true);
                const data = await getAllTurfs();
                setTurfs(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching turfs:', err);
                setError('Failed to load turfs. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchTurfs();
    }, []);

    const handleSeedData = async () => {
        if (!window.confirm('This will add sample turf data to your Firebase database. Continue?')) return;

        try {
            setLoading(true);
            await seedSampleTurfs();
            alert('✅ Sample data added! Reloading...');
            window.location.reload();
        } catch (err) {
            console.error('Error seeding data:', err);
            alert('Failed to add sample data. Check console for details.');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-lg">Loading turfs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={handleSeedData}
                        className="block w-full mt-4 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Add Sample Data (Admin)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Browse Turfs
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Find and book the perfect turf for your game
                        </p>
                    </div>
                    <button
                        onClick={handleSeedData}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shadow-sm"
                    >
                        + Add Sample Data
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results Count */}
                <div className="mb-6">
                    <p className="text-gray-600">
                        <span className="font-semibold text-gray-900">{turfs.length}</span>{' '}
                        {turfs.length === 1 ? 'turf' : 'turfs'} available
                    </p>
                </div>

                {/* Turfs Grid */}
                {turfs.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">🏟️</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No turfs available
                        </h3>
                        <p className="text-gray-500 mb-8">
                            Your database is empty.
                        </p>
                        <button
                            onClick={handleSeedData}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                        >
                            Add Sample Turfs Now
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {turfs.map((turf) => (
                            <TurfCard key={turf.id} turf={turf} navigate={navigate} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

/**
 * TurfCard Component
 * Individual turf card for grid display
 */
const TurfCard = ({ turf, navigate }) => {
    const handleCardClick = () => {
        navigate(`/turf/${turf.id}`);
    };

    return (
        <div
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
            onClick={handleCardClick}
        >
            {/* Cover Image */}
            <div className="relative h-48 bg-gray-200">
                <img
                    src={turf.coverImage}
                    alt={turf.name}
                    className="w-full h-full object-cover"
                />
                {turf.isFeatured && (
                    <span className="absolute top-3 right-3 bg-orange-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Featured
                    </span>
                )}
            </div>

            {/* Card Content */}
            <div className="p-4">
                {/* Turf Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                    {turf.name}
                </h3>

                {/* Location */}
                <p className="text-sm text-gray-600 mb-2 flex items-center">
                    <span className="mr-1">📍</span>
                    {turf.location.city}
                </p>

                {/* Sport & Size */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {turf.sport}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {turf.turfSize}
                    </span>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-3">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    <span className="text-sm font-semibold text-gray-900">
                        {turf.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                        ({turf.totalReviews} reviews)
                    </span>
                </div>

                {/* Pricing */}
                <div className="mb-4">
                    <p className="text-sm text-gray-600">Starting from</p>
                    <p className="text-2xl font-bold text-orange-600">
                        ₹{turf.pricing.basePrice}
                        <span className="text-sm text-gray-500 font-normal">/hr</span>
                    </p>
                </div>

                {/* Book Button */}
                <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    View Details
                </button>
            </div>
        </div>
    );
};

export default HomePage;
