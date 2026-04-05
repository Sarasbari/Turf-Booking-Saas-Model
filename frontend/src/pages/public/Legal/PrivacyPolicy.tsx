import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
                <div className="max-w-3xl mx-auto px-6">
                    <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
                    <p className="text-gray-400 text-sm">Last updated: April 5, 2026</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-10">

                    {/* Intro */}
                    <section>
                        <p className="text-gray-600 leading-relaxed">
                            At <strong className="text-gray-900">aLiveHub</strong>, we are committed to protecting
                            your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
                            your information when you use our sports turf booking platform. Please read this policy
                            carefully to understand our practices regarding your personal data.
                        </p>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 1. Data We Collect */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                            Information We Collect
                        </h2>
                        <p className="text-gray-600 mb-4">We collect the following categories of information:</p>
                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 text-sm mb-1">Account Information</h3>
                                <p className="text-gray-600 text-sm">Name and email address, collected through Firebase Authentication (Google Sign-In).</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 text-sm mb-1">Payment Information</h3>
                                <p className="text-gray-600 text-sm">Payment details are processed securely by Razorpay. We do not store your card numbers, CVV, or bank details on our servers.</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 text-sm mb-1">Booking History</h3>
                                <p className="text-gray-600 text-sm">Details of your turf bookings, including dates, time slots, turf names, and payment amounts, stored in Google Cloud Firestore.</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 text-sm mb-1">Location Data</h3>
                                <p className="text-gray-600 text-sm">Approximate location used to show nearby turfs and relevant search results. We do not track your precise GPS location continuously.</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 text-sm mb-1">Device & Browser Information</h3>
                                <p className="text-gray-600 text-sm">Device type, browser version, and usage patterns collected through Firebase Analytics to improve the platform experience.</p>
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 2. How We Use Data */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                            How We Use Your Information
                        </h2>
                        <ul className="space-y-2 text-gray-600 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Processing and confirming your turf bookings</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Sending booking confirmations, reminders, and cancellation notifications via email</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Providing personalized turf recommendations based on your booking history</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Improving our platform features, performance, and user experience</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Responding to your support requests and feedback</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Detecting and preventing fraudulent transactions</span>
                            </li>
                        </ul>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 3. Third-Party Services */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                            Third-Party Services
                        </h2>
                        <p className="text-gray-600 text-sm mb-4">We use the following trusted third-party services:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="border border-gray-200 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 text-sm">Firebase (Google)</h3>
                                <p className="text-gray-500 text-xs mt-1">Authentication, database, analytics, and hosting infrastructure.</p>
                            </div>
                            <div className="border border-gray-200 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 text-sm">Razorpay</h3>
                                <p className="text-gray-500 text-xs mt-1">Secure payment processing. PCI DSS Level 1 compliant.</p>
                            </div>
                            <div className="border border-gray-200 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 text-sm">Brevo (Sendinblue)</h3>
                                <p className="text-gray-500 text-xs mt-1">Transactional emails for booking confirmations and notifications.</p>
                            </div>
                            <div className="border border-gray-200 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 text-sm">Vercel</h3>
                                <p className="text-gray-500 text-xs mt-1">Application hosting and serverless backend deployment.</p>
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 4. Data Retention */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                            Data Retention
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            We retain your booking data for a period of <strong>2 years</strong> from the date of the booking.
                            Account information is retained as long as your account remains active. After account
                            deletion, your personal data will be removed within 30 days, except where retention
                            is required by law or for legitimate business purposes (e.g., transaction records for tax compliance).
                        </p>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 5. Cookies */}
                    <section id="cookies">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-yellow-100 text-yellow-700 rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                            Cookies & Tracking
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                            We use cookies and similar technologies to enhance your experience:
                        </p>
                        <ul className="space-y-2 text-gray-600 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="font-semibold text-gray-700">Essential:</span>
                                <span>Authentication session cookies required for the platform to function.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-semibold text-gray-700">Analytics:</span>
                                <span>Firebase Analytics and Google Analytics cookies to understand usage patterns (only with your consent).</span>
                            </li>
                        </ul>
                        <p className="text-gray-600 text-sm mt-3">
                            You can manage your cookie preferences through the cookie consent banner displayed when you first visit our site.
                        </p>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 6. User Rights */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-red-100 text-red-700 rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                            Your Rights
                        </h2>
                        <p className="text-gray-600 text-sm mb-3">You have the right to:</p>
                        <ul className="space-y-2 text-gray-600 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Access your personal data that we hold</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Request correction of inaccurate information</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Request deletion of your account and personal data</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Withdraw consent for analytics tracking at any time</span>
                            </li>
                        </ul>
                        <p className="text-gray-600 text-sm mt-3">
                            To exercise any of these rights, please contact us at{' '}
                            <a href="mailto:support@alivehub.in" className="text-green-600 hover:text-green-700 font-medium underline">
                                support@alivehub.in
                            </a>
                        </p>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 7. Security */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                            Data Security
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            We implement industry-standard security measures including HTTPS encryption, Firebase
                            security rules, server-side payment verification, and rate-limited API endpoints. While
                            we strive to protect your data, no method of electronic transmission is 100% secure. We
                            encourage you to use strong, unique passwords and enable two-factor authentication where possible.
                        </p>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 8. Contact */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold">8</span>
                            Contact Us
                        </h2>
                        <p className="text-gray-600 text-sm mb-4">
                            If you have any questions about this Privacy Policy or our data practices, please contact us:
                        </p>
                        <div className="bg-gray-50 rounded-xl p-5">
                            <p className="text-gray-700 text-sm font-medium">aLiveHub</p>
                            <p className="text-gray-600 text-sm mt-1">
                                Email:{' '}
                                <a href="mailto:support@alivehub.in" className="text-green-600 hover:text-green-700 underline">
                                    support@alivehub.in
                                </a>
                            </p>
                        </div>
                    </section>
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <Link
                        to="/"
                        className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
