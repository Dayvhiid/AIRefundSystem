import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import CustomerView from './components/CustomerView'
import AdminView from './components/AdminView'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-indigo-600">
              ShopNow Refunds
            </Link>
            <div className="flex gap-4">
              <Link to="/" className="text-sm text-gray-600 hover:text-indigo-600">
                Customer
              </Link>
              <Link to="/admin" className="text-sm text-gray-600 hover:text-indigo-600">
                Admin Dashboard
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<CustomerView />} />
            <Route path="/admin" element={<AdminView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
