import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.plan.count();
  if (existing > 0) {
    console.log('Plans already seeded, skipping.');
    return;
  }

  await prisma.plan.createMany({
    data: [
      {
        name: 'Básico',
        description: 'Ideal para pequeños equipos que empiezan',
        priceArs: 9999,
        features: JSON.stringify([
          '1 sesión de WhatsApp',
          'Hasta 3 empleados',
          '500 mensajes por mes',
          'Soporte por email',
        ]),
        sortOrder: 1,
      },
      {
        name: 'Pro',
        description: 'Para equipos en crecimiento con mayor volumen',
        priceArs: 24999,
        features: JSON.stringify([
          '5 sesiones de WhatsApp',
          'Empleados ilimitados',
          'Mensajes ilimitados',
          'Soporte prioritario',
          'Acceso a API',
        ]),
        sortOrder: 2,
      },
    ],
  });

  console.log('Plans seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
