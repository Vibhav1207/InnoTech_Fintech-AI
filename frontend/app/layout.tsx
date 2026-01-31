import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frontend",
  description: "Next.js 14 app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
