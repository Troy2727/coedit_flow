import type { Config } from 'tailwindcss';

const { fontFamily } = require('tailwindcss/defaultTheme');

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px',
  			xs: '360px'
  		}
  	},
  	extend: {
  		colors: {
  			blue: {
  				'100': '#B4C6EE',
  				'400': '#417BFF',
  				'500': '#3371FF'
  			},
  			red: {
  				'400': '#DD4F56',
  				'500': '#DC4349'
  			},
  			dark: {
  				'100': '#09111F',
  				'200': '#0B1527',
  				'300': '#0F1C34',
  				'350': '#12213B',
  				'400': '#27344D',
  				'500': '#2E3D5B'
  			},
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			skeleton: 'var(--skeleton)',
  			border: 'var(--btn-border)',
  			input: 'var(--input)'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-sans)',
                    ...fontFamily.sans
                ]
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			ripple: {
  				'0%, 100%': {
  					transform: 'translate(-50%, -50%) scale(1)'
  				},
  				'50%': {
  					transform: 'translate(-50%, -50%) scale(0.9)'
  				}
  			},
  			wave: {
  				'0%': {
  					transform: 'translateY(0px) scale(1) rotate(0deg)'
  				},
  				'10%': {
  					transform: 'translateY(-2px) scale(1.05) rotate(2deg)'
  				},
  				'20%': {
  					transform: 'translateY(-4px) scale(1.1) rotate(0deg)'
  				},
  				'30%': {
  					transform: 'translateY(-2px) scale(1.05) rotate(-2deg)'
  				},
  				'40%': {
  					transform: 'translateY(0px) scale(1) rotate(0deg)'
  				},
  				'50%': {
  					transform: 'translateY(2px) scale(0.95) rotate(2deg)'
  				},
  				'60%': {
  					transform: 'translateY(4px) scale(0.9) rotate(0deg)'
  				},
  				'70%': {
  					transform: 'translateY(2px) scale(0.95) rotate(-2deg)'
  				},
  				'80%': {
  					transform: 'translateY(0px) scale(1) rotate(0deg)'
  				},
  				'90%': {
  					transform: 'translateY(-2px) scale(1.05) rotate(2deg)'
  				},
  				'100%': {
  					transform: 'translateY(0px) scale(1) rotate(0deg)'
  				}
  			},
  			orbit: {
  				'0%': {
  					transform: 'rotate(0deg) translateY(calc(var(--radius) * 1px)) rotate(0deg)'
  				},
  				'25%': {
  					transform: 'rotate(90deg) translateY(calc(var(--radius) * 1px)) rotate(-90deg)'
  				},
  				'50%': {
  					transform: 'rotate(180deg) translateY(calc(var(--radius) * 1px)) rotate(-180deg)'
  				},
  				'75%': {
  					transform: 'rotate(270deg) translateY(calc(var(--radius) * 1px)) rotate(-270deg)'
  				},
  				'100%': {
  					transform: 'rotate(360deg) translateY(calc(var(--radius) * 1px)) rotate(-360deg)'
  				}
  			}
  		},
  		backgroundImage: {
  			doc: 'url(/assets/images/doc.png)',
  			modal: 'url(/assets/images/modal.png)'
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			ripple: 'ripple 2s ease calc(var(--i, 0) * 0.2s) infinite',
  			wave: 'wave 2s ease-in-out infinite',
  			orbit: 'orbit calc(var(--duration) * 1s) linear infinite'
  		},
  		borderRadius: {
  			DEFAULT: '0.5rem'
  		},
  		boxShadow: {
  			input: '0px 2px 3px -1px rgba(0, 0, 0, 0.1), 0px 1px 0px 0px rgba(25, 28, 33, 0.02), 0px 0px 0px 1px rgba(25, 28, 33, 0.08)'
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;