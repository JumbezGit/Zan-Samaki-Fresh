import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <main className="min-h-screen">
      {children}
      <footer className="bg-ocean-600 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 ZanSamaki Fresh. Samaki safi, bei bora. 🇹🇿</p>
        </div>
      </footer>
    </main>
  )
}

export default Layout

