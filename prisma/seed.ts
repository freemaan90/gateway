import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const plans = [
  {
    name: 'Gratis',
    description: 'Para empezar sin costo',
    priceArs: 0,
    isFree: true,
    features: JSON.stringify(['1 sesión de WhatsApp', 'Hasta 2 empleados']),
    sortOrder: 0,
  },
  {
    name: 'Básico',
    description: 'Ideal para pequeños equipos que empiezan',
    priceArs: 50000,
    isFree: false,
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
    priceArs: 125000,
    isFree: false,
    features: JSON.stringify([
      '5 sesiones de WhatsApp',
      'Empleados ilimitados',
      'Mensajes ilimitados',
      'Soporte prioritario',
      'Acceso a API',
    ]),
    sortOrder: 2,
  },
];

async function main() {
  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (existing) {
      await prisma.plan.update({ where: { id: existing.id }, data: plan });
      console.log(`Updated plan: ${plan.name}`);
    } else {
      await prisma.plan.create({ data: plan });
      console.log(`Created plan: ${plan.name}`);
    }
  }
  console.log('Plans seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
