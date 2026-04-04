import { BrowserRouter } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Providers } from "./providers";
import { AppRouter } from "./AppRouter";

export function App() {
    return (
        <Providers>
            <BrowserRouter>
                <AppRouter />
            </BrowserRouter>
            <SpeedInsights />
        </Providers>
    );
}
