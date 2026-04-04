import { Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { Home } from "@/pages/public/Home/Home";
import { TurfListings } from "@/pages/public/TurfListings/TurfListings";
import { SignIn } from "@/pages/public/Auth/SignIn/SignIn";
import { AuthCallback } from "@/pages/public/Auth/AuthCallback/AuthCallback";
import { Profile } from "@/pages/user/Profile/Profile";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
// @ts-ignore - JSX file in TypeScript project
import TurfDetailPage from "@/pages/public/TurfDetail/TurfDetailPage";

// Owner Dashboard imports
import { OwnerProtectedRoute } from "@/components/features/Owner/OwnerProtectedRoute";
import { OwnerLayout } from "@/pages/owner/OwnerLayout";
import { OwnerOverview } from "@/pages/owner/OwnerOverview";
import { OwnerBookings } from "@/pages/owner/OwnerBookings";
import { OwnerSlots } from "@/pages/owner/OwnerSlots";
import { OwnerTurf } from "@/pages/owner/OwnerTurf";
import { OwnerRevenue } from "@/pages/owner/OwnerRevenue";
import { OwnerReviews } from "@/pages/owner/OwnerReviews";
import { OwnerSettings } from "@/pages/owner/OwnerSettings";

export function AppRouter() {
    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/listings" element={<TurfListings />} />
                <Route path="/turf/:turfId" element={<TurfDetailPage />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {/* Owner Dashboard Routes */}
                <Route path="/owner" element={<OwnerProtectedRoute />}>
                    <Route element={<OwnerLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<OwnerOverview />} />
                        <Route path="bookings" element={<OwnerBookings />} />
                        <Route path="slots" element={<OwnerSlots />} />
                        <Route path="turf" element={<OwnerTurf />} />
                        <Route path="revenue" element={<OwnerRevenue />} />
                        <Route path="reviews" element={<OwnerReviews />} />
                        <Route path="settings" element={<OwnerSettings />} />
                    </Route>
                </Route>
            </Routes>
        </>
    );
}
