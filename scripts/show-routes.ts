import { TursoService } from '../src/services/tursoService';
import { FORTALEZA_TERMINALS } from '../src/data/fortalezaTerminals';

async function main() {
  console.log('\n========================================================================================');
  console.log('🚍 VIAÇÃO FORTALEZA - BANCO DE DADOS TURSO SQLITE');
  console.log('📡 Host: libsql://urbano-devaro.aws-us-east-1.turso.io');
  console.log('========================================================================================\n');

  const connected = await TursoService.isConnected();
  if (!connected) {
    console.error('❌ Não foi possível conectar ao banco de dados Turso.');
    process.exit(1);
  }
  console.log('✅ Status: CONECTADO COM SUCESSO AO TURSO SQLITE!\n');

  // Query terminals
  const client = TursoService.getClient();
  if (!client) {
    console.error('Cliente Turso indisponível.');
    process.exit(1);
  }

  const terminalsRes = await client.execute('SELECT code, name, neighborhood, address FROM terminals ORDER BY name ASC');
  console.log('📍 TERMINAIS DE INTEGRAÇÃO OFICIAIS (' + terminalsRes.rows.length + ' terminais):');
  console.table(
    terminalsRes.rows.map((t: any) => ({
      Sigla: t.code,
      Terminal: t.name,
      Bairro: t.neighborhood,
      Endereço: t.address,
    }))
  );

  // Query routes
  const routesRes = await client.execute('SELECT code, name, origin, destination, category, speed_limit, active_prefix, total_stops_ida FROM routes ORDER BY code ASC');
  console.log('\n🛣️  LINHAS E ROTAS CADASTRADAS NO BANCO DE DADOS (' + routesRes.rows.length + ' rotas ativas):');
  console.table(
    routesRes.rows.map((r: any) => ({
      Código: r.code,
      Linha: r.name,
      Origem: r.origin,
      Destino: r.destination,
      Tipo: r.category,
      'Vel. Max (km/h)': r.speed_limit,
      Paradas: r.total_stops_ida,
      Prefixo: r.active_prefix || '---',
    }))
  );

  // Query vehicles
  const vehRes = await client.execute('SELECT prefix, plate, model, has_ac, status, current_line_id FROM vehicles ORDER BY prefix ASC');
  console.log('\n🚌 FROTA DE VEÍCULOS VINCULADA (' + vehRes.rows.length + ' veículos):');
  console.table(
    vehRes.rows.map((v: any) => ({
      Prefixo: v.prefix,
      Placa: v.plate,
      Modelo: v.model,
      'Ar-Condicionado': v.has_ac ? 'SIM ❄️' : 'NÃO',
      Status: v.status.toUpperCase(),
      Linha: v.current_line_id || 'RESERVA',
    }))
  );

  console.log('\n💡 Dica: No terminal SQL do Turso, você pode rodar:');
  console.log('   SELECT * FROM routes;');
  console.log('   SELECT * FROM terminals;');
  console.log('   SELECT * FROM stops WHERE route_code = "028";');
  console.log('========================================================================================\n');
}

main().catch((err) => {
  console.error('Erro ao consultar rotas:', err);
  process.exit(1);
});
