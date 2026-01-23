import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Ensure this file exists in your /app folder
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Murmur",
  description: "Anonymous Chat",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  themeColor: "#09090b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Murmur",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body 
        className={cn(
          inter.className, 
          "bg-zinc-950 text-zinc-100 antialiased overflow-hidden h-[100dvh] w-screen"
        )}
      >
        {children}
      </body>
    </html>
  );
}