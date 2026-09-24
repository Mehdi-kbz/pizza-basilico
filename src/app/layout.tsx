import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollToTop } from "@/components/ScrollToTop";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://pizza.mehdi.website"),
  title: "Pizza Basilico — Pizzas artisanales au feu de bois",
  description:
    "Food truck de pizzas artisanales cuites au feu de bois. Commandez à l'avance, retirez au camion — sans file d'attente.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Pizza Basilico" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192" }, { url: "/favicon-32.png", sizes: "32x32" }], apple: "/icons/apple-touch-icon.png" },
  openGraph: {
    title: "Pizza Basilico — Pizzas artisanales au feu de bois",
    description: "Commandez à l'avance, retirez au camion. Pâte maison, four à bois.",
    type: "website",
    locale: "fr_FR",
    siteName: "Pizza Basilico",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Pizza Basilico" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport = {
  themeColor: "#fff6ef",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <SiteHeader />
        <div className="flex-1 flex flex-col">{children}</div>
        <SiteFooter />
        <ScrollToTop />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
