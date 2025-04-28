import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FutureForm - Create Beautiful Forms",
  description: "Create and share forms easily with FutureForm",
  icons: {
    icon: '/futureformlogo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white shadow sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <a href="/" className="flex items-center space-x-2">
                    <Image
                      src="/futureformlogo.png"
                      alt="FutureForm Logo"
                      width={40}
                      height={40}
                      className="h-8 w-auto"
                    />
                    <span className="text-2xl font-bold text-indigo-600">
                      FutureForm
                    </span>
                  </a>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <a
                    href="/"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-indigo-500 text-sm font-medium"
                  >
                    Home
                  </a>
                  <a
                    href="/dashboard"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-indigo-500 text-sm font-medium"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/login"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-indigo-500 text-sm font-medium"
                  >
                    Login
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="w-full text-center py-4 text-gray-400 text-sm bg-white border-t">
          &copy; {new Date().getFullYear()} FutureForm. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
