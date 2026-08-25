# UI Effects & Interaction Conditions

When building or modifying UI components in this project, adhere strictly to the following design rules, scrolling behaviors, and modal effects:

1. **Sticky Header & Search Interaction:**
   - The main Header hides automatically when scrolling down past the 3D Hero section, allowing the Advanced Search Box to take its place.
   - The Advanced Search Box snaps to the top (`sticky`) precisely when it touches the 80px offset of the Header.
   - When the Search Box becomes sticky, it transitions visually: it loses its rounded corners (`border-radius: 0`) and dynamically widens to fill the screen edge-to-edge.

2. **Precision Scroll Tracking (Sentinel Logic):**
   - The Header reappear/hide logic should NOT be hardcoded to a fixed pixel amount. Instead, use `getBoundingClientRect` on a hidden sentinel element. This calculates exactly when components touch for frame-perfect transitions across all screen sizes.

3. **Manual Header Override:**
   - A fixed circular button in the top-right allows the user to manually summon the Header while deep in the page.
   - Clicking this button pushes the sticky Search Box down perfectly by exactly 80px.
   - If the user scrolls more than 50px away from the point they clicked, the system recognizes their intent to keep scrolling and auto-hides the Header again.

4. **Slippery Scroll (Momentum):**
   - Global smooth momentum scrolling is implemented across the entire application using the `lenis/react` library.

5. **Premium Modal Interactions:**
   - **Backdrop:** Modals use a heavy backdrop blur (`bg-black/80 backdrop-blur-md`) rather than a simple opaque color.
   - **Entrance Physics:** Modals enter using Framer Motion spring physics (`type: spring`, `damping: 25`, `stiffness: 200`). They scale up slightly (`scale: 0.9` -> `1`) and slide in dynamically from the bottom (`y: 100` -> `0`).
   - **Lenis Modal Fix:** Any elements inside the Lenis-controlled application that have their own scrollbars (like an `overflow-y-auto` modal sidebar) MUST have the `data-lenis-prevent="true"` attribute attached to them. This stops the Lenis engine from hijacking the internal native scroll.

6. **Consistent UI Sizing:**
   - All inputs, dropdowns, buttons, and filters inside search components MUST maintain a mathematically precise, uniform height (`h-[54px]`) to ensure a flush, premium alignment.

7. **Close Buttons (X):**
   - Close buttons floating over images must be small but highly visible. The standard is a `w-9 h-9` solid white circle (`bg-white`) with a heavy drop shadow and a dark icon (`text-[20px]`).
