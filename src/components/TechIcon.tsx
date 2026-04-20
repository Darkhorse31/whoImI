import type { IconType } from "react-icons";
import {
  SiTypescript, SiJavascript, SiHtml5, SiCss,
  SiAngular, SiReact, SiNextdotjs, SiReactivex,
  SiRedux, SiNodedotjs, SiNestjs, SiExpress,
  SiGraphql, SiSocketdotio, SiJsonwebtokens,
  SiRedis, SiPostgresql, SiMongodb, SiElasticsearch,
  SiGooglecloud, SiCloudinary, SiDocker,
  SiGithubactions, SiHeroku, SiDatadog,
  SiOpenai, SiOkta, SiFacebook,
  SiInstagram, SiX, SiGoogle, SiJest, SiPostman,
  SiJira, SiGithub, SiAnthropic, SiPrisma,
} from "react-icons/si";
import { FaDatabase, FaCode, FaCloud, FaBrain, FaTools, FaLinkedin, FaAws } from "react-icons/fa";
import { BsCodeSquare } from "react-icons/bs";

const iconMap: Record<string, IconType> = {
  // Languages
  typescript: SiTypescript,
  javascript: SiJavascript,
  sql: FaDatabase,
  html5: SiHtml5,
  css3: SiCss,
  // Frontend
  angular: SiAngular,
  react: SiReact,
  "react.js": SiReact,
  "next.js": SiNextdotjs,
  rxjs: SiReactivex,
  ngrx: SiRedux,
  shadcn: BsCodeSquare,
  primeng: SiAngular,
  // Backend
  "node.js": SiNodedotjs,
  nestjs: SiNestjs,
  express: SiExpress,
  graphql: SiGraphql,
  websockets: SiSocketdotio,
  rest: FaCloud,
  "jwt/oauth2": SiJsonwebtokens,
  "ai integration": FaBrain,
  // Data & Storage
  redis: SiRedis,
  postgresql: SiPostgresql,
  mongodb: SiMongodb,
  elasticsearch: SiElasticsearch,
  // Cloud / DevOps
  gcp: SiGooglecloud,
  "aws s3": FaAws,
  cloudinary: SiCloudinary,
  docker: SiDocker,
  "github actions": SiGithubactions,
  heroku: SiHeroku,
  // Observability
  datadog: SiDatadog,
  "structured logs": FaTools,
  apm: FaTools,
  // AI / LLM
  openai: SiOpenai,
  gemini: SiGoogle,
  imagen: SiGoogle,
  "claude code": SiAnthropic,
  copilot: SiGithub,
  // Integrations
  okta: SiOkta,
  cyberark: FaCode,
  "linkedin api": FaLinkedin,
  facebook: SiFacebook,
  instagram: SiInstagram,
  "twitter / x": SiX,
  "google oauth": SiGoogle,
  // Tooling
  jest: SiJest,
  postman: SiPostman,
  jira: SiJira,
  clickup: FaTools,
  github: SiGithub,
  "code reviews": BsCodeSquare,
  // Strapi CMS
  "strapi cms": FaDatabase,
  cdn: FaCloud,
  prisma: SiPrisma,
};

interface TechIconProps {
  name: string;
  className?: string;
}

export default function TechIcon({ name, className = "" }: TechIconProps) {
  const Icon = iconMap[name.toLowerCase()];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}
