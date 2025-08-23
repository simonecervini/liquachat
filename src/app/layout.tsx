import "~/styles/globals.css";

import { ReactScan } from "~/components/react-scan";
import { type Metadata } from "next";
import { IBM_Plex_Mono, Poppins } from "next/font/google";

import { AlertEmitter } from "~/components/alert";
import { ReactAriaProvider } from "~/components/react-aria-provider";
import { RenameDialog } from "~/components/rename-dialog";
import { Toaster } from "~/components/system/sonner";
import { env } from "~/env";
import { TRPCReactProvider } from "~/lib/trpc";
import { ZeroAuthenticatedProvider } from "~/zero/react";

export const metadata: Metadata = {
  title: {
    template: "%s | Liqua",
    default: "Liqua",
  },
  description: "The open-source, self-hosted, privacy-first AI assistant",
  icons: {
    icon: [
      {
        type: "image/png",
        url: "/favicon-96x96.png",
        sizes: "96x96",
      },
      {
        type: "image/svg+xml",
        url: "/favicon.svg",
      },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    title: "Liqua",
  },
  manifest: "/site.webmanifest",
};

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {env.NEXT_PUBLIC_NODE_ENV === "development" && <ReactScan />}
      <body
        className={`${poppins.variable} ${ibmPlexMono.variable} font-sans`}
        translate="no"
      >
        <TRPCReactProvider>
          <ZeroAuthenticatedProvider>
            <ReactAriaProvider>{children}</ReactAriaProvider>
          </ZeroAuthenticatedProvider>
        </TRPCReactProvider>
        <Toaster position="top-right" />
        <AlertEmitter />
        <RenameDialog />
      </body>
    </html>
  );
}
