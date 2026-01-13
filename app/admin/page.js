export default function AdminDashboard() {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Welcome, Admin</h1>
      <p className="text-gray-600">
        Select an option from the sidebar to manage your inventory and prices.
      </p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-bold text-blue-800">Quick Tip</h3>
          <p className="text-sm text-blue-600">Always add Brands first, then Products, then Prices.</p>
        </div>
      </div>
    </div>
  )
}