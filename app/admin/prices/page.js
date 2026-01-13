'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ManagePrices() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal State
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)
  const [saving, setSaving] = useState(false)

  // Price Form State
  const [prices, setPrices] = useState({
    price_distributor: 0,
    price_agent: 0,
    price_workshop: 0,
    price_retail: 0,
    price_online: 0
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    // Fetch products AND their current prices
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        brands (name),
        prices (*)
      `)
      .order('brand_id', { ascending: true })

    if (error) {
      console.error('Error fetching data:', error)
    } else {
      console.log('Fetched Data:', data) // Debugging: Check Console if needed
      setProducts(data || [])
    }
    
    setLoading(false)
  }

  // Helper to extract price object safely
  const getPriceObj = (product) => {
    if (!product.prices) return null
    if (Array.isArray(product.prices)) {
      return product.prices.length > 0 ? product.prices[0] : null
    }
    return product.prices // It's already an object
  }

  const openEditModal = (product) => {
    setCurrentProduct(product)
    
    const currentPriceObj = getPriceObj(product) || {}

    setPrices({
      price_distributor: currentPriceObj.price_distributor || 0,
      price_agent: currentPriceObj.price_agent || 0,
      price_workshop: currentPriceObj.price_workshop || 0,
      price_retail: currentPriceObj.price_retail || 0,
      price_online: currentPriceObj.price_online || 0
    })
    
    setIsEditing(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const productId = currentProduct.id
    const oldPrices = getPriceObj(currentProduct) || {}

    // Upsert prices
    const { data: newPriceData, error: priceError } = await supabase
      .from('prices')
      .upsert(
        { 
          product_id: productId,
          ...prices,
          updated_at: new Date()
        },
        { onConflict: 'product_id' }
      )
      .select()
      .single()

    if (priceError) {
      alert('Error saving prices: ' + priceError.message)
      setSaving(false)
      return
    }

    // Log History
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('price_history').insert({
      product_id: productId,
      changed_by: session?.user?.id,
      old_prices: oldPrices,
      new_prices: newPriceData
    })

    setIsEditing(false)
    setSaving(false)
    fetchProducts()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Prices</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Retail</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="4" className="p-6 text-center">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="4" className="p-6 text-center text-gray-500">No products found.</td></tr>
            ) : (
              products.map((p) => {
                const priceObj = getPriceObj(p)
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{p.brands?.name}</div>
                      <div className="text-sm text-gray-600">{p.car_make} {p.car_model}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{p.product_variant}</div>
                      <div className="text-xs text-blue-600">{p.position}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono font-medium text-gray-900">
                      {priceObj ? `RM ${priceObj.price_retail}` : 'Not Set'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(p)}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                      >
                        Update Prices
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Update Prices
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700">Distributor</label>
                  <input type="number" step="0.01" value={prices.price_distributor} onChange={e=>setPrices({...prices, price_distributor: e.target.value})} className="w-full border rounded p-2 text-black" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700">Agent</label>
                  <input type="number" step="0.01" value={prices.price_agent} onChange={e=>setPrices({...prices, price_agent: e.target.value})} className="w-full border rounded p-2 text-black" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700">Workshop</label>
                  <input type="number" step="0.01" value={prices.price_workshop} onChange={e=>setPrices({...prices, price_workshop: e.target.value})} className="w-full border rounded p-2 text-black" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700">Online</label>
                  <input type="number" step="0.01" value={prices.price_online} onChange={e=>setPrices({...prices, price_online: e.target.value})} className="w-full border rounded p-2 text-black" />
                </div>
                <div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                  <label className="block text-xs font-bold text-yellow-800">Retail (RRP)</label>
                  <input type="number" step="0.01" value={prices.price_retail} onChange={e=>setPrices({...prices, price_retail: e.target.value})} className="w-full border border-yellow-400 rounded p-2 font-bold text-black" required />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700">{saving ? 'Saving...' : 'Confirm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}