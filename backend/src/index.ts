import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import customersRouter from './routes/customers'
import refundsRouter from './routes/refunds'
import { errorHandler } from './middleware/errorHandler'
import { addClient, sendInitialData } from './lib/sse'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.use('/api/customers', customersRouter)
app.use('/api/refund-requests', refundsRouter)

app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })

  res.flushHeaders()

  addClient(res)
  sendInitialData(res)

  req.on('close', () => {
    // client removed via addClient's close handler
  })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
})
