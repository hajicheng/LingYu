import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { BookOpen, Library, ClipboardCheck, BarChart3 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "个人语言学习库",
  description: "基于 RAG 技术的私人化定制语言学习应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">个人语言学习库</span>
                </Link>
                <nav className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    学习助手
                  </Link>
                  <Link
                    href="/library"
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <Library className="h-4 w-4" />
                    知识库
                  </Link>
                  <Link
                    href="/review"
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    复习
                  </Link>
                  <Link
                    href="/progress"
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <BarChart3 className="h-4 w-4" />
                    进度
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t py-6 mt-auto">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>基于 RAG 技术的个人语言学习库 © 2024</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

