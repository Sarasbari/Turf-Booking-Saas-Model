import React, { useState, useMemo } from 'react';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import { Search, Filter } from 'lucide-react';

const Bookings: React.FC = () => {
    const { bookings, turfs, loading, error } = useOwnerDashboard();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [turfFilter, setTurfFilter] = useState<string>('all');

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            // Free text search (customer name, ID)
            const custName = b.customerName || b.userId || '';
            const matchesSearch = searchTerm === ''
                || custName.toLowerCase().includes(searchTerm.toLowerCase())
                || b.id.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

            // Turf filter
            const matchesTurf = turfFilter === 'all' || b.turfId === turfFilter;

            return matchesSearch && matchesStatus && matchesTurf;
        });
    }, [bookings, searchTerm, statusFilter, turfFilter]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading bookings...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-600">{error}</div>;
    }

    return (
        <div className="space-y-6 p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
                    <p className="mt-1 text-sm text-gray-500">View and manage your turf reservations</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search customer name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        value={turfFilter}
                        onChange={(e) => setTurfFilter(e.target.value)}
                        className="rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                        <option value="all">All Turfs</option>
                        {turfs.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Desktop Table (Hidden on small screens) */}
            <div className="hidden rounded-xl border border-gray-100 bg-white shadow-sm md:block overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Turf</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredBookings.map((b) => {
                                const turf = turfs.find(t => t.id === b.turfId);
                                return (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{b.date}</div>
                                            <div className="text-gray-500">{b.timeSlots?.[0]} - {b.timeSlots?.[b.timeSlots.length - 1]}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{b.customerName || b.userId}</div>
                                            <div className="text-gray-500">{b.customerPhone || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            <div>{turf?.name || 'Unknown Turf'}</div>
                                            <div className="text-xs text-gray-400 capitalize">{b.sport}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            ₹{b.totalPrice}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                b.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredBookings.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No bookings match your filters.</div>
                    )}
                </div>
            </div>

            {/* Mobile Card List (Visible on small screens) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredBookings.map((b) => {
                    const turf = turfs.find(t => t.id === b.turfId);
                    return (
                        <div key={b.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-start justify-between">
                                <div>
                                    <div className="font-semibold text-gray-900">{b.customerName || b.userId}</div>
                                    <div className="text-sm text-gray-500">{b.customerPhone || 'N/A'}</div>
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    b.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {b.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-700">
                                <span className="font-medium">{turf?.name}</span> • {b.sport}
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                                <div className="font-medium text-indigo-600">{b.date} • {b.timeSlots?.[0]}</div>
                                <div className="font-bold text-gray-900">₹{b.totalPrice}</div>
                            </div>
                        </div>
                    );
                })}
                {filteredBookings.length === 0 && (
                    <div className="p-8 text-center text-gray-500 rounded-xl border border-gray-100 bg-white">
                        No bookings match your filters.
                    </div>
                )}
            </div>

        </div>
    );
};

export default Bookings;
