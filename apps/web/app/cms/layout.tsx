import type { ReactNode } from "react";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function CMSLayout({ children }: { children: ReactNode }) {
  return children;
}
