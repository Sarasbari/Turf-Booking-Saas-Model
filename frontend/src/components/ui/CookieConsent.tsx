import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'cookie_consent';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            // Small delay so it doesn't flash during page load
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        setIsVisible(false);

        // Initialize Firebase Analytics now that user has consented
        try {
            import('firebase/analytics').then(({ getAnalytics }) => {
                import('@/services/firebase').then(({ app }) => {
                    getAnalytics(app);
                    console.log('✅ Firebase Analytics initialized (consent given)');
                });
            });
        } catch {
            // Analytics init is non-critical
        }
    };

    const handleDeny = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'denied');
        setIsVisible(false);
    };

    const handleLearnMore = () => {
        setIsVisible(false);
        navigate('/privacy-policy#cookies');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4"
                >
                    <div className="max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-700/50 p-5 backdrop-blur-lg">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-200 leading-relaxed">
                                    <span className="mr-1.5">🍪</span>
                                    We use cookies to improve your experience and analyze platform usage.
                                    By using aLiveHub, you agree to our cookie policy.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={handleLearnMore}
                                    className="px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
                                >
                                    Learn More
                                </button>
                                <button
                                    onClick={handleDeny}
                                    className="px-4 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                                >
                                    Deny
                                </button>
                                <button
                                    onClick={handleAccept}
                                    className="px-4 py-2 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    Accept All
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
