import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "AInder — swipe for your AI match",
  description: "Tinder, but you swipe on LLMs by their feature sets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav />
        <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">{children}</div>
      </body>
    </html>
  );
}
