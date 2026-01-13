'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ManageBrands() {
  const [brands, setBrands] = useState([])
  const [newBrand, setNewBrand] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 1. Fetch brands when the page loads
  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) console.error('Error fetching brands:', error)
    else setBrands(data)
    setLoading(false)
  }

  // 2. Handle adding a new brand
  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newBrand.trim()) return

    setSubmitting(true)
    const { error } = await supabase
      .from('brands')
      .insert([{ name: newBrand.trim() }])

    if (error) {
      if (error.code === '23505') { // Unique violation code
        alert('This brand already exists.')
      } else {
        alert('Error adding brand: ' + error.message)
      }
    } else {
      setNewBrand('') // Clear input
      fetchBrands()   // Refresh list
    }
    setSubmitting(false)
  }

  // 3. Handle deleting a brand
  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? \nWARNING: This will delete ALL products listed under this brand!`)) return

    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id)

    if (error) alert('Error deleting: ' + error.message)
    else fetchBrands()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Brands</h1>

      {/* Add Brand Form */}
      <div className="bg-white p-6 rounded shadow mb-8 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Add New Brand</h2>
        <form onSubmit={handleAdd} className="flex gap-4">
          <input
            type="text"
            placeholder="e.g. KYB"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500 text-black"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {submitting ? 'Adding...' : 'Add Brand'}
          </button>
        </form>
      </div>

      {/* Brands List */}
      <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="2" className="p-6 text-center text-gray-500">Loading brands...</td></tr>
            ) : brands.length === 0 ? (
              <tr><td colSpan="2" className="p-6 text-center text-gray-500">No brands found. Add one above.</td></tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{brand.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(brand.id, brand.name)}
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