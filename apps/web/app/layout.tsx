import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dev Town",
  description: "개발자 타운 프론트엔드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
