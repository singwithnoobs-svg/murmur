import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TermsModal from "@/components/TermsModal";

const inter = Inter({ subsets: ["latin"], display: "swap" });

/* ---------------- METADATA ---------------- */

export const metadata: Metadata = {
  title: {
    default: "Murmurz | Anonymous Chat, Random Chat & Private Chat Rooms",
    template: "%s | Murmurz",
  },

  description:
    "Murmurz is a fully anonymous chat platform with no accounts and no logs. Chat privately, join public rooms, find random matches, create polls, and send disappearing messages.",

  keywords: [
    "anonymous chat",
    "random chat",
    "chat without login",
    "anonymous messaging",
    "private chat rooms",
    "chat with strangers",
    "ephemeral chat",
    "anonymous polls",
    "murmurz",
  ],

  authors: [{ name: "Murmurz Team" }],
  creator: "Murmurz",
  metadataBase: new URL("https://murmurz.org"),

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Murmurz | Anonymous Chat Without Accounts",
    description:
      "Chat anonymously with strangers or friends. No login, no logs, instant messaging.",
    url: "https://murmurz.org",
    siteName: "Murmurz",
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 630,
        alt: "Murmurz Anonymous Chat Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Murmurz | Anonymous Chat Platform",
    description:
      "Instant anonymous chat with random matches, public rooms, and disappearing messages.",
    images: ["/og-preview.png"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },

  category: "technology",
};

/* ---------------- VIEWPORT (Mobile perfection) ---------------- */

export const viewport: Viewport = {
  themeColor: "#05010a",
  colorScheme: "dark",
};

/* ---------------- ROOT LAYOUT ---------------- */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-zinc-950 text-white antialiased selection:bg-purple-500/30`}
      >
        <TermsModal>{children}</TermsModal>

        {/* ================= FAQ SCHEMA ================= */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />

        {/* ================= WEBSITE SCHEMA ================= */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteSchema),
          }}
        />
      </body>
    </html>
  );
}

/* ---------------- SCHEMA OBJECTS ---------------- */

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is Murmurz completely anonymous?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Yes. Murmurz does not require accounts and does not store user identities.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to sign up?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "No. Murmurz works instantly without registration or login.",
      },
    },
    {
      "@type": "Question",
      name: "Can I chat with strangers?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Yes. Murmurz supports random anonymous chat with strangers worldwide.",
      },
    },
  ],
};

const siteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Murmurz",
  url: "https://murmurz.org",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://murmurz.org/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};
