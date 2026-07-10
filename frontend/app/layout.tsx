import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { WSProvider } from "@/components/providers/WSProvider";
import { DemoModeToggle } from "@/components/DemoModeToggle";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NotificationPanel } from "@/components/NotificationPanel";
import { DemoController } from "@/components/DemoController";

export const metadata: Metadata = {
  title: "SafetyOS — AI Operating System for Industrial Safety",
  description: "The world's first AI Operating System for industrial safety. Real-time compound risk detection, multi-agent AI reasoning, and autonomous emergency response.",
  keywords: ["industrial safety", "AI", "OISD", "Factory Act", "SafetyOS", "compound risk"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <WSProvider>
          <LoadingScreen>
            <DemoModeToggle />
            <div className="app-layout">
              <Sidebar />
              <main className="main-content">
                {children}
              </main>
            </div>
            <NotificationPanel />
            <DemoController />
            <NotificationToast />
          </LoadingScreen>
        </WSProvider>
      </body>
    </html>
  );
}
