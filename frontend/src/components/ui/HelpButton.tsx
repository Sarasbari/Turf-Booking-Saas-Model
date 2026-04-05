import { useState, FormEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/services/analyticsService';
import { useNavigate } from 'react-router-dom';

type PopupView = 'menu' | 'bug' | 'feature' | null;

export function HelpButton() {
    const [view, setView] = useState<PopupView>(null);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const { user } = useAuth();
    const navigate = useNavigate();
    const popupRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setView(null);
                setSubmitStatus('idle');
            }
        }
        if (view) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [view]);

    const handleBugSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setSubmitStatus('submitting');

        try {
            await addDoc(collection(db, 'bugReports'), {
                description: formData.get('doing') as string,
                steps: formData.get('wrong') as string,
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || 'anonymous',
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: serverTimestamp(),
                status: 'new',
            });
            trackEvent.bugReportSubmitted();
            setSubmitStatus('success');
            setTimeout(() => { setView(null); setSubmitStatus('idle'); }, 1500);
        } catch (err) {
            console.error('Error submitting bug report:', err);
            setSubmitStatus('idle');
        }
    };

    const handleFeatureSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setSubmitStatus('submitting');

        try {
            await addDoc(collection(db, 'featureRequests'), {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || 'anonymous',
                timestamp: serverTimestamp(),
                status: 'new',
                votes: 0,
            });
            setSubmitStatus('success');
            setTimeout(() => { setView(null); setSubmitStatus('idle'); }, 1500);
        } catch (err) {
            console.error('Error submitting feature request:', err);
            setSubmitStatus('idle');
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-40" ref={popupRef}>
            <AnimatePresence>
                {view && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                    >
                        {/* Menu */}
                        {view === 'menu' && (
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 text-sm mb-3">How can we help?</h3>
                                <div className="space-y-1.5">
                                    <button
                                        onClick={() => setView('bug')}
                                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <span className="text-lg">🐛</span>
                                        <span className="text-sm text-gray-700 font-medium">Report a Bug</span>
                                    </button>
                                    <button
                                        onClick={() => setView('feature')}
                                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <span className="text-lg">💡</span>
                                        <span className="text-sm text-gray-700 font-medium">Suggest a Feature</span>
                                    </button>
                                    <button
                                        onClick={() => { setView(null); navigate('/contact'); }}
                                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <span className="text-lg">💬</span>
                                        <span className="text-sm text-gray-700 font-medium">Contact Support</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Bug Report Form */}
                        {view === 'bug' && (
                            <div className="p-4">
                                <button onClick={() => setView('menu')} className="text-xs text-gray-400 hover:text-gray-600 mb-2">
                                    ← Back
                                </button>
                                <h3 className="font-bold text-gray-900 text-sm mb-3">🐛 Report a Bug</h3>
                                {submitStatus === 'success' ? (
                                    <div className="text-center py-4">
                                        <span className="text-2xl">✅</span>
                                        <p className="text-sm text-gray-600 mt-2">Thanks! We'll look into it.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleBugSubmit} className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">What were you doing?</label>
                                            <input
                                                name="doing"
                                                required
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                placeholder="e.g. Trying to book a slot..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">What went wrong?</label>
                                            <textarea
                                                name="wrong"
                                                required
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                                                placeholder="Describe the issue..."
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitStatus === 'submitting'}
                                            className="w-full py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs rounded-lg font-medium transition-colors"
                                        >
                                            {submitStatus === 'submitting' ? 'Sending...' : 'Submit Bug Report'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Feature Request Form */}
                        {view === 'feature' && (
                            <div className="p-4">
                                <button onClick={() => setView('menu')} className="text-xs text-gray-400 hover:text-gray-600 mb-2">
                                    ← Back
                                </button>
                                <h3 className="font-bold text-gray-900 text-sm mb-3">💡 Suggest a Feature</h3>
                                {submitStatus === 'success' ? (
                                    <div className="text-center py-4">
                                        <span className="text-2xl">✅</span>
                                        <p className="text-sm text-gray-600 mt-2">Thanks for the suggestion!</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleFeatureSubmit} className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Feature title</label>
                                            <input
                                                name="title"
                                                required
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                placeholder="e.g. Add favorite turfs..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Description</label>
                                            <textarea
                                                name="description"
                                                required
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                                                placeholder="What would this help you do?"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitStatus === 'submitting'}
                                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-xs rounded-lg font-medium transition-colors"
                                        >
                                            {submitStatus === 'submitting' ? 'Sending...' : 'Submit Suggestion'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <button
                onClick={() => setView(view ? null : 'menu')}
                className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                aria-label="Help & Feedback"
            >
                <span className="text-lg font-bold">{view ? '✕' : '?'}</span>
            </button>
        </div>
    );
}
