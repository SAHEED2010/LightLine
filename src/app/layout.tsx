import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LightLine — Every complaint, a clear next step",
    template: "%s · LightLine",
  },
  description:
    "Electricity complaint intake for Nigeria. A spoken complaint becomes a structured ticket that operators can act on.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
