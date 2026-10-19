import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chatbot Bangladesh | Facebook & WhatsApp Bot",
  description:
    "বাংলাদেশের সেরা AI চ্যাটবট — Facebook ও WhatsApp-এর জন্য। অর্ডার নিন, উত্তর দিন, বিক্রি বাড়ান।",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
