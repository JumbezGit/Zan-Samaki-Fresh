import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1">
        {children}
      </div>
      <footer className="mt-20 bg-ocean-600 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p>&copy; 2024 ZanSamaki Fresh. Samaki safi, bei bora.</p>
        </div>
      </footer>
    </main>
  )
}

export default Layout
