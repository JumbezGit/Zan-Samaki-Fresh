"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Lock, UserPlus, Shield, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface AuthFormValues {
  username?: string
  email: string
  password: string
}

const LoginModal = ({ isOpen, onClose, onSuccess }: LoginModalProps) => {
  const [isLogin, setIsLogin] = useState(true)
  const [role, setRole] = useState('buyer')
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormValues>()

  const onSubmit = async (data: AuthFormValues) => {
    try {
      const endpoint = isLogin ? 'login' : 'register'
      const body = isLogin 
        ? { username: data.username, password: data.password }
        : { ...data, role }
      
      const res = await fetch(`/api/auth/jwt/${endpoint}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        const { auth_token } = await res.json()
        localStorage.setItem('token', auth_token)
        toast.success(isLogin ? 'Karibu tena!' : 'Akaunti yako imeundwa!')
        onSuccess()
        reset()
        onClose()
      } else {
        toast.error('Kosa! Jaribu tena.')
      }
    } catch (err) {
      toast.error('Tatizo la mtandao. Jaribu tena.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Ingia' : 'Jisajili'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jina la Mtumiaji
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('username', { required: 'Jina ni lazima' })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
                  placeholder="Jina lako"
                />
              </div>
              {errors.username && <p className="text-red-500 text-sm mt-1">{String(errors.username.message)}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barua Pepe au Simu
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('email', { required: 'Barua pepe ni lazima' })}
                type="email"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
                placeholder="example@email.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{String(errors.email.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nenosiri</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('password', { required: 'Nenosiri ni lazima', minLength: {
                  value: 6,
                  message: 'Nenosiri lazima liwe na herufi 6+'
                } })}
                type="password"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
                placeholder="Nenosiri lako"
              />
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{String(errors.password.message)}</p>}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aina ya Mtumiaji</label>
              <div className="flex space-x-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="fisher"
                    checked={role === 'fisher'}
                    onChange={(e) => setRole(e.target.value)}
                    className="mr-2"
                  />
                  <Shield className="w-5 h-5 mr-1" />
                  <span>Mvuvi</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="buyer"
                    checked={role === 'buyer'}
                    onChange={(e) => setRole(e.target.value)}
                    className="mr-2"
                  />
                  <ShoppingCart className="w-5 h-5 mr-1" />
                  <span>Nunuzi</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-ocean-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-ocean-700 hover:to-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
          >
            {isLogin ? 'Ingia' : 'Jisajili'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              reset()
            }}
            className="text-ocean-600 hover:text-ocean-700 font-semibold transition-colors"
          >
            {isLogin 
              ? 'Huna akaunti? Jisajili hapa' 
              : 'Una akaunti? Ingia hapa'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginModal

