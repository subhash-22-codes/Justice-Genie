// tailwind.config.js
module.exports = {
  corePlugins: {
    preflight: false, // Disable preflight globally
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
        dmsans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  
  plugins: [],
};
