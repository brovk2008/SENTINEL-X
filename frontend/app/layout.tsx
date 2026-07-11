import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { WSProvider } from "@/components/providers/WSProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NotificationPanel } from "@/components/NotificationPanel";
import { TopBar } from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "SafetyOS — AI Operating System for Industrial Safety",
  description:
    "Real-time compound risk detection, multi-agent AI reasoning, and autonomous emergency response for industrial facilities.",
  keywords: ["industrial safety", "AI", "OISD", "Factory Act", "SafetyOS", "compound risk"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <WSProvider>
          <LoadingScreen>
            <div className="app-layout">
              <Sidebar />
              <main className="main-content">
                <TopBar />
                <div className="content-stage">{children}</div>
              </main>
            </div>
            <NotificationPanel />
            <NotificationToast />
          </LoadingScreen>
        </WSProvider>
      </body>
    </html>
  );
}
