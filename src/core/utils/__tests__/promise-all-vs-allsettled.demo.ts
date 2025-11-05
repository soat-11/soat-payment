/**
 * DEMO: Por que Promise.all não funciona em transações
 *
 * Execute este arquivo para ver a diferença entre Promise.all e Promise.allSettled
 */

async function slowSuccess(name: string, delay: number): Promise<string> {
  console.log(`[${Date.now()}] ${name}: INICIOU`);
  await new Promise((resolve) => setTimeout(resolve, delay));
  console.log(`[${Date.now()}] ${name}: COMPLETOU ✅`);
  return name;
}

async function fastFailure(name: string, delay: number): Promise<string> {
  console.log(`[${Date.now()}] ${name}: INICIOU`);
  await new Promise((resolve) => setTimeout(resolve, delay));
  console.log(`[${Date.now()}] ${name}: FALHOU ❌`);
  throw new Error(`${name} failed`);
}

async function simulateRollback() {
  console.log(`[${Date.now()}] 🔄 ROLLBACK INICIADO`);
  await new Promise((resolve) => setTimeout(resolve, 10));
  console.log(`[${Date.now()}] 🔄 ROLLBACK COMPLETADO (transação encerrada)`);
}

console.log('\n=== DEMO 1: Promise.all (PROBLEMA) ===\n');

async function demoPromiseAll() {
  try {
    await Promise.all([
      slowSuccess('save(payment)', 50),
      fastFailure('save(detail)', 10),
    ]);
  } catch (error) {
    console.log(`[${Date.now()}] ⚠️  ERRO CAPTURADO no catch`);
    await simulateRollback();
    console.log(
      `[${Date.now()}] ❌ PROBLEMA: save(payment) pode completar APÓS rollback!`,
    );
  }
}

console.log('\n=== DEMO 2: Promise.allSettled (CORRETO) ===\n');

async function demoPromiseAllSettled() {
  try {
    await Promise.allSettled([
      slowSuccess('save(payment)', 50),
      fastFailure('save(detail)', 10),
    ]).then((results) => {
      const rejected = results.find((r) => r.status === 'rejected');
      if (rejected && rejected.status === 'rejected') {
        throw rejected.reason;
      }
    });
  } catch (error) {
    console.log(`[${Date.now()}] ⚠️  ERRO CAPTURADO no catch`);
    console.log(
      `[${Date.now()}] ✅ GARANTIDO: Todas as operações já terminaram`,
    );
    await simulateRollback();
  }
}

// Execução
(async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('OBSERVAÇÃO: Note a ORDEM dos logs e quando o rollback acontece');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await demoPromiseAll();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Espera um pouco para separar as demos
  await new Promise((resolve) => setTimeout(resolve, 100));

  await demoPromiseAllSettled();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
})();



