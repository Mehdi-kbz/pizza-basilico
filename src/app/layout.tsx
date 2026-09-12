import type { Metadata } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  title: "Pizza Basilico — Pizzas artisanales au feu de bois",
  description:
    "Food truck de pizzas artisanales cuites au feu de bois. Commandez à l'avance, retirez au camion — sans file d'attente.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Pizza Basilico" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  openGraph: {
    title: "Pizza Basilico — Pizzas artisanales au feu de bois",
    description: "Commandez à l'avance, retirez au camion. Pâte maison, four à bois.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#0f0b09",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${bodoni.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <SiteHeader />
        <div className="flex-1 flex flex-col">{children}</div>
        <SiteFooter />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
