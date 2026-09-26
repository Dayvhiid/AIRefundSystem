import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { createError } from '../middleware/errorHandler'

const router = Router()

router.get('/', async (_req, res) => {
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })
  res.json(customers)
})

router.get('/:id/orders', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } })
    if (!customer) {
      throw createError(404, 'CUSTOMER_NOT_FOUND', 'No customer found with the given ID.')
    }

    const orders = await prisma.order.findMany({
      where: { customerId: req.params.id },
      select: {
        id: true,
        item: true,
        amount: true,
        orderDate: true,
        status: true,
        finalSale: true,
      },
      orderBy: { orderDate: 'desc' },
    })

    const formatted = orders.map(o => ({
      ...o,
      amount: Number(o.amount),
      orderDate: o.orderDate.toISOString(),
    }))

    res.json(formatted)
  } catch (err) {
    next(err)
  }
})

export default router
