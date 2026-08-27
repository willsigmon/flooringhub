import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { WebMcpProvider } from "@/components/WebMcpProvider";
import { SITE_URL, SOCIAL_PREVIEW_IMAGE } from "@/lib/site-config";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Flooring Hub | The Flooring Experts - Raleigh, NC",
  description:
    "Flooring Hub is Raleigh's trusted flooring specialist. Over 25 years of expert hardwood, LVP, laminate, carpet installation. Free in-home estimates.",
  openGraph: {
    siteName: "Flooring Hub",
    type: "website",
    images: [
      {
        url: SOCIAL_PREVIEW_IMAGE,
        width: 1200,
        height: 630,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [SOCIAL_PREVIEW_IMAGE],
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1C1C1E",
};

const flooringTools = [
  {
    name: "calculate_flooring_estimate",
    description: "Calculate material requirements and cost estimate by square footage and material type",
    parameters: {
      type: "object",
      properties: {
        sqFt: { type: "number" },
        material: {
          type: "string",
          enum: ["hardwood", "laminate", "tile", "vinyl_plank"],
        },
      },
      required: ["sqFt", "material"],
    },
  },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <meta name="ga-measurement-id" content="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <WebMcpProvider businessName="FlooringHub" tools={flooringTools} />
        {children}
        <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
