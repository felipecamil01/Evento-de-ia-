import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('Demo@2026', 10)

  const user = await prisma.user.upsert({
    where: { email: 'demo@eventia.com' },
    update: {},
    create: {
      email: 'demo@eventia.com',
      name: 'Demo User',
      password: hashedPassword,
      events: {
        create: [
          {
            name: 'Casamento da Maria',
            type: 'WEDDING',
            guestCount: 150,
            status: 'IN_PROGRESS',
            layouts: {
              create: [
                {
                  name: 'Layout Principal',
                  elements: {
                    create: [
                      { type: 'palco', label: 'Palco Principal', x: 400, y: 50, w: 200, h: 80, layer: 'mobiliario' },
                      { type: 'pista_danca', label: 'Pista', x: 350, y: 150, w: 300, h: 200, layer: 'chao' }
                    ]
                  }
                }
              ]
            }
          },
          {
            name: 'Conferência Tech',
            type: 'CORPORATE',
            guestCount: 80,
            status: 'DRAFT',
            layouts: {
              create: [
                {
                  name: 'Layout 1',
                  elements: {
                    create: []
                  }
                }
              ]
            }
          }
        ]
      }
    }
  })

  console.log({ user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
