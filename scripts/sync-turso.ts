import { TursoService } from '../src/services/tursoService';
import { INITIAL_BUS_LINES, INITIAL_VEHICLES } from '../src/data/mockFortalezaLines';
import { FORTALEZA_TERMINALS } from '../src/data/fortalezaTerminals';

async function run() {
  console.log('🚍 Conectando ao Turso SQLite (libsql://urbano-devaro.aws-us-east-1.turso.io)...');
  const connected = await TursoService.isConnected();
  if (!connected) {
    console.error('❌ Falha na conexão com Turso.');
    process.exit(1);
  }
  console.log('✅ Conexão estabelecida com sucesso!');
  console.log(`📡 Sincronizando ${INITIAL_BUS_LINES.length} rotas, ${INITIAL_VEHICLES.length} veículos e ${FORTALEZA_TERMINALS.length} terminais...`);

  const result = await TursoService.syncRelationalData(INITIAL_BUS_LINES, INITIAL_VEHICLES, FORTALEZA_TERMINALS);
  console.log(`🎉 Sincronização concluída!`);
  console.log(`   - ${result.routesCount} rotas salvas na tabela 'routes' e 'app_kv'`);
  console.log(`   - ${result.vehiclesCount} veículos salvos na tabela 'vehicles'`);
  console.log(`   - ${FORTALEZA_TERMINALS.length} terminais salvos na tabela 'terminals'`);

  const rows = await TursoService.queryRoutesSql();
  console.log('\n📋 Rotas cadastradas no Turso SQLite:');
  console.table(
    rows.map((r: any) => ({
      Código: r.code,
      Nome: r.name,
      Origem: r.origin,
      Destino: r.destination,
      Categoria: r.category,
      Paradas_Ida: r.total_stops_ida,
      Frota: r.active_prefix,
    }))
  );
}

run().catch((err) => {
  console.error('Erro na sincronização:', err);
  process.exit(1);
});
