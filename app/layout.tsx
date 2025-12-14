import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";
import TermsModal from "@/components/trust/TermsModal";
import { RoleProvider } from "@/context/RoleContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import AnnouncementsBar from "@/components/layout/AnnouncementsBar";
import BannedBanner from "@/components/layout/BannedBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Path - P2P Academic Marketplace",
  description: "Connect with students for academic help",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans mesh-bg min-h-screen antialiased`}>
        <ConvexClientProvider>
          <ThemeProvider>
            <RoleProvider>
              <Navbar />
              <BannedBanner />
              <AnnouncementsBar />
              {children}
              <Toaster />
              <TermsModal />
            </RoleProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
