// The profile's copy: the same agreed content as jesniemagaling.me (design/CONTENT_DRAFTS.md there).
export const SITE = 'https://www.jesniemagaling.me';

export const HERO = {
  labels: ['Full-stack developer', 'Metro Manila'],
  headline: 'I turn scattered data and manual work into',
  italic: 'software people can rely on.',
  sub: 'Ordering systems, transaction platforms and internal tools, built end to end and kept running in production.',
};

// Screenshot paths are relative to the owner's Documents folder; they are only read
// when the static images are rebuilt on that machine.
export const CASE_STUDIES = [
  {
    slug: 'aegisops', name: 'AegisOps', labels: ['Personal project', 'Mar–Apr 2026'],
    tagline: 'Ingestion, reconciliation and audit trails for transaction workflows, in one platform.',
    role: 'Solo: design, backend, frontend and infrastructure',
    stack: ['Java', 'Spring Boot', 'Next.js', 'PostgreSQL', 'Redis', 'Docker'],
    bar: 'AegisOps', desktop: 'AegisOps/docs/images/dashboard.png', phone: 'AegisOps/docs/images/dashboard-mobile.png',
  },
  {
    slug: 'orderq', name: 'ORDERQ', labels: ['Capstone · team of 4', 'Aug–Dec 2025', { text: 'Live', color: 'success' }],
    tagline: 'Scan the table, order, pay and track, with no app to install.',
    role: 'All-around developer: front end, back end, database and testing',
    stack: ['React', 'TypeScript', 'Node.js', 'Express.js', 'MySQL', 'Docker'],
    bar: 'orderq.onrender.com', desktop: 'orderq/docs/images/admin/1-overview.png', phone: 'orderq/docs/images/customer-app/home.jpg',
  },
];

export const MORE_WORK = [
  { slug: 'studymate-ai', name: 'StudyMate AI', tagline: 'Turns PDFs into reviewers, quizzes and flashcards.', stack: 'Next.js · TypeScript · MongoDB', bar: 'StudyMate AI', desktop: 'StudyMate/home-1.png', phone: 'StudyMate/upload-mobile.png' },
  { slug: 'ecommerce', name: 'QVEE.CO', tagline: 'A responsive storefront front end.', stack: 'HTML · Tailwind CSS · Vite', bar: 'QVEE.CO', desktop: 'qveeco/home.png', phone: 'qveeco/home-mobile.png' },
  { slug: 'chat-app', name: 'ELECAR', tagline: 'A responsive landing page in HTML and CSS.', stack: 'HTML · CSS', bar: 'ELECAR', desktop: 'elecar/home.png', phone: 'elecar/home-mobile.png' },
];

/** The 25 core technologies in six layers, with Devicon logo keys (data/logos.json). */
export const STACK = [
  ['Languages', [['TypeScript', 'typescript'], ['JavaScript', 'javascript'], ['Java', 'java'], ['Python', 'python']]],
  ['Front end', [['React', 'react'], ['Next.js', 'nextjs'], ['Tailwind CSS', 'tailwindcss']]],
  ['Back end and APIs', [['Node.js', 'nodejs'], ['NestJS', 'nestjs'], ['Express.js', 'express'], ['Spring Boot', 'spring'], ['FastAPI', 'fastapi'], ['GraphQL', 'graphql'], ['Socket.io', 'socketio']]],
  ['Data', [['PostgreSQL', 'postgresql'], ['MySQL', 'mysql'], ['MongoDB', 'mongodb'], ['Redis', 'redis']]],
  ['Cloud and DevOps', [['AWS', 'amazonwebservices'], ['Cloudflare', 'cloudflare'], ['Docker', 'docker'], ['GitHub Actions', 'githubactions'], ['Vercel', 'vercel']]],
  ['Monitoring', [['Prometheus', 'prometheus'], ['Grafana', 'grafana']]],
];
