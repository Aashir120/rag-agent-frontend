import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from 'react-toastify';


export const metadata: Metadata = {
  title: "RAG Agent - Customer Support",
  description: "AI-powered customer support with document understanding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-gray-50">
          {children}
          <ToastContainer />
        </main>
      </body>
    </html>
  );
}
