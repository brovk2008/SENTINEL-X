import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { WSProvider } from "@/components/providers/WSProvider";
import { DemoModeToggle } from "@/components/DemoModeToggle";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NotificationPanel } from "@/components/NotificationPanel";
import { DemoController } from "@/components/DemoController";
import { TopBar } from "@/components/layout/TopBar";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

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
    <html lang="en" className={poppins.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('safetyos-theme'); if(t==='light' || t==='dark'){document.documentElement.dataset.theme=t;} }catch(e){} })();` }} />
      </head>
      <body>
        <WSProvider>
          <LoadingScreen>
            <DemoModeToggle />
            <div className="app-layout">
              <Sidebar />
              <main className="main-content">
                <TopBar />
                <div className="content-stage">
                  {children}
                </div>
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
