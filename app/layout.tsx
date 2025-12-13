import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";
import TermsModal from "@/components/trust/TermsModal";
import { RoleProvider } from "@/context/RoleContext";
import Navbar from "@/components/layout/Navbar";
import AnnouncementsBar from "@/components/layout/AnnouncementsBar";
import BannedBanner from "@/components/layout/BannedBanner";



const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} mesh-bg min-h-screen`}>
        <ConvexClientProvider>
          <RoleProvider>
            <Navbar />
            <BannedBanner />
            <AnnouncementsBar />
            {children}
            <Toaster />
            <TermsModal />
          </RoleProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
