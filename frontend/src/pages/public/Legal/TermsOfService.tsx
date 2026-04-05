import { Link } from 'react-router-dom';

export function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
                <div className="max-w-3xl mx-auto px-6">
                    <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
                    <p className="text-gray-400 text-sm">Last updated: April 5, 2026</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-10">

                    {/* 1. Acceptance */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                            Acceptance of Terms
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            By accessing or using aLiveHub ("the Platform"), you agree to be bound by these Terms
                            of Service. If you do not agree with any part of these terms, you may not use the Platform.
                            We reserve the right to update these terms at any time, and continued use of the Platform
                            after changes constitutes acceptance of the revised terms.
                        </p>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 2. Booking Policy */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                            Booking Policy
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <h3 className="font-semibold text-green-800 text-sm mb-1">✅ Slot Confirmation</h3>
                                <p className="text-green-700 text-sm">Slots are confirmed only after successful payment. A booking reference and confirmation email will be sent upon completion.</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <h3 className="font-semibold text-blue-800 text-sm mb-1">🔄 Cancellation Policy</h3>
                                <ul className="text-blue-700 text-sm space-y-1 mt-2">
                                    <li>• <strong>More than 24 hours before booking:</strong> Full refund</li>
                                    <li>• <strong>Less than 24 hours before booking:</strong> No refund</li>
                                    <li>• Refunds are processed within 5–7 business days to the original payment method</li>
                                </ul>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <h3 className="font-semibold text-red-800 text-sm mb-1">⚠️ No-Show Policy</h3>
                                <p className="text-red-700 text-sm">Failure to arrive at the booked turf within 15 minutes of your start time constitutes a no-show. No-show bookings are forfeited without refund.</p>
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 3. User Responsibilities */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                            User Responsibilities
                        </h2>
                        <p className="text-gray-600 text-sm mb-3">As a user of aLiveHub, you agree to:</p>
                        <ul className="space-y-2 text-gray-600 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Provide accurate and truthful information during registration and booking</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Arrive on time for your booked slot</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Respect turf property, equipment, and facilities</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Follow the rules and guidelines set by the turf owner</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Not engage in any illegal, abusive, or disruptive behavior at the turf</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Maintain the security of your account credentials</span>
                            </li>
                        </ul>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 4. Owner Responsibilities */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                            Turf Owner Responsibilities
                        </h2>
                        <p className="text-gray-600 text-sm mb-3">Turf owners listed on aLiveHub agree to:</p>
                        <ul className="space-y-2 text-gray-600 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Maintain accurate and up-to-date availability on the platform</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Honor all confirmed bookings and not cancel without valid reason</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Maintain safe and clean facilities for players</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Not make last-minute cancellations that inconvenience users</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>Provide accurate pricing, location, and amenity information</span>
                            </li>
                        </ul>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 5. Payment Terms */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                            Payment Terms
                        </h2>
                        <div className="text-gray-600 text-sm space-y-3">
                            <p>
                                All payments on aLiveHub are processed securely through <strong>Razorpay</strong>,
                                a PCI DSS Level 1 certified payment gateway. aLiveHub acts as a facilitator
                                connecting users with turf owners and does not directly handle or store payment
                                card information.
                            </p>
                            <p>
                                Prices displayed on the platform include the turf booking fee and a convenience
                                fee charged by aLiveHub. All amounts are in Indian Rupees (INR). Applicable taxes,
                                if any, are included in the final displayed amount.
                            </p>
                            <p>
                                By completing a payment, you authorize Razorpay to charge the specified amount.
                                Payment confirmation is sent via email immediately upon successful transaction.
                            </p>
                        </div>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 6. Limitation of Liability */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-red-100 text-red-700 rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                            Limitation of Liability
                        </h2>
                        <div className="text-gray-600 text-sm space-y-3">
                            <p>
                                aLiveHub provides the platform on an "as is" and "as available" basis. We make no
                                warranties, express or implied, regarding the availability, reliability, or accuracy
                                of the platform.
                            </p>
                            <p>
                                To the fullest extent permitted by law, aLiveHub shall not be liable for any
                                indirect, incidental, special, or consequential damages arising from your use of
                                the platform, including but not limited to injuries at turf facilities, disputes
                                with turf owners, or service interruptions.
                            </p>
                            <p>
                                aLiveHub's total liability for any claim shall not exceed the amount paid by you
                                for the specific booking in question.
                            </p>
                        </div>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 7. Governing Law */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                            Governing Law
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            These Terms of Service shall be governed by and construed in accordance with the laws
                            of the <strong>State of Maharashtra, India</strong>. Any disputes arising from or relating
                            to these terms shall be subject to the exclusive jurisdiction of the courts located
                            in Maharashtra, India.
                        </p>
                    </section>

                    <hr className="border-gray-200" />

                    {/* 8. Contact */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center text-sm font-bold">8</span>
                            Contact
                        </h2>
                        <p className="text-gray-600 text-sm mb-4">
                            For any questions regarding these Terms of Service, please contact us:
                        </p>
                        <div className="bg-gray-50 rounded-xl p-5">
                            <p className="text-gray-700 text-sm font-medium">aLiveHub Legal</p>
                            <p className="text-gray-600 text-sm mt-1">
                                Email:{' '}
                                <a href="mailto:legal@alivehub.in" className="text-green-600 hover:text-green-700 underline">
                                    legal@alivehub.in
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
