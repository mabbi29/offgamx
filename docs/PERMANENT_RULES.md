# OffGamX — Permanent Game Engineering Rules

These rules apply to EVERY game built for OffGamX, with zero exceptions.

1. **WORKING CONTROLS**
   - Keyboard: Arrow keys, WASD, Space, Enter, Escape, P (as appropriate per genre).
   - Touch: Fully responsive on-screen mobile d-pad / action buttons for mobile devices.
   - Event listeners bound to `window` (not scoped strictly to canvas so focus is never lost).
   - `e.preventDefault()` called only on active game keys to prevent page scrolling during play.
   - Clean up all event listeners and animation frames on component unmount.

2. **FULL-FRAME LAYOUT**
   - Canvas dynamically scales to fill 100% of game player container, edge-to-edge.
   - ResizeObserver used to monitor container dimensions and update canvas resolution smoothly.
   - Zero fixed pixel sizes; no miniature centered boxes with dead space margins.
   - 16-24px padding maximum around controls.

3. **BRIGHT VISUALS**
   - No pure black screens. Every game features colorful, layered, vibrant palettes.
   - Sky / background + midground + foreground layers with rich particle effects and lighting.
   - Ambient light + directional light in 3D scenes.
   - Crisp, high-DPI canvas rendering (`window.devicePixelRatio`).

4. **LEVELS & PERSISTENT PROGRESSION**
   - 20+ levels per game (up to 40-50 levels for expansive campaigns).
   - Saved automatically to localStorage with key `offgamx-<slug>-level`.
   - Clear HUD indicator displaying "LEVEL X / N".
   - Winning unlocks the next level. Defeat allows instant 1-tap retry of the current level.

5. **HD THUMBNAIL & ZERO-BROKEN-IMAGE POLICY**
   - 16:9 high-definition thumbnail artwork with vivid in-game scene representations.
   - Styled CSS/SVG high-resolution fallbacks for resilient offline and instant loading.
   - Overlays: Category chip, rating (★ 4.9), PLAY NOW affordance, OffGamX branding.
   - No dark/dull imagery.

6. **VERIFIED IN RUNTIME**
   - Every game tested for responsive controls, level transitions, sound synthesizer, and clean loop.

7. **NO "WATCH VIDEO" GATES**
   - Pure instant-play browser gaming without ad video locks or paywalls.

8. **REAL HOW-TO-PLAY & REVIEWS**
   - Real, authentic mechanics and controls explanations for each title.
   - Interactive user ratings and reviews stored locally.

9. **IN-PLACE RELATED GAMES**
   - Below every game player, 6-8 related titles allow 1-click in-place game switching.

10. **FULL-WIDTH PORTAL ARCHITECTURE**
    - High information density, premium white/slate aesthetic with cyan-blue gradient accents.
    - Zero pill clutter on metadata; clean typography and smooth transitions.
