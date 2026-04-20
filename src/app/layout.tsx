import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilmGrainWrapper from "@/components/FilmGrainWrapper";
import InteractiveModelWrapper from "@/components/InteractiveModelWrapper";
import WaveGlobeWrapper from "@/components/WaveGlobeWrapper";
import { DayNightProvider } from "@/context/DayNightContext";
import DayNightEnvironment from "@/components/DayNightEnvironment";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Prateek Kumar — Full Stack Developer",
  description:
    "Portfolio of Prateek Kumar — SDE-2 with 4 years building scalable full-stack applications with Angular, React, Node.js, Redis, GCP, and Elasticsearch.",
  keywords: [
    "Full Stack Developer",
    "SDE-2",
    "Angular",
    "React",
    "Node.js",
    "Portfolio",
    "Prateek Kumar",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg text-text font-body">
        <DayNightProvider>
          <SmoothScroll>
            <DayNightEnvironment />
            <WaveGlobeWrapper />
            <FilmGrainWrapper />
            <InteractiveModelWrapper />
            <Navbar />
            <main className="relative z-20">{children}</main>
            <Footer />
          </SmoothScroll>
        </DayNightProvider>
      </body>
    </html>
  );
}
