import "./globals.css";
import { Poppins } from "next/font/google";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-poppins" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <head />
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <TopBar />
            <div className="content-stage">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
