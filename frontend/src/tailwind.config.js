/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                "primary": "#0D4446",
                "primary-hover": "#083335",
                "on-primary": "#ffffff",
                "primary-container": "#185E60",
                "on-primary-container": "#D2F2F3",
                "secondary": "#2A5B5D",
                "on-secondary": "#ffffff",
                "secondary-container": "#CBE8E9",
                "accent": "#E76F51",
                "accent-hover": "#D65C3E",
                "accent-container": "#FDF0EC",
                "on-accent": "#ffffff",
                "background": "#FBFBFA",
                "on-background": "#141717",
                "surface": "#FBFBFA",
                "on-surface": "#141717",
                "surface-variant": "#EBEEED",
                "on-surface-variant": "#434E4F",
                "surface-container-lowest": "#FFFFFF",
                "surface-container-low": "#F4F5F4",
                "surface-container": "#EBEEED",
                "surface-container-high": "#DFE4E3",
                "tertiary": "#0A2829",
                "on-tertiary": "#ffffff",
                "tertiary-container": "#185E60",
                "on-tertiary-container": "#D2F2F3",
                "outline": "#6B7B7C",
                "outline-variant": "#D0D9D9",
                "coral": "#E76F51",
                "on-coral": "#ffffff",
            },
            spacing: {
                "margin-desktop": "80px",
                "margin-mobile": "20px",
                "gutter": "32px",
                "section-gap": "120px",
                "container-max-width": "1440px"
            },
            fontFamily: {
                "sans": ["Manrope", "Inter", "sans-serif"],
                "display": ["Manrope", "sans-serif"],
                "headline-sm": ["Manrope", "sans-serif"],
                "body-md": ["Manrope", "sans-serif"],
                "label-lg": ["Inter", "sans-serif"],
                "mono": ["JetBrains Mono", "monospace"],
            }
        }
    }
}