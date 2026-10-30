/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                "primary": "#0F766E",
                "primary-hover": "#115E59",
                "on-primary": "#ffffff",
                "primary-container": "#134E4A",
                "on-primary-container": "#CCFBF1",
                "secondary": "#FF6B6B",
                "on-secondary": "#ffffff",
                "secondary-container": "#FEE2E2",
                "accent": "#FF6B6B",
                "accent-hover": "#EE5A5A",
                "accent-container": "#FEE2E2",
                "on-accent": "#1E293B",
                "background": "#F8FAFC",
                "foreground": "#1E293B",
                "on-background": "#1E293B",
                "surface": "#FFFFFF",
                "on-surface": "#1E293B",
                "surface-variant": "#F1F5F9",
                "on-surface-variant": "#64748B",
                "surface-container-lowest": "#FFFFFF",
                "surface-container-low": "#FFFFFF",
                "surface-container": "#F8FAFC",
                "surface-container-high": "#F1F5F9",
                "tertiary": "#0F766E",
                "on-tertiary": "#ffffff",
                "tertiary-container": "#CCFBF1",
                "on-tertiary-container": "#115E59",
                "outline": "#E2E8F0",
                "outline-variant": "#CBD5E1",
                "coral": "#FF6B6B",
                "on-coral": "#1E293B",
                "teal": "#0F766E",
                "on-teal": "#ffffff",
            },
            spacing: {
                "margin-desktop": "80px",
                "margin-mobile": "20px",
                "gutter": "32px",
                "section-gap": "120px",
                "container-max-width": "1440px"
            },
            fontFamily: {
                "sans": ["Inter", "Manrope", "sans-serif"],
                "display": ["Inter", "Manrope", "sans-serif"],
                "headline-sm": ["Inter", "Manrope", "sans-serif"],
                "body-md": ["Inter", "Manrope", "sans-serif"],
                "label-lg": ["Inter", "sans-serif"],
                "mono": ["JetBrains Mono", "monospace"],
            }
        }
    }
}
