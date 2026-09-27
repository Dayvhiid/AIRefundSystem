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

  const badgeColor = {
    approved: 'bg-green-100 text-green-800',
    denied: 'bg-red-100 text-red-800',
    escalated: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Refund Request Detail</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            &times;
          </button>
        </div>

        {loading && (
          <div className="p-6 text-center text-gray-400">Loading...</div>
        )}

        {localDetail && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${badgeColor[localDetail.decision]}`}>
                {localDetail.decision}
              </span>
              {localDetail.flags.length > 0 && (
                <span className="text-sm text-red-600">
                  {localDetail.flags.length} flag{localDetail.flags.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {localDetail.decision !== 'approved' && (
                <button
                  onClick={() => handleDecision('approved')}
                  disabled={updating}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {updating ? 'Updating...' : 'Approve'}
                </button>
              )}
              {localDetail.decision !== 'denied' && (
                <button
                  onClick={() => handleDecision('denied')}
                  disabled={updating}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {updating ? 'Updating...' : 'Deny'}
                </button>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-500">Customer:</span>{' '}
                {localDetail.customer?.name || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-500">Order Item:</span>{' '}
                {localDetail.order?.item || localDetail.orderItem || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-500">Amount:</span>{' '}
                ${localDetail.order?.amount || localDetail.amount || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-500">Final Sale:</span>{' '}
                {localDetail.order?.finalSale ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium text-gray-500">Submitted:</span>{' '}
                {new Date(localDetail.createdAt).toLocaleString()}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-500 text-sm mb-1">Customer Message</h3>
              <p className="bg-gray-50 rounded-lg p-3 text-sm">
                {localDetail.customerMessage || 'N/A'}
              </p>
            </div>

            {localDetail.aiConfidence != null && (
              <div>
                <h3 className="font-medium text-gray-500 text-sm mb-1">AI Confidence</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${Math.round(localDetail.aiConfidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(localDetail.aiConfidence * 100)}%
                  </span>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium text-gray-500 text-sm mb-1">Reasoning</h3>
              <p className="bg-gray-50 rounded-lg p-3 text-sm leading-relaxed">
                {localDetail.reasoning}
              </p>
            </div>

            {localDetail.policyRulesApplied && localDetail.policyRulesApplied.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-500 text-sm mb-2">Policy Rules Applied</h3>
                <ul className="space-y-1">
                  {localDetail.policyRulesApplied.map((rule, i) => (
                    <li key={i} className="text-sm bg-indigo-50 text-indigo-800 rounded px-3 py-1">
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {localDetail.flags.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-500 text-sm mb-2">Flags</h3>
                <ul className="space-y-1">
                  {localDetail.flags.map((flag, i) => (
                    <li key={i} className="text-sm bg-red-50 text-red-800 rounded px-3 py-1">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
