import React, { useState, useEffect } from 'react';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Turf } from '../../types';

const ManageTurf: React.FC = () => {
    const { turfs, loading, error } = useOwnerDashboard();
    const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
    const [formData, setFormData] = useState<Partial<Turf>>({});
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initialize form when turfs load or selection changes
    useEffect(() => {
        if (turfs.length > 0 && !selectedTurf) {
            setSelectedTurf(turfs[0]);
        }
    }, [turfs, selectedTurf]);

    useEffect(() => {
        if (selectedTurf) {
            setFormData(selectedTurf);
        }
    }, [selectedTurf]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const finalValue = type === 'number' ? Number(value) : value;

        setFormData((prev: Partial<Turf>) => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const handleAmenitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData((prev: Partial<Turf>) => {
            const currentAmenities = prev.amenities || [];
            if (checked) {
                return { ...prev, amenities: [...currentAmenities, value] };
            } else {
                return { ...prev, amenities: currentAmenities.filter((a: string) => a !== value) };
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTurf?.id) return;

        setSaving(true);
        setSaveMessage(null);

        try {
            const turfRef = doc(db, 'turf', selectedTurf.id);
            await updateDoc(turfRef, {
                name: formData.name,
                city: formData.city,
                address: formData.address,
                pricePerHour: formData.pricePerHour,
                amenities: formData.amenities,
            });
            setSaveMessage({ type: 'success', text: 'Turf details updated successfully!' });
        } catch (error) {
            const err = error as Error;
            setSaveMessage({ type: 'error', text: err.message || 'Failed to update turf' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading turf details...</div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;

    const availableAmenities = ['Parking', 'Washroom', 'Drinking Water', 'Changing Room', 'Floodlights', 'First Aid', 'Equipment Rent'];

    return (
        <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Turf</h1>
                    <p className="mt-1 text-sm text-gray-500">Update your turf information, pricing, and amenities.</p>
                </div>

                {turfs.length > 1 && (
                    <select
                        className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        value={selectedTurf?.id || ''}
                        onChange={(e) => {
                            const t = turfs.find(t => t.id === e.target.value);
                            if (t) setSelectedTurf(t);
                        }}
                    >
                        {turfs.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {saveMessage && (
                <div className={`rounded-md p-4 ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {saveMessage.text}
                </div>
            )}

            {selectedTurf && (
                <form onSubmit={handleSave} className="space-y-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Basic Information</h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">Turf Name</label>
                                <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-orange-500 focus:ring-orange-500" />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
                                <input required type="text" name="city" value={formData.city || ''} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-orange-500 focus:ring-orange-500" />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">Full Address</label>
                                <textarea required name="address" rows={2} value={formData.address || ''} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Hours */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Pricing & Hours</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Price per Hour (₹)</label>
                                <input required type="number" name="pricePerHour" min="0" value={formData.pricePerHour || ''} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-orange-500 focus:ring-orange-500" />
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Amenities</h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {availableAmenities.map(amenity => (
                                <label key={amenity} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        value={amenity}
                                        checked={formData.amenities?.includes(amenity) || false}
                                        onChange={handleAmenitiesChange}
                                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700">{amenity}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center justify-center rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ManageTurf;
