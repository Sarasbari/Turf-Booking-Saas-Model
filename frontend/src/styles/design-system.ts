// BookMyShow-Inspired Design System
// Centralized design tokens for consistency

export const colors = {
    // Primary Brand Colors
    primary: '#ea580c',           // Orange (your brand color)
    primaryHover: '#dc2626',      // Darker orange for hover
    primaryLight: '#fb923c',      // Light orange for accents

    // Neutral Palette
    background: '#F5F5F5',        // Very light gray background
    cardBg: '#FFFFFF',            // Pure white for cards
    textPrimary: '#333333',       // Dark gray (not black)
    textSecondary: '#666666',     // Medium gray
    textTertiary: '#999999',      // Light gray
    border: '#E5E5E5',            // Subtle gray borders

    // Accent Colors
    success: '#5CB85C',           // Green for confirmed
    warning: '#F0AD4E',           // Amber for pending
    error: '#D9534F',             // Red for cancelled
    info: '#5BC0DE',              // Blue for information

    // Special Badges
    promoted: '#FF4081',          // Bright pink
    discount: '#4CAF50',          // Green
    new: '#2196F3',               // Blue

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    gradientOverlay: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
} as const;

export const typography = {
    // Font Family
    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    // Type Scale
    heroHeading: {
        fontSize: '48px',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
    },
    sectionHeading: {
        fontSize: '28px',
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: '-0.02em',
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: 600,
        lineHeight: 1.4,
    },
    bodyLarge: {
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: 1.5,
    },
    bodyRegular: {
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.5,
    },
    caption: {
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: 1.4,
    },
    small: {
        fontSize: '11px',
        fontWeight: 400,
        lineHeight: 1.3,
    },
} as const;

export const spacing = {
    // 8px grid system
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px',

    // Component-specific
    cardPadding: '16px',
    sectionMargin: '48px',
    containerPadding: '24px',
    containerPaddingMobile: '16px',
} as const;

export const borderRadius = {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    xxl: '18px',
    full: '9999px',
} as const;

export const shadows = {
    // Subtle shadows for BookMyShow style
    card: '0 2px 8px rgba(0, 0, 0, 0.08)',
    cardHover: '0 8px 24px rgba(0, 0, 0, 0.15)',
    header: '0 2px 8px rgba(0, 0, 0, 0.05)',
    modal: '0 8px 32px rgba(0, 0, 0, 0.2)',
    button: '0 2px 8px rgba(234, 88, 12, 0.25)',
    filter: '0 1px 4px rgba(0, 0, 0, 0.06)',
} as const;

export const animations = {
    // Easing curves
    easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Durations
    fast: '150ms',
    normal: '200ms',
    medium: '300ms',
    slow: '400ms',
    carousel: '600ms',

    // Hover transforms
    cardLift: 'translateY(-4px)',
    buttonScale: 'scale(1.02)',
    clickScale: 'scale(0.98)',
} as const;

export const breakpoints = {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    desktopLarge: '1400px',
} as const;

export const layout = {
    // Container max-widths
    maxWidth: '1400px',

    // Header
    headerHeight: '68px',
    headerHeightMobile: '60px',
    subNavHeight: '48px',

    // Hero
    heroHeight: '380px',
    heroHeightMobile: '240px',

    // Grid
    gridGap: '24px',
    gridColumns: {
        mobile: 1,
        mobileLarge: 2,
        tablet: 3,
        desktop: 4,
        desktopLarge: 5,
    },
} as const;

// Helper function to get responsive grid columns
export const getGridColumns = (screenWidth: number): number => {
    if (screenWidth >= 1400) return layout.gridColumns.desktopLarge;
    if (screenWidth >= 1024) return layout.gridColumns.desktop;
    if (screenWidth >= 768) return layout.gridColumns.tablet;
    if (screenWidth >= 640) return layout.gridColumns.mobileLarge;
    return layout.gridColumns.mobile;
};

// Export all as default for convenience
export default {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animations,
    breakpoints,
    layout,
    getGridColumns,
};
