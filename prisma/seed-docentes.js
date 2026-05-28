const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const docentes = [
    // PRINCIPAL - NOMBRADO
    { categoria: 'PRINCIPAL',         tipo: 'NOMBRADO',   fechaIngreso: new Date('2005-03-15') },
    { categoria: 'PRINCIPAL',         tipo: 'NOMBRADO',   fechaIngreso: new Date('2008-08-01') },
    { categoria: 'PRINCIPAL',         tipo: 'NOMBRADO',   fechaIngreso: new Date('2011-04-10') },
    { categoria: 'PRINCIPAL',         tipo: 'NOMBRADO',   fechaIngreso: new Date('2003-09-22') },
    { categoria: 'PRINCIPAL',         tipo: 'NOMBRADO',   fechaIngreso: new Date('2015-01-07') },

    // PRINCIPAL - CONTRATADO
    { categoria: 'PRINCIPAL',         tipo: 'CONTRATADO', fechaIngreso: new Date('2018-03-05') },
    { categoria: 'PRINCIPAL',         tipo: 'CONTRATADO', fechaIngreso: new Date('2020-08-17') },
    { categoria: 'PRINCIPAL',         tipo: 'CONTRATADO', fechaIngreso: new Date('2022-04-01') },

    // ASOCIADO - NOMBRADO
    { categoria: 'ASOCIADO',          tipo: 'NOMBRADO',   fechaIngreso: new Date('2007-06-20') },
    { categoria: 'ASOCIADO',          tipo: 'NOMBRADO',   fechaIngreso: new Date('2010-11-03') },
    { categoria: 'ASOCIADO',          tipo: 'NOMBRADO',   fechaIngreso: new Date('2013-02-28') },
    { categoria: 'ASOCIADO',          tipo: 'NOMBRADO',   fechaIngreso: new Date('2016-07-14') },

    // ASOCIADO - CONTRATADO
    { categoria: 'ASOCIADO',          tipo: 'CONTRATADO', fechaIngreso: new Date('2019-03-11') },
    { categoria: 'ASOCIADO',          tipo: 'CONTRATADO', fechaIngreso: new Date('2021-09-06') },
    { categoria: 'ASOCIADO',          tipo: 'CONTRATADO', fechaIngreso: new Date('2023-01-23') },

    // AUXILIAR - NOMBRADO
    { categoria: 'AUXILIAR',          tipo: 'NOMBRADO',   fechaIngreso: new Date('2012-05-18') },
    { categoria: 'AUXILIAR',          tipo: 'NOMBRADO',   fechaIngreso: new Date('2014-10-09') },
    { categoria: 'AUXILIAR',          tipo: 'NOMBRADO',   fechaIngreso: new Date('2017-03-25') },

    // AUXILIAR - CONTRATADO
    { categoria: 'AUXILIAR',          tipo: 'CONTRATADO', fechaIngreso: new Date('2020-02-14') },
    { categoria: 'AUXILIAR',          tipo: 'CONTRATADO', fechaIngreso: new Date('2022-07-30') },
    { categoria: 'AUXILIAR',          tipo: 'CONTRATADO', fechaIngreso: new Date('2023-08-01') },
    { categoria: 'AUXILIAR',          tipo: 'CONTRATADO', fechaIngreso: new Date('2024-01-15') },

    // JEFE_PRACTICA - NOMBRADO (Corregido de JEFE_DE_PRACTICA)
    { categoria: 'JEFE_PRACTICA',  tipo: 'NOMBRADO',   fechaIngreso: new Date('2015-06-01') },
    { categoria: 'JEFE_PRACTICA',  tipo: 'NOMBRADO',   fechaIngreso: new Date('2018-11-12') },

    // JEFE_PRACTICA - CONTRATADO
    { categoria: 'JEFE_PRACTICA',  tipo: 'CONTRATADO', fechaIngreso: new Date('2021-04-19') },
    { categoria: 'JEFE_PRACTICA',  tipo: 'CONTRATADO', fechaIngreso: new Date('2023-03-07') },
    { categoria: 'JEFE_PRACTICA',  tipo: 'CONTRATADO', fechaIngreso: new Date('2024-08-20') },
  ];

  console.log(`🌱 Seeding ${docentes.length} docentes...`);

  let count = 1;
  for (const docente of docentes) {
    // Al crear un docente, es obligatorio crear su usuario asociado en Prisma
    await prisma.docente.create({
      data: {
        categoria: docente.categoria,
        tipo: docente.tipo,
        fechaIngreso: docente.fechaIngreso,
        usuario: {
          create: {
            email: `docente${count}_${Date.now()}@unt.edu.pe`,
            nombre: `Prof. ${docente.categoria} ${count}`,
            password: 'password123',
            rol: 'DOCENTE'
          }
        }
      }
    });
    count++;
  }

  console.log('✅ Seed de docentes completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
