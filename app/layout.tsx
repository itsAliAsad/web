import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";
import TermsModal from "@/components/trust/TermsModal";
import { RoleProvider } from "@/context/RoleContext";
import Navbar from "@/components/layout/Navbar";



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
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ConvexClientProvider>
          <RoleProvider>
            <Navbar />
            {children}
            <Toaster />
            <TermsModal />
          </RoleProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
