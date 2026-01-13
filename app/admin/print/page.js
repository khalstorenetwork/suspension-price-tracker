'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function PrintPage() {
  const [loading, setLoading] = useState(true)
  const [groupedData, setGroupedData] = useState([])
  const [activeBrands, setActiveBrands] = useState([])
  const [rawProducts, setRawProducts] = useState([])
  
  // Controls
  const [search, setSearch] = useState('')
  const [printDate, setPrintDate] = useState('')

  useEffect(() => {
    fetchData()
    setPrintDate(new Date().toLocaleDateString('en-MY'))
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select(`*, brands (name), prices (*)`)
      .order('car_make', { ascending: true })
      .order('car_model', { ascending: true })
      .order('position', { ascending: true })

    if (error) console.error(error)
    else {
      setRawProducts(data || [])
      processData(data || [], '')
    }
    setLoading(false)
  }

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase()
    setSearch(query)
    processData(rawProducts, query)
  }

  const processData = (products, query) => {
    const filtered = products.filter(p => 
      p.car_make.toLowerCase().includes(query) ||
      p.car_model.toLowerCase().includes(query) ||
      p.brands.name.toLowerCase().includes(query)
    )

    const uniqueBrands = [...new Set(filtered.map(p => p.brands.name))].sort()
    setActiveBrands(uniqueBrands)

    const groups = {}
    filtered.forEach(p => {
      const rowKey = `${p.car_make}|${p.car_model}|${p.product_variant}|${p.position}`
      if (!groups[rowKey]) {
        groups[rowKey] = {
          key: rowKey,
          car_make: p.car_make,
          car_model: p.car_model,
          product_variant: p.product_variant,
          position: p.position,
          pricesByBrand: {}
        }
      }
      groups[rowKey].pricesByBrand[p.brands.name] = (p.prices && p.prices.length > 0) ? p.prices[0] : null
    })
    setGroupedData(Object.values(groups))
  }

  const triggerPrint = () => {
    window.print()
  }

  // Render a tiny price cell for the printed list
  const renderCell = (row, brand, field) => {
    const priceData = row.pricesByBrand[brand]
    const val = priceData ? priceData[field] : 0
    
    if (!val) return <td className="border border-gray-300 px-1 text-center text-gray-200">-</td>
    return <td className="border border-gray-300 px-1 text-center font-medium text-black">{val}</td>
  }

  return (
    <div className="bg-white min-h-screen text-black">
      {/* Controls - Hidden on Print */}
      <div className="print:hidden mb-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Print Price List</h1>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Filter (e.g. Proton)..." 
            value={search}
            onChange={handleSearch}
            className="flex-1 p-2 border rounded text-black"
          />
          <button 
            onClick={triggerPrint}
            className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
          >
            PRINT / SAVE PDF
          </button>
        </div>
        <p className="text-sm text-blue-600 mt-2">
          * Tip: In the print dialog, select "Save as PDF" and ensure "Background Graphics" is checked.
        </p>
      </div>

      {/* PRINTABLE AREA */}
      <div id="print-area">
        <div className="mb-4 flex justify-between items-end border-b-2 border-black pb-2">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">Master Price List</h1>
            <p className="text-sm text-gray-600">Generated on: {printDate}</p>
          </div>
          <div className="text-right">
            <div className="font-bold">CONFIDENTIAL</div>
            <div className="text-xs">Internal Use Only</div>
          </div>
        </div>

        {loading ? (
          <div>Generating list...</div>
        ) : (
          <table className="w-full text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200 text-black">
                <th rowSpan="2" className="border border-gray-400 px-2 py-1 text-left w-64">Model / Specification</th>
                {activeBrands.map(b => (
                  <th key={b} colSpan="2" className="border border-gray-400 px-1 py-1 text-center uppercase">{b}</th>
                ))}
              </tr>
              <tr className="bg-gray-100">
                {activeBrands.map(b => (
                  <>
                    <th key={`${b}-cost`} className="border border-gray-400 px-1 text-center w-16">Cost</th>
                    <th key={`${b}-retail`} className="border border-gray-400 px-1 text-center w-16">RRP</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedData.map(row => (
                <tr key={row.key} className="break-inside-avoid">
                  <td className="border border-gray-300 px-2 py-1">
                    <span className="font-bold">{row.car_make} {row.car_model}</span>
                    <span className="mx-2 text-gray-500">|</span>
                    {row.product_variant}
                    <div className="text-[10px] text-gray-500 font-bold uppercase">{row.position}</div>
                  </td>
                  {activeBrands.map(b => (
                    <>
                      {/* Show Distributor Cost & Retail Price Side-by-Side */}
                      {renderCell(row, b, 'price_distributor')}
                      {renderCell(row, b, 'price_retail')}
                    </>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}