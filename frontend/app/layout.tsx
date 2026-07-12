import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TopNav } from "../components/layout/TopNav";
import { WSProvider } from "../components/providers/WSProvider";
import { LoadingScreen } from "../components/layout/LoadingScreen";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "SafetyOS — AI Operating System for Industrial Safety",
  description:
    "Real-time AI-powered industrial safety platform. Multi-agent debate, compound risk detection, sensor monitoring, and OISD compliance for high-risk facilities.",
  keywords: "industrial safety, AI agents, sensor monitoring, OISD compliance, compound risk, safety OS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#07070f" />
      </head>
      <body>
        <WSProvider>
          <LoadingScreen>
            <div>
              <TopNav />
              <main className="content-stage">{children}</main>
            </div>
          </LoadingScreen>
        </WSProvider>
      </body>
    </html>
  );
}
