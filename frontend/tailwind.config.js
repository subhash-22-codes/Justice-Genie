// tailwind.config.js
//
// Design system going forward (chat.jsx, myaccount.jsx rebuild, and any new work):
// - Fonts: Manrope for body text, Poppins for headings
// - Colors: Tailwind's built-in `slate` palette (already the dominant choice
//   across existing Tailwind-styled components - stick with it, don't add gray too)
// - Radius: rounded-sm everywhere (not lg/xl/2xl/full mixed like older components)
// - No neon gradients or glow effects
//
// The other registered fonts below (montserrat, sora, urbanist, spacegrotesk,
// courgette, jura) are still used in untouched components - don't remove them
// until those components are migrated too, or their text will fall back to
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
      },
      animation: {
        // Was previously only working because admin.css happened to be
        // loaded globally (CSS isn't scoped per-component in this project).
        // Now it's a real Tailwind utility - `animate-fadeIn` works anywhere,
        // reliably, regardless of which components still have CSS files.
        fadeIn: 'fadeIn 0.4s ease-out',
      },
    },
  },
  
  plugins: [],
};
