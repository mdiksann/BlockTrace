import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "BlockTrace",
  description: "AI-powered diagnostics for the CROO ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="font-sans">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow container mx-auto p-4 sm:p-6 lg:px-12 py-8">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
