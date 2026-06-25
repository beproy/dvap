import "./globals.css"
import { Inter, JetBrains_Mono } from "next/font/google"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Container from "@/components/layout/Container"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "DVAP",
  description: "Dynamic Vulnerability & Attack Path Platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-surface-base text-text-primary min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <Container>
            {children}
          </Container>
        </main>
        <Footer />
      </body>
    </html>
  )
}
