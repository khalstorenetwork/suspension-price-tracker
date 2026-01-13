'use client'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Link from 'next/link'

export default function PublicHomepage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({})
  const [viewMode, setViewMode] = useState('customer') // 'customer' or 'brand'
  
  // Data State
  const [rawProducts, setRawProducts] = useState([])
  const [groupedData, setGroupedData] = useState([])
  const [activeBrands, setActiveBrands] = useState([])
  
  // Search State
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPublicData()
  }, [])

  const fetchPublicData = async () => {
    setLoading(true)
    
    // 1. Get Visibility Settings
    const { data: settingsData } = await supabase.from('app_settings').select('*')
    const settingsMap = {}
    if (settingsData) {
      settingsData.forEach(s => settingsMap[s.setting_key] = s.is_visible)
    }
    setSettings(settingsMap)

    // 2. Get All Data
    const { data: productData, error } = await supabase
      .from('products')
      .select(`*, brands (name), prices (*)`)
      .order('car_make', { ascending: true })
      .order('car_model', { ascending: true })
      .order('position', { ascending: true })

    if (error) console.error('Error:', error)
    else {
      setRawProducts(productData || [])
      processData(productData || [], '')
    }
    
    setLoading(false)
  }

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase()
    setSearch(query)
    processData(rawProducts, query)
  }

  const processData = (products, query) => {
    // Filter
    const filtered = products.filter(p => 
      p.car_make.toLowerCase().includes(query) ||
      p.car_model.toLowerCase().includes(query) ||
      p.brands.name.toLowerCase().includes(query) ||
      (p.part_number && p.part_number.toLowerCase().includes(query))
    )

    // Extract Brands
    const uniqueBrandNames = [...new Set(filtered.map(p => p.brands.name))].sort()
    setActiveBrands(uniqueBrandNames)

    // Group Data
    const groups = {}
    filtered.forEach(p => {
      const rowKey = `${p.car_make}|${p.car_model}|${p.product_variant}|${p.position}|${p.category}`
      if (!groups[rowKey]) {
        groups[rowKey] = {
          key: rowKey,
          car_make: p.car_make,
          car_model: p.car_model,
          product_variant: p.product_variant,
          position: p.position,
          category: p.category,
          pricesByBrand: {}
        }
      }
      const priceObj = (p.prices && p.prices.length > 0) ? p.prices[0] : null
      groups[rowKey].pricesByBrand[p.brands.name] = priceObj
    })
    setGroupedData(Object.values(groups))
  }

  // Define which columns are visible based on Admin Settings
  const getVisibleTiers = () => {
    const tiers = []
    if (settings.show_distributor) tiers.push({ key: 'price_distributor', label: 'Distributor', color: 'bg-slate-600' })
    if (settings.show_agent) tiers.push({ key: 'price_agent', label: 'Agent', color: 'bg-slate-600' })
    if (settings.show_workshop) tiers.push({ key: 'price_workshop', label: 'Workshop', color: 'bg-slate-600' })
    if (settings.show_retail) tiers.push({ key: 'price_retail', label: 'Retail', color: 'bg-yellow-600' })
    if (settings.show_online) tiers.push({ key: 'price_online', label: 'Online', color: 'bg-blue-600' })
    return tiers
  }

  const visibleTiers = getVisibleTiers()

  // Helper to render a price cell
  const renderPriceCell = (row, brandName, tierKey) => {
    const cellKey = `${row.key}-${brandName}-${tierKey}`
    const priceData = row.pricesByBrand[brandName]
    
    if (!priceData) return <td key={cellKey} className="px-2 py-4 text-center text-gray-300 bg-gray-50/30">-</td>
    
    const val = priceData[tierKey]
    if (!val || val === 0) return <td key={cellKey} className="px-2 py-4 text-center text-gray-400">N/A</td>
    
    // Highlight Retail price slightly differently
    const isRetail = tierKey === 'price_retail'
    return (
      <td key={cellKey} className={`px-2 py-4 text-center text-sm font-medium border-r border-gray-100 ${isRetail ? 'text-gray-900 bg-yellow-50' : 'text-gray-700'}`}>
        {val}
      </td>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-[95%] mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white font-bold p-2 rounded">SP</div>
            <span className="font-bold text-xl text-gray-900 tracking-tight hidden sm:block">SuspensionPrice</span>
          </div>
          <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-blue-600">
            Admin Login
          </Link>
        </div>
      </header>

      {/* Hero & Controls */}
      <div className="bg-slate-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Compare Suspension Prices</h1>
            <div className="relative max-w-lg mx-auto mb-6">
              <input
                type="text"
                placeholder="Filter by Model (e.g. City, Saga)..."
                value={search}
                onChange={handleSearch}
                className="w-full p-3 rounded text-gray-900 shadow focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
          </div>

          {/* VIEW TOGGLE */}
          <div className="flex justify-center">
            <div className="bg-slate-800 p-1 rounded-lg inline-flex border border-slate-700">
              <button
                onClick={() => setViewMode('customer')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'customer' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Customer View (By Price Tier)
              </button>
              <button
                onClick={() => setViewMode('brand')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'brand' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Brand View (By Brand)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN MATRIX TABLE */}
      <main className="flex-1 w-full px-2 py-6 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : groupedData.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No products found matching "{search}"</div>
        ) : (
          <div className="bg-white rounded shadow border border-gray-200 overflow-x-auto pb-4">
            <table className="min-w-full divide-y divide-gray-200 border-collapse">
              <thead className="bg-gray-100">
                {/* === HEADER ROW 1 === */}
                <tr>
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase border-r border-gray-300 min-w-[200px] sticky left-0 bg-gray-100 z-20 shadow-r">
                    Model / Product
                  </th>
                  
                  {viewMode === 'customer' ? (
                    // CUSTOMER VIEW: Header 1 = Price Tiers
                    visibleTiers.map(tier => (
                      <th 
                        key={tier.key} 
                        colSpan={activeBrands.length} 
                        className={`px-4 py-2 text-center text-xs font-bold text-white border-r border-white ${tier.color}`}
                      >
                        {tier.label}
                      </th>
                    ))
                  ) : (
                    // BRAND VIEW: Header 1 = Brand Names
                    activeBrands.map(brand => (
                      <th 
                        key={brand} 
                        colSpan={visibleTiers.length} 
                        className="px-4 py-2 text-center text-xs font-bold text-white bg-slate-700 border-r border-white"
                      >
                        {brand}
                      </th>
                    ))
                  )}
                </tr>

                {/* === HEADER ROW 2 === */}
                <tr className="bg-gray-50">
                  {viewMode === 'customer' ? (
                    // CUSTOMER VIEW: Header 2 = Brand Names (Repeated)
                    visibleTiers.map(tier => 
                      activeBrands.map(brand => (
                        <th key={`${tier.key}-${brand}`} className="px-2 py-2 text-center text-[10px] font-bold text-gray-500 uppercase border-r border-gray-200 min-w-[80px]">
                          {brand}
                        </th>
                      ))
                    )
                  ) : (
                    // BRAND VIEW: Header 2 = Price Tiers (Repeated)
                    activeBrands.map(brand => 
                      visibleTiers.map(tier => (
                        <th key={`${brand}-${tier.key}`} className="px-2 py-2 text-center text-[10px] font-bold text-gray-500 uppercase border-r border-gray-200 min-w-[80px]">
                          {tier.label}
                        </th>
                      ))
                    )
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {groupedData.map((row) => (
                  <tr key={row.key} className="hover:bg-blue-50 transition-colors">
                    {/* Sticky Model Info */}
                    <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300 bg-white sticky left-0 z-10 shadow-r group-hover:bg-blue-50">
                      <div className="font-bold">{row.car_make} {row.car_model}</div>
                      <div className="text-xs text-gray-500">{row.product_variant}</div>
                      <div className="mt-1 inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">
                        {row.position}
                      </div>
                    </td>

                    {/* Data Cells */}
                    {viewMode === 'customer' ? (
                      // CUSTOMER VIEW: Loop Tiers -> Loop Brands
                      visibleTiers.map(tier => 
                        activeBrands.map(brand => renderPriceCell(row, brand, tier.key))
                      )
                    ) : (
                      // BRAND VIEW: Loop Brands -> Loop Tiers
                      activeBrands.map(brand => 
                        visibleTiers.map(tier => renderPriceCell(row, brand, tier.key))
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 mt-auto p-6 text-center text-xs text-gray-500">
        Prices are for reference only. Subject to change.
      </footer>
    </div>
  )
}