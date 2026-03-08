'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, User } from 'lucide-react'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            // In a real app, this would be an API call
            // For now, we simulate a login check
            if (username === 'admin' && password === 'admin123') {
                // Set a cookie (in a real app, do this securely via API)
                document.cookie = "auth_token=authenticated; path=/; max-age=86400; SameSite=Lax"

                // Redirect to previous page or dashboard
                const from = searchParams.get('from') || '/dashboard'
                router.push(from)
                router.refresh() // Ensure middleware catches the new cookie
            } else {
                setError('Username atau password salah')
            }
        } catch (err) {
            setError('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex-1 bg-white flex flex-col items-center justify-center px-6 py-12 overflow-x-hidden">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-100 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-60"></div>

                <div className="relative z-10">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400">
                            Masuk
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Login untuk mengakses dashboard admin
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    placeholder="Masukkan username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    placeholder="Masukkan password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-2xl font-medium shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Masuk ke Dashboard'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400">
                            Gunakan <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">admin</code> / <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">admin123</code> untuk demo
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
