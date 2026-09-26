import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CustomerSeed {
  name: string
  email: string
  orders: {
    item: string
    amount: number
    orderDate: Date
    status: string
    finalSale: boolean
  }[]
}

const customers: CustomerSeed[] = [
  {
    name: 'Amaka Obi',
    email: 'amaka@example.com',
    orders: [
      {
        item: 'Wireless Headphones',
        amount: 89.99,
        orderDate: daysAgo(10),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
  {
    name: 'Tunde Adebayo',
    email: 'tunde@example.com',
    orders: [
      {
        item: 'Leather Messenger Bag',
        amount: 299.00,
        orderDate: daysAgo(25),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
  {
    name: 'Fatima Hassan',
    email: 'fatima@example.com',
    orders: [
      {
        item: 'Designer Running Shoes',
        amount: 650.00,
        orderDate: daysAgo(5),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
  {
    name: 'Nneka Eze',
    email: 'nneka@example.com',
    orders: [
      {
        item: 'Programming Textbook',
        amount: 15.99,
        orderDate: daysAgo(45),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
  {
    name: 'Chidi Okoro',
    email: 'chidi@example.com',
    orders: [
      {
        item: 'Bluetooth Wireless Earbuds',
        amount: 59.99,
        orderDate: daysAgo(20),
        status: 'delivered',
        finalSale: true,
      },
    ],
  },
  {
    name: 'Ngozi Ibe',
    email: 'ngozi@example.com',
    orders: [
      {
        item: 'Laptop Sleeve 15"',
        amount: 45.00,
        orderDate: daysAgo(28),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
  {
    name: 'Emeka Nwosu',
    email: 'emeka@example.com',
    orders: [
      {
        item: 'Vintage Denim Jacket',
        amount: 120.00,
        orderDate: daysAgo(2),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
  {
    name: 'Amina Yusuf',
    email: 'amina@example.com',
    orders: [
      {
        item: 'Protective Phone Case',
        amount: 25.00,
        orderDate: daysAgo(30),
        status: 'delivered',
        finalSale: true,
      },
    ],
  },
  {
    name: 'Olumide Bankole',
    email: 'olumide@example.com',
    orders: [
      {
        item: 'Smartwatch Pro',
        amount: 499.00,
        orderDate: daysAgo(29),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
  {
    name: 'Chioma Nnamdi',
    email: 'chioma@example.com',
    orders: [
      {
        item: 'Running Shoes Elite',
        amount: 180.00,
        orderDate: daysAgo(35),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
  {
    name: 'Yemi Adekunle',
    email: 'yemi@example.com',
    orders: [
      {
        item: 'Noise Cancelling Earbuds',
        amount: 79.00,
        orderDate: daysAgo(60),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
  {
    name: 'Zainab Mohammed',
    email: 'zainab@example.com',
    orders: [
      {
        item: 'Premium Coffee Maker',
        amount: 599.00,
        orderDate: daysAgo(15),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
  {
    name: 'Kemi Adeyemi',
    email: 'kemi@example.com',
    orders: [
      {
        item: 'Modular Bookshelf Unit',
        amount: 340.00,
        orderDate: daysAgo(20),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
  {
    name: 'Tolu Akande',
    email: 'tolu@example.com',
    orders: [
      {
        item: 'Designer Sunglasses',
        amount: 95.00,
        orderDate: daysAgo(10),
        status: 'delivered',
        finalSale: true,
      },
    ],
  },
  {
    name: 'Aisha Bello',
    email: 'aisha@example.com',
    orders: [
      {
        item: 'Adjustable Tablet Stand',
        amount: 55.00,
        orderDate: daysAgo(18),
        status: 'delivered',
        finalSale: false,
      },
    ],
  },
]

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function main() {
  const count = await prisma.customer.count()
  if (count > 0) {
    console.log(`Database already seeded (${count} customers). Skipping.`)
    return
  }

  console.log('Seeding database...')

  for (const customer of customers) {
    await prisma.customer.create({
      data: {
        name: customer.name,
        email: customer.email,
        orders: {
          create: customer.orders,
        },
      },
    })
  }

  console.log(`Seeded ${customers.length} customers with orders.`)
}

main()
  .catch(e => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
