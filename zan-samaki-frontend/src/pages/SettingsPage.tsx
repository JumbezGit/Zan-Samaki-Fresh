import { Settings, Shield, User } from 'lucide-react'

interface SettingsPageProps {
  username: string
  role: string
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  buyer: 'Buyer',
  fisher: 'Fisher'
}

const SettingsPage = ({ username, role }: SettingsPageProps) => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex items-center space-x-3">
          <div className="rounded-2xl bg-ocean-100 p-3 text-ocean-700">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account information.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-5 flex items-center space-x-3">
            <User className="h-5 w-5 text-ocean-700" />
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Username</p>
              <p className="mt-1 text-lg font-medium text-gray-800">{username}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Role</p>
              <p className="mt-1 text-lg font-medium text-gray-800">{roleLabels[role] ?? role}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-5 flex items-center space-x-3">
            <Shield className="h-5 w-5 text-ocean-700" />
            <h2 className="text-xl font-semibold text-gray-900">Account</h2>
          </div>
          <p className="text-gray-600">
            More account controls can be added here as the app grows. For now, this page gives users a dedicated
            place for settings access from the navbar menu.
          </p>
        </section>
      </div>
    </div>
  )
}

export default SettingsPage
