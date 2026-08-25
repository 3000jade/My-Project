/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                "primary": "#266F71",
                "on-primary": "#ffffff",
                "accent": "#FB8E5D",
                "background": "#FFFFFF",
                "on-surface": "#174849",
                "surface-container-low": "#F5F4EF",
                "surface-container-high": "#E9E8E4",
                "tertiary": "#174849",
                "on-tertiary": "#ffffff",
                // Add the rest of your colors from a.html here
            },
            spacing: {
                "margin-desktop": "80px",
                "margin-mobile": "20px",
                "gutter": "32px",
                "section-gap": "120px",
                "container-max-width": "1440px"
            },
            fontFamily: {
                "headline-sm": ["Manrope"],
                "body-md": ["Manrope"],
                "label-lg": ["Inter"],
            }
        }
    }
}