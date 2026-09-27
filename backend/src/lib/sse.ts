import { Response } from 'express'
import { prisma } from './prisma'

const clients = new Set<Response>()

export function addClient(res: Response) {
  clients.add(res)

  res.on('close', () => {
    clients.delete(res)
  })
}

export async function broadcastNewRequest() {
  const requests = await prisma.refundRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        include: { customer: true },
      },
    },
  })

  const formatted = requests.map(r => ({
    id: r.id,
    customerName: r.order.customer.name,
    orderItem: r.order.item,
    amount: Number(r.order.amount),
    decision: r.decision,
    reasoning: r.reasoning,
    flags: r.flags,
    createdAt: r.createdAt.toISOString(),
  }))

  const payload = `data: ${JSON.stringify({ type: 'new_request', requests: formatted })}\n\n`

  for (const client of clients) {
    try {
      client.write(payload)
    } catch {
      clients.delete(client)
    }
  }
}

export async function broadcastUpdate(request: Record<string, unknown>) {
  const payload = `data: ${JSON.stringify({ type: 'update_request', request })}\n\n`

  for (const client of clients) {
    try {
      client.write(payload)
    } catch {
      clients.delete(client)
    }
  }
}

export async function sendInitialData(res: Response) {
  const requests = await prisma.refundRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        include: { customer: true },
      },
    },
  })

  const formatted = requests.map(r => ({
    id: r.id,
    customerName: r.order.customer.name,
    orderItem: r.order.item,
    amount: Number(r.order.amount),
    decision: r.decision,
    reasoning: r.reasoning,
    flags: r.flags,
    createdAt: r.createdAt.toISOString(),
  }))

  res.write(`data: ${JSON.stringify({ type: 'init', requests: formatted })}\n\n`)
}
