import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import AuthGuard from "@/components/app/AuthGuard";
import NavBar from "@/components/app/NavBar";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import DirectNavigationLinks from "./_components/DirectNavigationLinks";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CalorieCounter",
  description: "AI-powered calorie tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Force prefetch of important pages */}
        <link rel="prefetch" href="/" />
        <link rel="prefetch" href="/history" />
        <link rel="prefetch" href="/customize" />
      </head>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "antialiased min-h-screen bg-background font-sans",
          "dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-950"
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="calorie-counter-theme">
          <QueryProvider>
            <AuthGuard>
              <div className="flex flex-col min-h-screen">
                <NavBar />
                <main className="flex-grow">
                  {children}
                </main>
                <DirectNavigationLinks />
              </div>
            </AuthGuard>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
