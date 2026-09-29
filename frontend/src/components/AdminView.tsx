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

  const badgeStyles = {
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    denied: 'bg-red-50 text-red-700 ring-red-600/20',
    escalated: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  }

  const filters = [
    { value: '', label: 'All' },
    { value: 'approved', label: 'Approved' },
    { value: 'denied', label: 'Denied' },
    { value: 'escalated', label: 'Escalated' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Review and manage refund requests.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          connected
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
            : 'bg-gray-100 text-gray-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          {connected ? 'Live' : 'Disconnected'}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === f.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-400">
          {filtered.length} request{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Decision</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(r => (
              <tr
                key={r.id}
                onClick={() => handleRowClick(r.id)}
                className="hover:bg-gray-50/50 cursor-pointer transition-colors duration-150"
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{r.customerName}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{r.orderItem}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">${r.amount}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${badgeStyles[r.decision]}`}>
                      {r.decision}
                    </span>
                    {r.flags.length > 0 && (
                      <span className="text-xs text-gray-400" title={r.flags.join(', ')}>
                        {r.flags.length} flag{r.flags.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {r.decision !== 'approved' && (
                      <button
                        onClick={(e) => handleDecision(r.id, 'approved', e)}
                        disabled={updatingId === r.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors ring-1 ring-inset ring-emerald-600/20"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </button>
                    )}
                    {r.decision !== 'denied' && (
                      <button
                        onClick={(e) => handleDecision(r.id, 'denied', e)}
                        disabled={updatingId === r.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors ring-1 ring-inset ring-red-600/20"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Deny
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">No refund requests yet</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
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
