import { useState, useEffect } from 'react'
import type { RefundRequest } from '../lib/api'
import { updateRefundDecision } from '../lib/api'

interface Props {
  detail: RefundRequest | null
  loading: boolean
  onClose: () => void
  onUpdate?: (updated: RefundRequest) => void
}

export default function AdminDetailDrawer({ detail, loading, onClose, onUpdate }: Props) {
  const [updating, setUpdating] = useState(false)
  const [localDetail, setLocalDetail] = useState<RefundRequest | null>(detail)

  useEffect(() => {
    setLocalDetail(detail)
  }, [detail])

  const handleDecision = async (decision: 'approved' | 'denied') => {
    if (!localDetail) return
    setUpdating(true)
    try {
      await updateRefundDecision(localDetail.id, decision)
      const updated = {
        ...localDetail,
        decision,
        flags: [...localDetail.flags, 'admin_override'],
      }
      setLocalDetail(updated)
      onUpdate?.(updated)
    } catch {
      // ignore
    } finally {
      setUpdating(false)
    }
  }

  const badgeStyles = {
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    denied: 'bg-red-50 text-red-700 ring-red-600/20',
    escalated: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-semibold text-gray-900">Request Detail</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-12 flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Loading details...</span>
            </div>
          </div>
        )}

        {/* Content */}
        {localDetail && (
          <div className="p-6 space-y-6">
            {/* Status + Actions */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ring-1 ring-inset ${badgeStyles[localDetail.decision]}`}>
                {localDetail.decision}
              </span>
              <div className="flex items-center gap-2">
                {localDetail.flags.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {localDetail.flags.length} flag{localDetail.flags.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {localDetail.decision !== 'approved' && (
                <button
                  onClick={() => handleDecision('approved')}
                  disabled={updating}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {updating ? 'Updating...' : 'Approve'}
                </button>
              )}
              {localDetail.decision !== 'denied' && (
                <button
                  onClick={() => handleDecision('denied')}
                  disabled={updating}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {updating ? 'Updating...' : 'Deny'}
                </button>
              )}
            </div>

            {/* Order Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Customer</span>
                  <p className="font-medium text-gray-900 mt-0.5">{localDetail.customer?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Amount</span>
                  <p className="font-medium text-gray-900 mt-0.5">${localDetail.order?.amount || localDetail.amount || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Item</span>
                  <p className="font-medium text-gray-900 mt-0.5">{localDetail.order?.item || localDetail.orderItem || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Final Sale</span>
                  <p className="font-medium text-gray-900 mt-0.5">{localDetail.order?.finalSale ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500 text-sm">Submitted</span>
                <p className="font-medium text-gray-900 text-sm mt-0.5">{new Date(localDetail.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Customer Message */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer Message</h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed">
                {localDetail.customerMessage || 'N/A'}
              </p>
            </div>

            {/* AI Confidence */}
            {localDetail.aiConfidence != null && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Confidence</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(localDetail.aiConfidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-10 text-right">
                    {Math.round(localDetail.aiConfidence * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Reasoning */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reasoning</h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed">
                {localDetail.reasoning}
              </p>
            </div>

            {/* Policy Rules */}
            {localDetail.policyRulesApplied && localDetail.policyRulesApplied.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Policy Rules Applied</h3>
                <div className="space-y-1.5">
                  {localDetail.policyRulesApplied.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg px-3 py-2">
                      <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {rule}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flags */}
            {localDetail.flags.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Flags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {localDetail.flags.map((flag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-lg ring-1 ring-inset ring-red-600/20">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
