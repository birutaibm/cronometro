import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Cria a tabela de configurações de timer
  await knex.schema.createTable('timer_configurations', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.integer('hours').notNullable();
    table.integer('minutes').notNullable();
    table.integer('seconds').notNullable();
    table
      .datetime('created_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .datetime('updated_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  });

  // Cria a tabela de execuções de timer
  await knex.schema.createTable('timer_executions', (table) => {
    table.increments('id').primary();
    table
      .integer('configuration_id')
      .notNullable()
      .references('id')
      .inTable('timer_configurations');
    table.datetime('finish_at', { useTz: false }).notNullable();
    table.enum('status', ['RUNNING', 'FINISHED', 'CANCELLED']).notNullable().defaultTo('RUNNING');
    table.datetime('cancelled_at', { useTz: false }).nullable();
    table
      .datetime('created_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .datetime('updated_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  });

  // Migra dados existentes da tabela timers:
  // cada linha vira uma timer_configuration e uma timer_execution (status FINISHED)
  const timers = await knex('timers').select('*');
  for (const timer of timers) {
    const [configId] = await knex('timer_configurations').insert({
      title: timer.title,
      hours: timer.hours,
      minutes: timer.minutes,
      seconds: timer.seconds,
      created_at: timer.created_at,
      updated_at: timer.updated_at,
    });

    await knex('timer_executions').insert({
      id: timer.id, // preserva o id original
      configuration_id: configId,
      finish_at: timer.finish_at,
      status: 'FINISHED',
      cancelled_at: null,
      created_at: timer.created_at,
      updated_at: timer.updated_at,
    });
  }

  // Remove a tabela antiga
  await knex.schema.dropTable('timers');

  // Ajusta o sqlite_sequence de timer_executions para evitar colisão de ids
  // após inserção explícita de ids durante a migração.
  await knex.raw(`
    UPDATE sqlite_sequence
    SET seq = (SELECT MAX(id) FROM timer_executions)
    WHERE name = 'timer_executions';
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Restaura a tabela timers a partir das configurações e execuções (sem perda de dados)
  await knex.schema.createTable('timers', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.integer('hours').notNullable();
    table.integer('minutes').notNullable();
    table.integer('seconds').notNullable();
    table.datetime('finish_at', { useTz: false }).notNullable();
    table
      .datetime('created_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
    table
      .datetime('updated_at', { useTz: false })
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  });

  // Reconstitui cada timer a partir da configuração e da execução mais recente
  const rows = await knex.raw(`
    SELECT
      tc.id AS configuration_id,
      tc.title,
      tc.hours,
      tc.minutes,
      tc.seconds,
      te.finish_at,
      te.created_at,
      te.updated_at
    FROM timer_configurations tc
    INNER JOIN timer_executions te ON te.configuration_id = tc.id
    WHERE te.id = (
      SELECT MAX(te2.id) FROM timer_executions te2 WHERE te2.configuration_id = tc.id
    )
  `);

  for (const row of rows) {
    await knex('timers').insert({
      id: row.configuration_id,
      title: row.title,
      hours: row.hours,
      minutes: row.minutes,
      seconds: row.seconds,
      finish_at: row.finish_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  // Remove as tabelas novas
  await knex.schema.dropTable('timer_executions');
  await knex.schema.dropTable('timer_configurations');
}
