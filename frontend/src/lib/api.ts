const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export interface Customer {
  id: string
  name: string
  email: string
}

export interface Order {
  id: string
  item: string
  amount: number
  orderDate: string
  status: string
  finalSale: boolean
}

export interface RefundRequest {
  id: string
  customerName?: string
  orderItem?: string
  amount?: number
  decision: 'approved' | 'denied' | 'escalated'
  reasoning: string
  policyRulesApplied?: string[]
  aiConfidence?: number
  flags: string[]
  createdAt: string
  customer?: { id: string; name: string }
  order?: { id: string; item: string; amount: number; finalSale: boolean }
  customerMessage?: string
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_BASE}/customers`)
  if (!res.ok) throw new Error('Failed to fetch customers')
  return res.json()
}

export async function fetchOrders(customerId: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/orders`)
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

export async function submitRefundRequest(
  orderId: string,
  customerMessage: string
): Promise<RefundRequest> {
  const res = await fetch(`${API_BASE}/refund-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, customerMessage }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.message || 'Failed to submit refund request')
  }
  return res.json()
}

export async function fetchRefundRequests(status?: string): Promise<RefundRequest[]> {
  const url = status
    ? `${API_BASE}/refund-requests?status=${status}`
    : `${API_BASE}/refund-requests`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch refund requests')
  return res.json()
}

export async function fetchRefundDetail(id: string): Promise<RefundRequest> {
  const res = await fetch(`${API_BASE}/refund-requests/${id}`)
  if (!res.ok) throw new Error('Failed to fetch refund detail')
  return res.json()
}
