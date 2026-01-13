'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function SettingsPage() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load current settings
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('id', { ascending: true })

    if (error) console.error('Error:', error)
    else setSettings(data || [])
    
    setLoading(false)
  }

  // Handle toggle change
  const handleToggle = (index) => {
    const newSettings = [...settings]
    newSettings[index].is_visible = !newSettings[index].is_visible
    setSettings(newSettings)
  }

  // Save changes to database
  const handleSave = async () => {
    setSaving(true)
    
    const { error } = await supabase
      .from('app_settings')
      .upsert(settings)

    if (error) {
      alert('Error saving settings: ' + error.message)
    } else {
      alert('Settings updated successfully!')
    }
    setSaving(false)
  }

  // Helper to make database keys look nice (e.g., 'show_distributor' -> 'Distributor Price')
  const formatLabel = (key) => {
    const words = key.replace('show_', '').split('_')
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Price'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Public Visibility Settings</h1>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Price Table Columns</h2>
        <p className="text-gray-500 mb-8 text-sm">
          Check the boxes below to display these price tiers on the public website. 
          Unchecked items will remain hidden (Admin only).
        </p>

        {loading ? (
          <div className="text-center py-4">Loading settings...</div>
        ) : (
          <div className="space-y-4">
            {settings.map((setting, index) => (
              <div 
                key={setting.id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${setting.is_visible ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
              >
                <div>
                  <div className="font-medium text-gray-900">{formatLabel(setting.setting_key)}</div>
                  <div className="text-xs text-gray-500 font-mono mt-1">{setting.setting_key}</div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={setting.is_visible} 
                    onChange={() => handleToggle(index)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {setting.is_visible ? 'Visible' : 'Hidden'}
                  </span>
                </label>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400"
          >
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}