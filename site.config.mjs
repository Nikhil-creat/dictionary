// Single source of truth for site-wide facts. Edit here, rebuild, done.
// The public URL comes from the SITE_URL env var (set it in Vercel once your custom domain is live).
export const site = {
  name: 'Dictionary',
  tagline: 'Words, names & meanings in every language',
  description:
    'Dictionary is an intelligent multi-modal dictionary: definitions, etymology, name meanings in many scripts, grounded AI answers and on-device OCR.',
  fallbackUrl: 'https://dictionary.vercel.app', // used only when SITE_URL / Vercel's production URL are not set
  themeColor: '#04050d',
  author: {
    name: 'Nikhil Chary Sriramoju',
    role: 'Aspiring Software Engineer · Data & AI',
    github: 'https://github.com/Nikhil-creat',
    linkedin: 'https://in.linkedin.com/in/nikhil-chary-sriramoju-95041b38a',
    email: 'sriramojunikhil66@gmail.com',
  },
  repo: 'https://github.com/Nikhil-creat/dictionary',
  // Local business structured data. Set enabled:false to drop it from every page.
  business: {
    enabled: true,
    type: 'ProfessionalService',
    name: 'Dictionary — Nikhil Chary Sriramoju',
    description:
      'Software studio building AI, data-analytics and web applications, based in Warangal, Telangana, India.',
    address: { locality: 'Warangal', region: 'Telangana', country: 'IN' },
    areaServed: ['Warangal', 'Telangana', 'India'],
  },
};
