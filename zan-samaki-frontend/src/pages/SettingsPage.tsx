import { Settings, Shield, User } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface SettingsPageProps {
  username: string
  role: string
}

const SettingsPage = ({ username, role }: SettingsPageProps) => {
  const { language } = useLanguage()
  const copy = language === 'en'
    ? {
      title: 'Settings',
      subtitle: 'Manage your account information.',
      profile: 'Profile',
      username: 'Username',
      role: 'Role',
      account: 'Account',
      accountText: 'More account controls can be added here as the app grows. For now, this page gives users a dedicated place for settings access from the navbar menu.',
      roles: {
        admin: 'Admin',
        buyer: 'Buyer',
        fisher: 'Fisher',
        staff: 'Staff'
      }
    }
    : {
      title: 'Mipangilio',
      subtitle: 'Dhibiti taarifa za akaunti yako.',
      profile: 'Wasifu',
      username: 'Jina la mtumiaji',
      role: 'Jukumu',
      account: 'Akaunti',
      accountText: 'Vipengele zaidi vya akaunti vinaweza kuongezwa hapa kadri mfumo unavyokua. Kwa sasa, ukurasa huu unawapa watumiaji sehemu maalum ya mipangilio kutoka kwenye menyu ya juu.',
      roles: {
        admin: 'Admin',
        buyer: 'Mnunuzi',
        fisher: 'Mvuvi',
        staff: 'Staff'
      }
    }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex items-center space-x-3">
          <div className="rounded-2xl bg-ocean-100 p-3 text-ocean-700">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{copy.title}</h1>
            <p className="text-gray-600">{copy.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-5 flex items-center space-x-3">
            <User className="h-5 w-5 text-ocean-700" />
            <h2 className="text-xl font-semibold text-gray-900">{copy.profile}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">{copy.username}</p>
              <p className="mt-1 text-lg font-medium text-gray-800">{username}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">{copy.role}</p>
              <p className="mt-1 text-lg font-medium text-gray-800">{copy.roles[role as keyof typeof copy.roles] ?? role}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-5 flex items-center space-x-3">
            <Shield className="h-5 w-5 text-ocean-700" />
            <h2 className="text-xl font-semibold text-gray-900">{copy.account}</h2>
          </div>
          <p className="text-gray-600">{copy.accountText}</p>
        </section>
      </div>
    </div>
  )
}

export default SettingsPage
