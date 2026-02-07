import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TermsModal from "@/components/TermsModal";

const inter = Inter({ subsets: ["latin"] });

/* ---------------- SEO & GOOGLE PREVIEW ---------------- */
export const metadata: Metadata = {
  title: {
    default: "Murmurz | Anonymous Chat, Random Chat & Private Chat Rooms",
    template: "%s | Murmurz",
  },

  description:
    "Murmurz is a fully anonymous chat platform with no accounts and no logs. Chat privately with friends, join public chat rooms, find random matches, create polls, vote instantly, and delete messages for both users. Pure anonymity, real-time communication, zero trace.",

  keywords: [
    "anonymous chat",
    "anonymous chatting platform",
    "anonymous messaging",
    "anonymous chat website",
    "anonymous chat app",
    "no registration chat",
    "no sign up chat",
    "no logs chat",
    "private anonymous chat",
    "secure anonymous chat",

    "random chat",
    "random anonymous chat",
    "chat with strangers anonymously",
    "public chat",
    "public chat rooms",
    "global chat room",

    "delete messages for both users",
    "ephemeral chat",
    "vanishing messages",

    "anonymous polls",
    "create polls anonymously",
    "vote anonymously",

    "murmurz",
    "murmurz anonymous chat",
    "murmurz chat platform",
  ],

  authors: [{ name: "Murmurz Team" }],
  creator: "Murmurz",
  metadataBase: new URL("https://murmurz.org"),

  openGraph: {
    title: "Murmurz | Anonymous Chat Without Accounts or Logs",
    description:
      "Chat anonymously with strangers or friends. Public rooms, private chats, random matching, polls, and messages that disappear for everyone.",
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
      "Instant anonymous chat with random matches, public rooms, private messaging, polls, and disappearing messages.",
    images: ["/og-preview.png"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
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
        className={`${inter.className} bg-zinc-950 text-white antialiased selection:bg-purple-500/30`}
      >
        <TermsModal>{children}</TermsModal>

        {/* ================= FAQ SCHEMA (SEO) ================= */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Is Murmurz completely anonymous?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                      "Yes. Murmurz does not require accounts, does not collect personal data, and does not store user identities."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can messages be deleted for both users?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                      "Yes. When a message is deleted, it is permanently removed for all participants in the chat."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Does Murmurz support random anonymous chat?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                      "Yes. Murmurz offers instant random matching so users can chat anonymously with strangers."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Are there public chat rooms on Murmurz?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                      "Yes. Users can join public chat rooms and global channels without creating an account."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I create polls and vote anonymously?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                      "Yes. Murmurz allows users to create polls and vote anonymously inside chats and rooms."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Do I need to sign up to use Murmurz?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text":
                      "No. Murmurz works without registration, sign-up, or any personal information."
                  }
                }
              ]
            })
          }}
        />
        {/* =================================================== */}
      </body>
    </html>
  );
}
