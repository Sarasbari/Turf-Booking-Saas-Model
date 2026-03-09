import React from 'react';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import { TrendingUp, Calendar, Activity, IndianRupee } from 'lucide-react';

const Overview: React.FC = () => {
    const { turfs, bookings, stats, loading, error } = useOwnerDashboard();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="rounded-lg bg-red-50 p-4 text-red-800">
                    <h3 className="font-medium text-red-900">Error loading dashboard</h3>
                    <p className="mt-1 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (turfs.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 rounded-full bg-orange-100 p-4">
                    <Activity className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">No Turfs Found</h2>
                <p className="mt-2 max-w-md text-gray-600">
                    You haven't listed any turfs yet. Register a turf to start accepting bookings and earning revenue.
                </p>
            </div>
        );
    }

    // Get today's bookings
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysBookings = bookings.filter(b => b.date === todayStr).sort((a, b) => (a.timeSlots?.[0] || '').localeCompare(b.timeSlots?.[0] || ''));

    return (
        <div className="space-y-6 p-6 md:p-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="mt-1 text-gray-500">Welcome back! Here's what's happening at your turfs today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Earnings */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                ₹{stats.totalEarnings.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                            <IndianRupee className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="flex items-center text-green-600 font-medium">
                            <TrendingUp className="mr-1 h-4 w-4" /> All time
                        </span>
                    </div>
                </div>

                {/* Bookings Today */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Bookings Today</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.todayBookings}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Calendar className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                        For {todayStr}
                    </div>
                </div>

                {/* Total Bookings */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            <Activity className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                        Across {turfs.length} turf(s)
                    </div>
                </div>

                {/* Occupancy Rate */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Today's Occupancy</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.occupancyRate}%</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                        Estimated capacity used
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="mt-8 rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
                </div>
                <div className="p-0">
                    {todaysBookings.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {todaysBookings.map((booking) => {
                                const turfName = turfs.find(t => t.id === booking.turfId)?.name || 'Unknown Turf';
                                return (
                                    <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 transition-colors hover:bg-gray-50">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-20 flex-col items-center justify-center rounded bg-gray-100 font-mono text-sm font-bold text-gray-700">
                                                {booking.timeSlots?.[0] || 'N/A'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{booking.customerName || booking.userId}</p>
                                                <p className="text-sm text-gray-500">{turfName} • {booking.sport}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:mt-0 flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900">₹{booking.totalPrice}</p>
                                                <p className="text-xs text-gray-500">{booking.paymentMethod || 'Online'}</p>
                                            </div>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No bookings scheduled for today.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Overview;
