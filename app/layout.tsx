import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider"
import { Navbar } from "@/components/layout/navbar";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediaLib - Open Source Media Library",
  description: "A fast, modern open source media library.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${rubik.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
