import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FusionBrain",
  description: "Personal CNC/CAM/Fusion 360 knowledge assistant",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
