import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { trackEvent } from '@/services/analyticsService';

export function Contact() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) return;

        setStatus('submitting');
        try {
            await addDoc(collection(db, 'contactRequests'), {
                ...form,
                createdAt: serverTimestamp(),
                status: 'unread',
            });
            trackEvent.contactFormSubmitted();
            setStatus('success');
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error('Error submitting contact form:', error);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
                <div className="max-w-3xl mx-auto px-6">
                    <h1 className="text-4xl font-bold mb-3">Get in Touch</h1>
                    <p className="text-gray-400">We'd love to hear from you. We respond within 24 hours.</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {/* Contact Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 mb-4">Contact Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-lg">📧</span>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Email</p>
                                        <a
                                            href="mailto:support@alivehub.in"
                                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                                        >
                                            support@alivehub.in
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-lg">📱</span>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">WhatsApp</p>
                                        <p className="text-sm text-gray-700 font-medium">+91 XXXXXXXXXX</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                            <p className="text-green-800 text-sm font-medium">
                                💡 For booking issues, include your Booking ID in the message for faster resolution.
                            </p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 mb-5">Send us a message</h2>

                            {status === 'success' ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-3xl">✅</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Message Sent!</h3>
                                    <p className="text-gray-600 text-sm mb-4">
                                        We'll get back to you within 24 hours.
                                    </p>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="text-green-600 text-sm font-medium hover:text-green-700"
                                    >
                                        Send another message →
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Subject</label>
                                        <input
                                            type="text"
                                            name="subject"
                                            value={form.subject}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                            placeholder="What's this about?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Message *</label>
                                        <textarea
                                            name="message"
                                            value={form.message}
                                            onChange={handleChange}
                                            required
                                            rows={4}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
                                            placeholder="Tell us how we can help..."
                                        />
                                    </div>

                                    {status === 'error' && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                                            Something went wrong. Please try again or email us directly.
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={status === 'submitting'}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {status === 'submitting' ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Message →'
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
