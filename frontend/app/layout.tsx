import "./globals.css";
import { Poppins } from "next/font/google";
import { TopBar } from "../components/layout/TopBar";
import { Sidebar } from "../components/layout/Sidebar";
import { WSProvider } from "../components/providers/WSProvider";
import { LoadingScreen } from "../components/layout/LoadingScreen";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-poppins" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <head />
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
          </LoadingScreen>
        </WSProvider>
      </body>
    </html>
  );
}
