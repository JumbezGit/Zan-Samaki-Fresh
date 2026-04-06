"use client"

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Lock, Mail, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '@/context/LanguageContext'

type UserRole = 'fisher' | 'buyer' | 'staff' | 'admin'
type RegistrationRole = 'fisher' | 'buyer'

const translations = {
  en: {
    roles: {
      fisher: 'Fisher',
      buyer: 'Buyer',
      staff: 'Staff',
      admin: 'Admin'
    },
    login: 'Login',
    register: 'Register',
    username: 'Username',
    usernameRequired: 'Username is required',
    usernamePlaceholder: 'Your username',
    email: 'Email or Phone',
    emailRequired: 'Email is required',
    password: 'Password',
    passwordRequired: 'Password is required',
    passwordLength: 'Password must be at least 5 characters',
    passwordPlaceholder: 'Your password',
    hidePassword: 'Hide password',
    showPassword: 'Show password',
    loading: 'Loading...',
    noAccount: "Don't have an account? Register here",
    hasAccount: 'Already have an account? Login here',
    welcomeBack: 'Welcome back!',
    accountCreated: 'Your account has been created!',
    genericError: 'Something went wrong. Please try again.',
    networkError: 'Network issue. Please try again.'
  },
  sw: {
    roles: {
      fisher: 'Mvuvi',
      buyer: 'Mnunuzi',
      staff: 'Staff',
      admin: 'Admin'
    },
    login: 'Ingia',
    register: 'Jisajili',
    username: 'Jina la Mtumiaji',
    usernameRequired: 'Jina ni lazima',
    usernamePlaceholder: 'Jina lako',
    email: 'Barua Pepe au Simu',
    emailRequired: 'Barua pepe ni lazima',
    password: 'Nenosiri',
    passwordRequired: 'Nenosiri ni lazima',
    passwordLength: 'Nenosiri lazima liwe na herufi 5+',
    passwordPlaceholder: 'Nenosiri lako',
    hidePassword: 'Ficha nenosiri',
    showPassword: 'Onyesha nenosiri',
    loading: 'Inapakia...',
    noAccount: 'Huna akaunti? Jisajili hapa',
    hasAccount: 'Una akaunti? Ingia hapa',
    welcomeBack: 'Karibu tena!',
    accountCreated: 'Akaunti yako imetengenezwa!',
    genericError: 'Kosa! Jaribu tena.',
    networkError: 'Tatizo la mtandao. Jaribu tena.'
  }
} as const

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (expectedRole: UserRole) => Promise<boolean>
  initialMode?: 'login' | 'register'
  initialRole?: UserRole
}

interface AuthFormValues {
  username?: string
  email: string
  password: string
}

const getErrorMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const record = payload as Record<string, unknown>

  if (typeof record.detail === 'string' && record.detail.trim()) {
    return record.detail
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0]
      if (typeof first === 'string' && first.trim()) {
        return first
      }
    }

    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return ''
}

const LoginModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  initialRole = 'buyer'
}: LoginModalProps) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login')
  const [role, setRole] = useState<RegistrationRole>(initialRole === 'admin' || initialRole === 'staff' ? 'buyer' : initialRole)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormValues>()
  const { language } = useLanguage()
  const activeRole = isLogin ? initialRole : role
  const copy = translations[language]
  const authTitle = `${copy.roles[activeRole]} ${isLogin ? copy.login : copy.register}`
  const allowRegistration = initialRole !== 'admin' && initialRole !== 'staff'

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setIsLogin(initialRole === 'admin' || initialRole === 'staff' ? true : initialMode === 'login')
    setRole(initialRole === 'admin' || initialRole === 'staff' ? 'buyer' : initialRole)
    setShowPassword(false)
    reset()
  }, [initialMode, initialRole, isOpen, reset])

  const onSubmit = async (data: AuthFormValues) => {
    setLoading(true)

    try {
      const endpoint = isLogin ? 'login' : 'register'
      const body = isLogin
        ? { email: data.email, password: data.password }
        : { ...data, role }
      
      const res = await fetch(`/api/auth/jwt/${endpoint}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const responseData = await res.json()

      if (res.ok) {
        const { auth_token } = responseData
        localStorage.setItem('token', auth_token)
        const accepted = await onSuccess(activeRole)

        if (accepted) {
          toast.success(isLogin ? copy.welcomeBack : copy.accountCreated)
          reset()
          onClose()
        }
      } else {
        toast.error(getErrorMessage(responseData) || copy.genericError)
      }
    } catch (err) {
      toast.error(copy.networkError)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {authTitle}
          </h2>
          <button onClick={onClose} disabled={loading} className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {copy.username}
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('username', { required: copy.usernameRequired })}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
                  placeholder={copy.usernamePlaceholder}
                />
              </div>
              {errors.username && <p className="text-red-500 text-sm mt-1">{String(errors.username.message)}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {copy.email}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('email', { required: copy.emailRequired })}
                disabled={loading}
                type="email"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
                placeholder="example@email.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{String(errors.email.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{copy.password}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('password', { required: copy.passwordRequired, minLength: {
                  value: 5,
                  message: copy.passwordLength
                } })}
                disabled={loading}
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
                placeholder={copy.passwordPlaceholder}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-ocean-600"
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{String(errors.password.message)}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-ocean-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-ocean-700 hover:to-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{copy.loading}</span>
              </>
            ) : (
              <>{isLogin ? copy.login : copy.register}</>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          {allowRegistration && (
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                reset()
              }}
              disabled={loading}
              className="text-ocean-600 hover:text-ocean-700 font-semibold transition-colors disabled:opacity-50"
            >
              {isLogin
                ? copy.noAccount
                : copy.hasAccount
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginModal

