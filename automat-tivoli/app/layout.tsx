import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import SwRegister from "@/components/SwRegister";

export const metadata: Metadata = {
  title: "Automat Tivoli",
  description: "Getränke- und Riegelautomat nachbestellen – per Foto",
  applicationName: "Automat Tivoli",
  appleWebApp: { capable: true, title: "Tivoli", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH">
      <body className="min-h-dvh antialiased">
        <StoreProvider>
          <main className="mx-auto w-full max-w-xl px-4 pt-[calc(env(safe-area-inset-top)+12px)]">{children}</main>
          <BottomNav />
        </StoreProvider>
        <SwRegister />
      </body>
    </html>
  );
}
