import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/layout/auth-provider";

export const metadata: Metadata = {
  title: "TURA",
  description: "A private luxury fitness tracker for weight and workout progress.",
  applicationName: "TURA",
  appleWebApp: {
    capable: true,
    title: "TURA",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="noise" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
