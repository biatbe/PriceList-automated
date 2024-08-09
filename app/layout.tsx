import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {ClientSessionProvider} from './client-session';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Price Comaprison N4C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <ClientSessionProvider>
        {children}
      </ClientSessionProvider>
      </body>
    </html>
  );
}
