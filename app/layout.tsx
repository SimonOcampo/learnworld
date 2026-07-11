import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnWorld — Turn notes into worlds",
  description: "Explore algorithms as interactive, state-aware simulations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
