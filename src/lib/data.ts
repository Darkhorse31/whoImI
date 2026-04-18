export const personalData = {
  name: "Prateek Kumar",
  title: "Full Stack Developer",
  role: "SDE-2",
  experience: "4 Years",
  tagline: "Building things that scale",
  location: "Lucknow, India",
  phone: "",
  email: "prateek.devfullstack@gmail.com",
  linkedin: "linkedin.com/in/prateek-kumar-484461204",
  github: "https://github.com/Darkhorse31",
  openToOpportunities: true,
  profile:
    "Full-stack SDE-2 with 4 years across chat, social media, marketplace, fintech, and media platforms. I build with Angular, React, Node.js, Redis, GCP, and Elasticsearch — on the parts that connect UI to infrastructure. Shipped real-time messaging at 8–10K concurrent connections, built social data pipelines, slashed API P95 latency from 520ms → 320ms, and mentored 8 engineers.",
  education: {
    degree: "BCA — Completed",
    institution: "IGNOU, New Delhi",
  },
  stats: [
    { value: "25%", label: "Faster feature delivery" },
    { value: "40%", label: "Less manual coordination" },
    { value: "10K", label: "Concurrent WS connections" },
    { value: "61%", label: "MTTR reduction (90→35 min)" },
  ],
};

export const skills = {
  languages: ["TypeScript", "JavaScript", "SQL", "HTML5", "CSS3"],
  frontend: ["Angular", "React", "Next.js", "RxJS", "NgRx", "Shadcn", "PrimeNG"],
  backend: ["Node.js", "NestJS", "Express", "GraphQL", "WebSockets", "REST", "JWT/OAuth2"],
  dataStorage: ["Redis", "PostgreSQL", "MongoDB", "Elasticsearch"],
  cloudDevops: ["GCP", "AWS S3", "Cloudinary", "Docker", "GitHub Actions", "Heroku"],
  observability: ["Datadog", "Structured Logs", "APM"],
  aiLlm: ["OpenAI", "Gemini", "Imagen", "Claude Code", "Copilot"],
  integrations: ["Okta", "CyberArk", "LinkedIn API", "Facebook", "Instagram", "Twitter / X", "Google OAuth"],
  tooling: ["Jest", "Postman", "Jira", "ClickUp", "GitHub", "Code Reviews"],
};

export const experience = [
  {
    company: "CodeMaya",
    period: "Jun 2022 — Present",
    role: "Tech Lead / Software Development Engineer (SDE-2)",
    location: "Lucknow, India",
    highlights: [
      "Designed modular full-stack features across Angular & React; shared component libraries cut delivery time by 25%.",
      "Tuned RESTful & real-time APIs in Node.js / NestJS / Express; P95 latency dropped 520ms → 320ms via Redis caching, query optimization, and response shaping.",
      "Built real-time chat over WebSockets + Redis Pub/Sub, stable at 8K–10K concurrent connections with sub-second delivery.",
      "Wired up AWS S3 + Cloudinary media pipeline — resizing, CDN delivery — media-heavy page load dropped 30%.",
      "Shipped AI-driven presales automation (CRM triggers) cutting manual coordination by 40%.",
      "Built Elasticsearch indexing pipeline — average query time under 300ms.",
      "Operated services on GCP (Cloud Run / App Engine) with Datadog; MTTR went from 90 → 35 minutes.",
      "Mentored 8 junior developers via code reviews, performance profiling, and architecture coaching.",
    ],
  },
];

export const projects = [
  {
    title: "Provarity Cloud",
    description: "AI-Powered POC Management Platform",
    tech: ["Angular", "Node.js", "GCP", "Redis", "AI Integration"],
    highlights: [
      "Built presales automation with CRM triggers; manual follow-up cycle reduced by 40%.",
      "Modular Angular feature loader + state isolation — improved maintainability, reduced regressions.",
      "Redis caching on high-frequency endpoints — P95 latency 450ms → 280ms.",
    ],
    link: "#",
    color: "from-blue-500 to-purple-600",
  },
  {
    title: "Moodi Day",
    description: "Cannabis Review Community",
    tech: ["React.js", "Strapi CMS", "AWS S3", "Cloudinary", "CDN"],
    highlights: [
      "Media upload & processing pipeline (signed URLs + Cloudinary transforms) scaling to 1K+ weekly reviews.",
      "Client-side pagination + incremental API fetching improved perceived load performance by 25%.",
    ],
    link: "#",
    color: "from-green-500 to-teal-600",
  },
  {
    title: "Tradeline Supply",
    description: "Peer-to-Peer Tradeline Marketplace",
    tech: ["Vue.js", "NestJS", "PostgreSQL", "Redis"],
    highlights: [
      "Secure transaction + escrow workflows (idempotent APIs + audit logs) — 99.9% uptime.",
      "DB index + caching optimization reduced transaction history query time by 40%.",
    ],
    link: "#",
    color: "from-orange-500 to-red-600",
  },
  {
    title: "The AI Poster",
    description: "AI-Powered Poster Generation Platform",
    tech: ["Next.js", "Node.js", "Redis", "bullMQ", "WebSocket", "MongoDB"],
    highlights: [
      "End-to-end web application generating custom posters via AI image models (Imagen/Gemini).",
    ],
    links: { web: "#", app: "#" },
    color: "from-purple-500 to-pink-600",
  },
];
