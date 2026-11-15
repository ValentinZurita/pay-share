import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { AppFrame } from "@/components/ui/app-frame";
import { themeBootScript } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PayShare",
  description: "Divide la cuenta de la mesa y paga tu parte con CoDi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-MX"
      className={`${inter.variable} ${geistMono.variable} t-light h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <AppFrame />
        {children}
      </body>
    </html>
  );
}
