import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";   // ✅ ADD THIS
import { Home } from "./pages/Home/Home";
import { TurfListings } from "./pages/TurfListings/TurfListings";
import { SignIn } from "./pages/SignIn/SignIn";
import { AuthCallback } from "./pages/AuthCallback/AuthCallback";
import { Profile } from "./pages/Profile/Profile";
// @ts-ignore - JSX file in TypeScript project
import TurfDetailPage from "./pages/TurfDetailPage";

export function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<TurfListings />} />
          <Route path="/turf/:turfId" element={<TurfDetailPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
      <SpeedInsights />                                          {/* ✅ ADD THIS */}                                             {/* ✅ ADD THIS */}
    </>
  );
}