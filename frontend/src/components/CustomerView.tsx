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

  const decisionColor = {
    approved: 'bg-green-100 text-green-800 border-green-200',
    denied: 'bg-red-100 text-red-800 border-red-200',
    escalated: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Submit a Refund Request</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

        {selectedCustomer && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Order</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

        {selectedOrder && (
          <div className="bg-gray-100 rounded-lg p-4 text-sm">
            <p><span className="font-medium">Item:</span> {selectedOrder.item}</p>
            <p><span className="font-medium">Amount:</span> ${selectedOrder.amount}</p>
            <p><span className="font-medium">Date:</span> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
            <p><span className="font-medium">Status:</span> {selectedOrder.status}</p>
            {selectedOrder.finalSale && (
              <p className="text-red-600 font-medium mt-1">This item is marked as Final Sale</p>
            )}
          </div>
        )}

        {selectedOrder && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe your issue
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              maxLength={2000}
              placeholder="e.g. My headphones arrived with a cracked casing..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/2000</p>
          </div>
        )}

        {selectedOrder && (
          <button
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Processing...' : 'Submit Request'}
          </button>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className={`border rounded-lg p-6 ${decisionColor[result.decision]}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl font-bold uppercase">{result.decision}</span>
            </div>
            <p className="text-sm leading-relaxed">{result.reasoning}</p>
            {result.flags.length > 0 && (
              <div className="mt-3 text-xs">
                <span className="font-medium">Flags:</span> {result.flags.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
