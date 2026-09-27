import { useState } from 'react'
import { useSSE } from '../lib/sse'
import { fetchRefundDetail, updateRefundDecision, type RefundRequest } from '../lib/api'
import AdminDetailDrawer from './AdminDetailDrawer'

export default function AdminView() {
  const { requests, connected } = useSSE()
  const [filter, setFilter] = useState<string>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<RefundRequest | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = filter ? requests.filter(r => r.decision === filter) : requests

  const handleRowClick = async (id: string) => {
    setSelectedId(id)
    setLoadingDetail(true)
    try {
      const data = await fetchRefundDetail(id)
      setDetail(data)
    } catch {
      // ignore
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleDecision = async (id: string, decision: 'approved' | 'denied', e: React.MouseEvent) => {
    e.stopPropagation()
    setUpdatingId(id)
    try {
      await updateRefundDecision(id, decision)
      setDetail(prev => (prev && prev.id === id ? { ...prev, decision } : prev))
    } catch {
      // ignore
    } finally {
      setUpdatingId(null)
    }
  }

  const badgeColor = {
    approved: 'bg-green-100 text-green-800',
    denied: 'bg-red-100 text-red-800',
    escalated: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-500">{connected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {['', 'approved', 'denied', 'escalated'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Customer</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Item</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Amount</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Decision</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(r => (
              <tr
                key={r.id}
                onClick={() => handleRowClick(r.id)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-sm">{r.customerName}</td>
                <td className="px-4 py-3 text-sm">{r.orderItem}</td>
                <td className="px-4 py-3 text-sm">${r.amount}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor[r.decision]}`}>
                    {r.decision}
                  </span>
                  {r.flags.length > 0 && (
                    <span className="ml-2 text-xs text-red-500" title={r.flags.join(', ')}>
                      {r.flags.length} flag{r.flags.length > 1 ? 's' : ''}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {r.decision !== 'approved' && (
                    <button
                      onClick={(e) => handleDecision(r.id, 'approved', e)}
                      disabled={updatingId === r.id}
                      className="text-green-600 hover:text-green-800 font-medium mr-3 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {r.decision !== 'denied' && (
                    <button
                      onClick={(e) => handleDecision(r.id, 'denied', e)}
                      disabled={updatingId === r.id}
                      className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                    >
                      Deny
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No refund requests yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <AdminDetailDrawer
          detail={detail}
          loading={loadingDetail}
          onClose={() => {
            setSelectedId(null)
            setDetail(null)
          }}
          onUpdate={(updated) => {
            setDetail(updated)
          }}
        />
      )}
    </div>
  )
}
