import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Robert's FusionBrain",
  description: "Robert's personal CNC/CAM/Fusion 360 knowledge assistant",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
