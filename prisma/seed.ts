import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏕️ Iniciando o acampamento (Seed)...');

  const adminEmail = 'admin@geamizade.org.br';

  // 1. Verifica se o admin já existe para evitar erros de duplicação ao rodar o seed várias vezes
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ O usuário Admin já está registrado na secretaria. Nenhuma ação necessária.');
    return;
  }

  // 2. Criptografa a senha de teste (senha123)
  // O número 10 é o "salt rounds", um padrão seguro para o bcrypt
  const hashedPassword = await bcrypt.hash('senha123', 10);

  // 3. Cria o usuário Admin no banco
  const admin = await prisma.user.create({
    data: {
      name: 'Gustavo (Admin)',
      email: adminEmail,
      password: hashedPassword, // Salvamos o Hash, nunca a senha em texto limpo!
      role: 'ADMIN',
      branch: 'DIRETORIA', // Seguindo o seu Enum para membros fora de tropa ativa
    },
  });

  console.log('🔥 Fogo de conselho aceso! Usuário criado com sucesso:');
  console.log(`📧 E-mail: ${admin.email}`);
  console.log(`🔑 Senha: senha123`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao plantar a semente:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Desconecta o Prisma ao terminar
    await prisma.$disconnect();
  });