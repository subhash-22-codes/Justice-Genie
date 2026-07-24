// tailwind.config.js
//
// Design system v2 (user-facing "premium" pass - chat, myaccount, auth, landing,
// quiz, lawpdf, resources; admin pages intentionally excluded, still on v1):
// - Fonts: Manrope for body text, Poppins for headings
// - Colors: Tailwind's built-in `slate` palette + blue-600 as the single accent
// - Radius: rounded-lg on cards/modals/containers, rounded-md on buttons/inputs,
//   rounded-full ONLY for avatars/status pills (functional, not decorative).
//   Deliberately moderate, not sharp (cold) or bubbly (playful) - a legal
//   product should read as structured and credible.
// - Depth: soft layered shadows (shadow-sm resting -> shadow-md/lg on hover).
//   No gradients, no glow, ever.
// - Motion: restrained visuals, alive interactions - scroll-reveal on major
//   sections (see `revealUp` below), hover-lift + tap-scale on every
//   clickable element, real page transitions via framer-motion (already
//   wired in App.js).
//
// The other registered fonts below (montserrat, sora, urbanist, spacegrotesk,
// courgette, jura) are still used in untouched (admin/v1) components - don't
// remove them until those are migrated too, or their text will fall back to
// the browser default font.
module.exports = {
  darkMode: 'class', // toggled via a `dark` class on <html> - see chat.jsx's dark mode effect
  corePlugins: {
    preflight: false, // Disabled to avoid clashing with legacy CSS files in styles/.
                       // Do NOT flip this on without testing every component that
                       // still imports a styles/*.css file - it WILL change their layout.
  },
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Ensure this includes all the relevant files
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        sora: ['Sora', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        urbanist: ['Urbanist', 'sans-serif'],
        spacegrotesk: ['Space Grotesk', 'sans-serif'],
        courgette: ['Courgette', 'cursive'],
        jura : ['Jura', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        revealUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        // Was previously only working because admin.css happened to be
        // loaded globally (CSS isn't scoped per-component in this project).
        // Now it's a real Tailwind utility - `animate-fadeIn` works anywhere,
        // reliably, regardless of which components still have CSS files.
        fadeIn: 'fadeIn 0.4s ease-out',
        // v2 motion tokens: scroll reveals + modal/popover entrances.
        revealUp: 'revealUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        scaleIn: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      boxShadow: {
        // Soft, layered, but actually visible - use `card` at rest, `card-hover` on interaction.
        card: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.10)',
        'card-hover': '0 8px 20px rgba(15, 23, 42, 0.12), 0 3px 6px rgba(15, 23, 42, 0.08)',
        elevated: '0 16px 40px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.10)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)', // smooth "settle" easing for hover/tap/reveal
      },
    },
  },
  
  plugins: [],
};
