import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { ToastProvider } from "@/components/ui/Toast";

const PlusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: "TaskFlow | Kanban Board",
  description: "A beautiful, responsive Kanban board for project management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${PlusJakartaSans.className} font-sans antialiased text-gray-900 bg-page-bg`}>
        <ToastProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Navbar />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
