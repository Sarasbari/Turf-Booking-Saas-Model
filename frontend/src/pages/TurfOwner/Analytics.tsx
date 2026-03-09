import React, { useMemo, useState } from 'react';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend
} from 'recharts';

const Analytics: React.FC = () => {
    const { bookings, loading, error } = useOwnerDashboard();
    const [period, setPeriod] = useState<'7days' | '30days'>('7days');

    const chartData = useMemo(() => {
        if (!bookings.length) return [];

        const days = period === '7days' ? 7 : 30;
        const data = [];

        // Generate last N days
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const dayBookings = bookings.filter(b => b.date === dateStr && (b.status === 'confirmed' || b.status === 'pending'));

            const revenue = dayBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0);
            const count = dayBookings.length;

            // Short readable date (e.g., "Mar 09")
            const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            data.push({
                date: dateStr,
                displayDate: shortDate,
                revenue,
                bookings: count
            });
        }

        return data;
    }, [bookings, period]);

    const stats = useMemo(() => {
        const totalRev = chartData.reduce((sum, day) => sum + day.revenue, 0);
        const totalBooks = chartData.reduce((sum, day) => sum + day.bookings, 0);
        const avgRev = chartData.length > 0 ? (totalRev / chartData.length).toFixed(0) : 0;

        return { totalRev, totalBooks, avgRev };
    }, [chartData]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;

    return (
        <div className="space-y-6 p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="mt-1 text-sm text-gray-500">Track your performance and revenue trends.</p>
                </div>

                <div className="flex rounded-lg border border-gray-200 bg-white p-1">
                    <button
                        onClick={() => setPeriod('7days')}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${period === '7days' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => setPeriod('30days')}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${period === '30days' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Last 30 Days
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total Revenue ({period})</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">₹{stats.totalRev.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total Bookings ({period})</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalBooks}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Average Daily Revenue</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">₹{Number(stats.avgRev).toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Revenue Chart */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-6 text-lg font-semibold text-gray-900">Revenue Trend</h2>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} tickFormatter={(val) => `₹${val}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`₹${value || 0}`, 'Revenue']}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#EA580C" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bookings Chart */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-6 text-lg font-semibold text-gray-900">Bookings Volume</h2>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#F3F4F6' }}
                                />
                                <Bar dataKey="bookings" name="Bookings" fill="#818CF8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
