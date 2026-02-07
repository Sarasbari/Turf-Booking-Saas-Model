import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home/Home";
import { TurfListings } from "./pages/TurfListings/TurfListings";
import { SignIn } from "./pages/SignIn/SignIn";
import { AuthCallback } from "./pages/AuthCallback/AuthCallback";
import { Profile } from "./pages/Profile/Profile";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<TurfListings />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
