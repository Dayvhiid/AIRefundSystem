import { useState, useEffect } from 'react'
import {
  fetchCustomers,
  fetchOrders,
  submitRefundRequest,
  type Customer,
  type Order,
  type RefundRequest,
} from '../lib/api'

export default function CustomerView() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<RefundRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCustomers().then(setCustomers).catch(() => setError('Failed to load customers'))
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchOrders(selectedCustomer.id)
        .then(setOrders)
        .catch(() => setError('Failed to load orders'))
      setSelectedOrder(null)
      setResult(null)
    }
  }, [selectedCustomer])

  const handleSubmit = async () => {
    if (!selectedOrder || !message.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await submitRefundRequest(selectedOrder.id, message.trim())
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const decisionStyles = {
    approved: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    denied: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700',
      icon: (
        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    escalated: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900">Submit a Refund Request</h1>
          <p className="mt-1 text-sm text-gray-500">Select your order and describe the issue below.</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer</label>
            <select
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              value={selectedCustomer?.id || ''}
              onChange={e => {
                const c = customers.find(c => c.id === e.target.value)
                setSelectedCustomer(c || null)
              }}
            >
              <option value="">Choose a customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Order Select */}
          {selectedCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Order</label>
              <select
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={selectedOrder?.id || ''}
                onChange={e => {
                  const o = orders.find(o => o.id === e.target.value)
                  setSelectedOrder(o || null)
                }}
              >
                <option value="">Choose an order...</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.item} — ${o.amount} ({o.finalSale ? 'Final Sale' : o.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Order Details Card */}
          {selectedOrder && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Item</span>
                  <p className="font-medium text-gray-900 mt-0.5">{selectedOrder.item}</p>
                </div>
                <div>
                  <span className="text-gray-500">Amount</span>
                  <p className="font-medium text-gray-900 mt-0.5">${selectedOrder.amount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Date</span>
                  <p className="font-medium text-gray-900 mt-0.5">{new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <p className="font-medium text-gray-900 mt-0.5">{selectedOrder.status}</p>
                </div>
              </div>
              {selectedOrder.finalSale && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    This item is marked as Final Sale
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {selectedOrder && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Describe your issue
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                rows={4}
                maxLength={2000}
                placeholder="e.g. My headphones arrived with a cracked casing..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-gray-400 text-right">{message.length}/2000</p>
            </div>
          )}

          {/* Submit Button */}
          {selectedOrder && (
            <button
              onClick={handleSubmit}
              disabled={loading || !message.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Submit Request'
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-5 ${decisionStyles[result.decision].bg} ${decisionStyles[result.decision].border}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-1.5 rounded-lg ${decisionStyles[result.decision].badge}`}>
                  {decisionStyles[result.decision].icon}
                </div>
                <span className={`text-sm font-semibold uppercase tracking-wide ${decisionStyles[result.decision].badge.split(' ')[1]}`}>
                  {result.decision}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{result.reasoning}</p>
              {result.flags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200/60">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Flags:</span> {result.flags.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
