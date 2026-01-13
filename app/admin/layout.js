'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div className="p-10 text-center">Loading Admin Panel...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar - HIDDEN WHEN PRINTING */}
      <aside className="print:hidden w-full md:w-64 bg-slate-900 text-white flex-shrink-0">
        <div className="p-6 font-bold text-xl border-b border-gray-700 flex items-center gap-2">
          <span className="bg-blue-600 px-2 rounded text-sm">SP</span> Admin
        </div>
        <nav className="p-4 space-y-2 text-sm">
          <Link href="/admin" className="block py-2 px-4 hover:bg-slate-700 rounded transition">
            Dashboard Home
          </Link>
          <div className="pt-4 pb-1 px-4 text-xs font-bold text-gray-500 uppercase">Inventory</div>
          <Link href="/admin/brands" className="block py-2 px-4 hover:bg-slate-700 rounded transition">
            Manage Brands
          </Link>
          <Link href="/admin/products" className="block py-2 px-4 hover:bg-slate-700 rounded transition">
            Manage Products
          </Link>
          
          <div className="pt-4 pb-1 px-4 text-xs font-bold text-gray-500 uppercase">Pricing</div>
          <Link href="/admin/prices" className="block py-2 px-4 hover:bg-slate-700 rounded transition">
            Manage Prices
          </Link>
          <Link href="/admin/history" className="block py-2 px-4 hover:bg-slate-700 rounded transition">
            Price History Logs
          </Link>

          <div className="pt-4 pb-1 px-4 text-xs font-bold text-gray-500 uppercase">Tools</div>
          <Link href="/admin/settings" className="block py-2 px-4 hover:bg-slate-700 rounded transition">
            Public Visibility
          </Link>
          {/* NEW LINK */}
          <Link href="/admin/print" className="block py-2 px-4 hover:bg-slate-700 rounded transition text-yellow-200">
            Print Price List (PDF)
          </Link>
          
          <button 
            onClick={handleLogout}
            className="w-full text-left py-2 px-4 hover:bg-red-600 rounded mt-8 text-red-200 transition"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto print:p-0 print:overflow-visible">
        {children}
      </main>
    </div>
  )
}