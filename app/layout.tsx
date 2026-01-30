import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // 1. THIS MUST BE IMPORTED FIRST
import TermsModal from "@/components/TermsModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MURMUR",
  description: "Chat like a ghost",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark"> 
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        {/* 2. Wrap EVERYTHING inside the body */}
        <TermsModal>
          {children}
        </TermsModal>
      </body>
    </html>
  );
}
