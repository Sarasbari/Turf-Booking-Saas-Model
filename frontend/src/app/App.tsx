import { BrowserRouter } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Providers } from "./providers";
import { AppRouter } from "./AppRouter";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { HelpButton } from "@/components/ui/HelpButton";

export function App() {
    return (
        <Providers>
            <BrowserRouter>
                <AppRouter />
                <CookieConsent />
                <HelpButton />
            </BrowserRouter>
            <SpeedInsights />
        </Providers>
    );
}
