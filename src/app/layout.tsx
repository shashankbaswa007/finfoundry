import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/shared/smooth-scroll";
import { AuthProvider } from "@/lib/auth-context";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-satoshi",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cbitfinfoundry.vercel.app"),
  manifest: "/manifest.json",
  title: {
    default: "CBIT FinFoundry — Financial Literacy Club",
    template: "%s | CBIT FinFoundry",
  },
  description:
    "CBIT FinFoundry is the premier financial literacy club at Chaitanya Bharathi Institute of Technology, Hyderabad. Master stock markets, financial modeling, and wealth management.",
  keywords: [
    "CBIT",
    "FinFoundry",
    "financial literacy",
    "stock market",
    "Hyderabad",
    "college club",
    "financial modeling",
    "investing",
    "wealth management",
  ],
  authors: [{ name: "CBIT FinFoundry" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://cbitfinfoundry.vercel.app",
    siteName: "CBIT FinFoundry",
    title: "CBIT FinFoundry — Financial Literacy Club",
    description:
      "The premier financial literacy club at CBIT, Hyderabad. Building financially literate engineers through market education and hands-on experience.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CBIT FinFoundry",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CBIT FinFoundry — Financial Literacy Club",
    description:
      "The premier financial literacy club at CBIT, Hyderabad.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-32x32.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CBIT FinFoundry",
    alternateName: "FinFoundry",
    url: "https://cbitfinfoundry.vercel.app",
    logo: "https://cbitfinfoundry.vercel.app/favicon-32x32.png",
    description:
      "CBIT FinFoundry is the premier financial literacy club at Chaitanya Bharathi Institute of Technology, Hyderabad.",
    parentOrganization: {
      "@type": "EducationalOrganization",
      name: "Chaitanya Bharathi Institute of Technology",
      alternateName: "CBIT",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Hyderabad",
        addressRegion: "Telangana",
        addressCountry: "IN",
      },
    },
    sameAs: [
      "https://instagram.com/cbitfinfoundry",
      "https://linkedin.com/company/cbit-finfoundry",
    ],
  };

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FinFoundry" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
        {/* ── PWA Service Worker registration ── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")})}`,
          }}
        />
      </body>
    </html>
  );
}
