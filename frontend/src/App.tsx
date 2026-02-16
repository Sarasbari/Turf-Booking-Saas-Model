import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ScrollToTop } from "./components/ScrollToTop";
import { Home } from "./pages/Home/Home";
import { TurfListings } from "./pages/TurfListings/TurfListings";
import { SignIn } from "./pages/SignIn/SignIn";
import { AuthCallback } from "./pages/AuthCallback/AuthCallback";
import { Profile } from "./pages/Profile/Profile";
// @ts-ignore - JSX file in TypeScript project
import TurfDetailPage from "./pages/TurfDetailPage";

// ✅ Placeholder until you build the real dashboard
function OwnerDashboard() {
    return (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h1>🏟️ Owner Dashboard</h1>
            <p>Coming soon — manage your turfs here</p>
        </div>
    );
}

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
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/owner/dashboard" element={<OwnerDashboard />} />  {/* ✅ ADD */}
                </Routes>
            </BrowserRouter>
            <SpeedInsights />
        </>
    );
}