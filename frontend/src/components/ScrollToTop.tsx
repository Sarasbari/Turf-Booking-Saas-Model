import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Pages that should REMEMBER scroll position
const PRESERVE_SCROLL_PATHS = ['/listings'];

export function ScrollToTop() {
    const { pathname } = useLocation();
    const scrollPositions = useRef<Record<string, number>>({});
    const prevPath = useRef(pathname);

    useEffect(() => {
        // Save scroll position of the page we're LEAVING
        scrollPositions.current[prevPath.current] = window.scrollY;

        // Check if the page we're ENTERING should restore scroll
        if (PRESERVE_SCROLL_PATHS.includes(pathname)) {
            const saved = scrollPositions.current[pathname];
            if (saved !== undefined) {
                // Small delay to let the page render first
                setTimeout(() => window.scrollTo(0, saved), 0);
            }
        } else {
            // All other pages → scroll to top
            window.scrollTo(0, 0);
        }

        prevPath.current = pathname;
    }, [pathname]);

    return null;
}