import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Reset browser scroll position
        window.scrollTo(0, 0);

        // Also handle Lenis if it's active
        // We can use a custom event or directly try to find the lenis instance
        // but window.scrollTo usually works if Lenis is correctly configured to sync.
    }, [pathname]);

    return null;
}
