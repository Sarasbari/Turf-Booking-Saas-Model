/**
 * OwnerEditTurf Component
 * 
 * Allows owners to edit their turf details with ownership verification.
 * Pre-fills form with existing data and validates ownership before saving.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTurfById, updateTurf } from '../firebase/turfs';
import { getCurrentUser } from '../firebase/auth';

const OwnerEditTurf = () => {
    const { turfId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        basePrice: '',
        weekendPrice: '',
        peakHourPrice: '',
        opensAt: '',
        closesAt: '',
        status: 'active',
    });

    // Load turf data on mount
    useEffect(() => {
        const loadTurf = async () => {
            try {
                setLoading(true);
                const turf = await getTurfById(turfId);

                // Pre-fill form with existing data
                setFormData({
                    name: turf.name,
                    description: turf.description,
                    basePrice: turf.pricing.basePrice,
                    weekendPrice: turf.pricing.weekendPrice,
                    peakHourPrice: turf.pricing.peakHourPrice,
                    opensAt: turf.operatingHours.opensAt,
                    closesAt: turf.operatingHours.closesAt,
                    status: turf.status,
                });

                setError(null);
            } catch (err) {
                console.error('Error loading turf:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadTurf();
    }, [turfId]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const user = getCurrentUser();
        if (!user) {
            setError('You must be logged in to edit turfs');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            // Prepare updates
            const updates = {
                name: formData.name,
                description: formData.description,
                pricing: {
                    basePrice: Number(formData.basePrice),
                    weekendPrice: Number(formData.weekendPrice),
                    peakHourPrice: Number(formData.peakHourPrice),
                },
                operatingHours: {
                    opensAt: formData.opensAt,
                    closesAt: formData.closesAt,
                },
                status: formData.status,
            };

            // Update turf (ownership verification happens in the function)
            await updateTurf(turfId, updates, user.uid);

            setSuccess(true);
            setTimeout(() => {
                navigate(`/turf/${turfId}`);
            }, 2000);
        } catch (err) {
            console.error('Error updating turf:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-lg">Loading turf data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Edit Turf</h1>
                    <p className="mt-2 text-gray-600">
                        Update your turf details and pricing
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <span className="text-red-500 text-xl mr-3">⚠️</span>
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <span className="text-green-500 text-xl mr-3">✓</span>
                            <p className="text-green-700">
                                Turf updated successfully! Redirecting...
                            </p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                    {/* Turf Name */}
                    <div className="mb-6">
                        <label
                            htmlFor="name"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                            Turf Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 outline-none transition"
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label
                            htmlFor="description"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 outline-none transition resize-none"
                        />
                    </div>

                    {/* Pricing Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Pricing (per hour)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label
                                    htmlFor="basePrice"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Weekday Price
                                </label>
                                <input
                                    type="number"
                                    id="basePrice"
                                    name="basePrice"
                                    value={formData.basePrice}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 outline-none transition"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="weekendPrice"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Weekend Price
                                </label>
                                <input
                                    type="number"
                                    id="weekendPrice"
                                    name="weekendPrice"
                                    value={formData.weekendPrice}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 outline-none transition"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="peakHourPrice"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Peak Hour Price
                                </label>
                                <input
                                    type="number"
                                    id="peakHourPrice"
                                    name="peakHourPrice"
                                    value={formData.peakHourPrice}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Operating Hours
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="opensAt"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Opens At
                                </label>
                                <input
                                    type="time"
                                    id="opensAt"
                                    name="opensAt"
                                    value={formData.opensAt}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 outline-none transition"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="closesAt"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Closes At
                                </label>
                                <input
                                    type="time"
                                    id="closesAt"
                                    name="closesAt"
                                    value={formData.closesAt}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="mb-6">
                        <label
                            htmlFor="status"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 outline-none transition"
                        >
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                        </select>
                        <p className="mt-1 text-sm text-gray-500">
                            Paused turfs won't appear in search results
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OwnerEditTurf;
