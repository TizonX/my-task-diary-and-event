import prisma from '../../lib/prisma'

export async function upsertTelegramUser({ telegramId, username, firstName, lastName }) {
  return prisma.telegramUser.upsert({
    where: { telegramId },
    create: { telegramId, username, firstName, lastName },
    update: { username, firstName, lastName }
  })
}

export async function findByTelegramId(telegramId) {
  return prisma.telegramUser.findUnique({ where: { telegramId } })
}
