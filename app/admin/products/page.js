'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ManageProducts() {
  // Data State
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Smart Suggestions State
  const [suggestions, setSuggestions] = useState({
    makes: [],
    models: [],
    variants: []
  })

  // Form State
  const [formData, setFormData] = useState({
    brand_id: '',
    car_make: '',
    car_model: '',
    product_variant: '', 
    category: 'Shock Absorber',
    position: 'Front (2 pcs)',
    part_number: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    // 1. Get Brands
    const { data: brandData } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true })
    if (brandData) setBrands(brandData)

    // 2. Get Products (to build the list and suggestions)
    const { data: productData, error } = await supabase
      .from('products')
      .select(`*, brands (name)`)
      .order('created_at', { ascending: false })

    if (error) console.error('Error:', error)
    else {
      setProducts(productData || [])
      extractSuggestions(productData || [])
    }
    
    setLoading(false)
  }

  // LOGIC: Extract unique Makes, Models, and Variants from existing data
  const extractSuggestions = (data) => {
    // 1. Get Unique Makes
    const uniqueMakes = [...new Set(data.map(p => p.car_make))].sort()
    
    // 2. Get Unique Models
    const uniqueModels = [...new Set(data.map(p => p.car_model))].sort()

    // 3. Get Unique Variants (Standard, Heavy Duty, Sport, etc.)
    const uniqueVariants = [...new Set(data.map(p => p.product_variant))].sort()

    setSuggestions({
      makes: uniqueMakes,
      models: uniqueModels,
      variants: uniqueVariants
    })
  }

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value
    let newPosition = 'Front (2 pcs)' 

    if (newCategory === 'Coil Spring') {
      newPosition = 'Carset (4 pcs)'
    }

    setFormData({
      ...formData,
      category: newCategory,
      position: newPosition
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    // Trim whitespace to ensure "City " equals "City"
    const cleanData = {
      ...formData,
      car_make: formData.car_make.trim(),
      car_model: formData.car_model.trim(),
      product_variant: formData.product_variant.trim()
    }

    const { error } = await supabase.from('products').insert([cleanData])

    if (error) {
      alert('Error adding product: ' + error.message)
    } else {
      // Keep some fields for faster entry
      setFormData({
        ...formData,
        position: 'Front (2 pcs)', 
        part_number: ''
      })
      fetchData() 
    }
    setSubmitting(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id) 
    if (error) alert(error.message)
    else fetchData()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Products</h1>

      {/* Add Product Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Add New Product</h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Row 1 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
            <select 
              value={formData.brand_id}
              onChange={(e) => setFormData({...formData, brand_id: e.target.value})}
              className="w-full rounded border-gray-300 p-2 text-sm text-black"
              required
            >
              <option value="">-- Select Brand --</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Car Make</label>
            <input 
              type="text" 
              list="makes-list" // Connect to datalist
              placeholder="e.g. Honda"
              value={formData.car_make}
              onChange={(e) => setFormData({...formData, car_make: e.target.value})}
              className="w-full rounded border-gray-300 p-2 text-sm text-black"
              required 
            />
            {/* The Smart List */}
            <datalist id="makes-list">
              {suggestions.makes.map(item => <option key={item} value={item} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Car Model</label>
            <input 
              type="text" 
              list="models-list" // Connect to datalist
              placeholder="e.g. City"
              value={formData.car_model}
              onChange={(e) => setFormData({...formData, car_model: e.target.value})}
              className="w-full rounded border-gray-300 p-2 text-sm text-black"
              required 
            />
            {/* The Smart List */}
            <datalist id="models-list">
              {suggestions.models.map(item => <option key={item} value={item} />)}
            </datalist>
          </div>

          {/* Row 2 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Product Variant</label>
            <input 
              type="text" 
              list="variants-list" // Connect to datalist
              placeholder="e.g. Standard / Heavy Duty"
              value={formData.product_variant}
              onChange={(e) => setFormData({...formData, product_variant: e.target.value})}
              className="w-full rounded border-gray-300 p-2 text-sm text-black"
              required 
            />
            {/* The Smart List */}
            <datalist id="variants-list">
              {suggestions.variants.map(item => <option key={item} value={item} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select 
              value={formData.category}
              onChange={handleCategoryChange}
              className="w-full rounded border-gray-300 p-2 text-sm text-black"
            >
              <option value="Shock Absorber">Shock Absorber</option>
              <option value="Coil Spring">Coil Spring</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Position</label>
            <select 
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              className="w-full rounded border-gray-300 p-2 text-sm text-black"
            >
              {formData.category === 'Shock Absorber' ? (
                <>
                  <option value="Front (2 pcs)">Front (2 pcs)</option>
                  <option value="Rear (2 pcs)">Rear (2 pcs)</option>
                  <option value="Full Set (4 pcs)">Full Set (4 pcs)</option>
                </>
              ) : (
                <option value="Carset (4 pcs)">Carset (4 pcs)</option>
              )}
            </select>
          </div>

          {/* Row 3 */}
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Part Number (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. 333000 / 341000"
              value={formData.part_number}
              onChange={(e) => setFormData({...formData, part_number: e.target.value})}
              className="w-full rounded border-gray-300 p-2 text-sm text-black"
            />
          </div>

          <div className="md:col-span-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {submitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>

        </form>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="p-6 text-center">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-gray-500">No products yet.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {p.brands?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="font-medium text-gray-900">{p.car_make} {p.car_model}</div>
                    <div className="text-xs">{p.product_variant}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${p.category === 'Coil Spring' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {p.category}
                    </span>
                    <div className="mt-1 text-xs text-gray-500">{p.position}</div>
                    {p.part_number && <div className="text-xs text-gray-400 font-mono">PN: {p.part_number}</div>}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
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