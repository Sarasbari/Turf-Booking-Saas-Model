import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { Home } from "./pages/Home/Home";
import { TurfListings } from "./pages/TurfListings/TurfListings";
import { SignIn } from "./pages/SignIn/SignIn";
import { AuthCallback } from "./pages/AuthCallback/AuthCallback";
import { Profile } from "./pages/Profile/Profile";
import { ProtectedRoute } from "./routes/ProtectedRoute";
// @ts-ignore - JSX file in TypeScript project
import TurfDetailPage from "./pages/TurfDetailPage";

// Owner Dashboard imports
import { OwnerProtectedRoute } from "./components/features/Owner/OwnerProtectedRoute";
import { OwnerLayout } from "./pages/Owner/OwnerLayout";
import { OwnerOverview } from "./pages/Owner/OwnerOverview";
import { OwnerBookings } from "./pages/Owner/OwnerBookings";
import { OwnerSlots } from "./pages/Owner/OwnerSlots";
import { OwnerTurf } from "./pages/Owner/OwnerTurf";
import { OwnerRevenue } from "./pages/Owner/OwnerRevenue";
import { OwnerReviews } from "./pages/Owner/OwnerReviews";
import { OwnerSettings } from "./pages/Owner/OwnerSettings";

export function App() {
    return (
        <>
            <BrowserRouter>
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
            </BrowserRouter>
            <SpeedInsights />
        </>
    );
}