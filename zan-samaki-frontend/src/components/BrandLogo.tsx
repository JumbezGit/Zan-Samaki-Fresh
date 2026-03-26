import { Link } from 'react-router-dom'

interface BrandLogoProps {
  to?: string
}

const BrandLogo = ({ to = '/' }: BrandLogoProps) => {
  return (
    <Link to={to} className="flex items-center gap-3">
      <img
        src="/zansamaki-logo.png"
        alt="Zan Samaki Fresh"
        className="h-11 w-11 rounded-full object-cover ring-2 ring-ocean-100"
      />
      <span className="font-bold text-xl bg-gradient-to-r from-ocean-600 to-blue-600 bg-clip-text text-transparent">
        ZanSamaki
      </span>
    </Link>
  )
}

export default BrandLogo
