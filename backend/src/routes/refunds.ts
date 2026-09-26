import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { createError } from '../middleware/errorHandler'
import { evaluatePolicy } from '../services/policyEngine'
import { callAIAndMerge } from '../services/aiOrchestration'
import { broadcastNewRequest } from '../lib/sse'

const router = Router()

const submitSchema = z.object({
  orderId: z.string().uuid(),
  customerMessage: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
})

router.post('/', async (req, res, next) => {
  try {
    const parsed = submitSchema.safeParse(req.body)
    if (!parsed.success) {
      throw createError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message)
    }

    const { orderId, customerMessage } = parsed.data

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    })
    if (!order) {
      throw createError(404, 'ORDER_NOT_FOUND', 'No order found with the given ID.')
    }

    const policyResult = evaluatePolicy(
      {
        amount: Number(order.amount),
        orderDate: order.orderDate,
        finalSale: order.finalSale,
        status: order.status,
      },
      customerMessage
    )

    let finalDecision: string
    let reasoning: string
    let flags: string[]
    let policyRulesApplied: string[]
    let aiConfidence: number | null = null

    if (policyResult.needsAI) {
      const aiResult = await callAIAndMerge(
        policyResult,
        {
          item: order.item,
          amount: Number(order.amount),
          orderDate: order.orderDate.toISOString(),
          finalSale: order.finalSale,
          status: order.status,
          customerName: order.customer.name,
        },
        customerMessage
      )
      if (aiResult.flags.includes('ai_response_invalid')) {
        finalDecision = policyResult.decision
        reasoning = policyResult.reasoning || 'This request meets the standard refund criteria.'
        flags = policyResult.flags
        policyRulesApplied = policyResult.rulesApplied
      } else {
        finalDecision = aiResult.decision
        reasoning = aiResult.reasoning
        flags = aiResult.flags
        policyRulesApplied = aiResult.policyRulesApplied
        aiConfidence = aiResult.confidence
      }
    } else {
      finalDecision = policyResult.decision
      reasoning = policyResult.reasoning
      flags = policyResult.flags
      policyRulesApplied = policyResult.rulesApplied
    }

    const refundRequest = await prisma.refundRequest.create({
      data: {
        orderId,
        customerMessage,
        decision: finalDecision,
        reasoning,
        flags,
        policyRulesApplied,
        aiConfidence,
      },
    })

    await broadcastNewRequest()

    res.status(201).json({
      id: refundRequest.id,
      decision: refundRequest.decision,
      reasoning: refundRequest.reasoning,
      flags: refundRequest.flags,
      createdAt: refundRequest.createdAt.toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query
    const where = status ? { decision: status as string } : {}

    const requests = await prisma.refundRequest.findMany({
      where,
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
      flags: r.flags,
      createdAt: r.createdAt.toISOString(),
    }))

    res.json(formatted)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const request = await prisma.refundRequest.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: { customer: true },
        },
      },
    })

    if (!request) {
      throw createError(404, 'REQUEST_NOT_FOUND', 'No refund request found with the given ID.')
    }

    res.json({
      id: request.id,
      customer: {
        id: request.order.customer.id,
        name: request.order.customer.name,
      },
      order: {
        id: request.order.id,
        item: request.order.item,
        amount: Number(request.order.amount),
        finalSale: request.order.finalSale,
      },
      customerMessage: request.customerMessage,
      decision: request.decision,
      reasoning: request.reasoning,
      policyRulesApplied: request.policyRulesApplied,
      aiConfidence: request.aiConfidence,
      flags: request.flags,
      createdAt: request.createdAt.toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

export default router
