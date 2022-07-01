module.exports = {
  content: ['./src/**/*.{svelte,js,ts}'],
  daisyui: {
    themes: [{
      privian: {
        'primary': '#1d4ed8',
        'secondary': '#9333ea',
        'accent': '#db2777',
        'neutral': '#e5e7eb',
        'base-100': '#FFFFFF',
        'info': '#3ABFF8',
        'success': '#047857',
        'warning': '#fbbf24',
        'error': '#e11d48',
      },
    }, ],
  },
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
    require('daisyui'),
  ],
}