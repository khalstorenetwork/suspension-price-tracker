'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function HistoryPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    // Fetch history logs and join with Product+Brand details
    const { data, error } = await supabase
      .from('price_history')
      .select(`
        *,
        products (
          car_make, 
          car_model, 
          product_variant, 
          position,
          brands (name)
        )
      `)
      .order('changed_at', { ascending: false })
      .limit(50) // Only show last 50 changes for performance

    if (error) console.error('Error:', error)
    else setLogs(data || [])
    
    setLoading(false)
  }

  // Helper to format date nicely
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-MY', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  // Helper to compare old vs new price
  const renderChange = (label, oldVal, newVal) => {
    // If both are 0 or null, nothing changed
    if (!oldVal && !newVal) return null
    if (oldVal === newVal) return null

    return (
      <div className="text-xs flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
        <span className="text-gray-500">{label}:</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 line-through decoration-red-400">{oldVal || 0}</span>
          <span className="text-gray-400">→</span>
          <span className="font-bold text-gray-900">{newVal || 0}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Price Change History</h1>
      <p className="text-gray-500 mb-6">Showing the last 50 updates made to the system.</p>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changes Made</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="3" className="p-6 text-center">Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="3" className="p-6 text-center text-gray-500">No history found.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap align-top">
                    {formatDate(log.changed_at)}
                  </td>
                  <td className="px-6 py-4 text-sm align-top">
                    <div className="font-bold text-gray-900">
                      {log.products?.brands?.name} {log.products?.car_model}
                    </div>
                    <div className="text-xs text-gray-500">
                      {log.products?.product_variant}
                    </div>
                    <div className="mt-1 inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {log.products?.position}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top w-1/3 bg-gray-50/50">
                    {/* Render specific changes */}
                    {renderChange('Retail', log.old_prices?.price_retail, log.new_prices?.price_retail)}
                    {renderChange('Distributor', log.old_prices?.price_distributor, log.new_prices?.price_distributor)}
                    {renderChange('Agent', log.old_prices?.price_agent, log.new_prices?.price_agent)}
                    {renderChange('Workshop', log.old_prices?.price_workshop, log.new_prices?.price_workshop)}
                    {renderChange('Online', log.old_prices?.price_online, log.new_prices?.price_online)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}