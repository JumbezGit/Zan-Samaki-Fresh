import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  footerOffsetClassName?: string
}

const Layout = ({ children, footerOffsetClassName = '' }: LayoutProps) => {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1">
        {children}
      </div>
      <footer className={`mt-20 bg-ocean-600 py-3 text-white ${footerOffsetClassName}`}>
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p>&copy; 2024 ZanSamaki Fresh</p>
        </div>
      </footer>
    </main>
  )
}

export default Layout
