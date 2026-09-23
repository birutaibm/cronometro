import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sessions', (table: Knex.CreateTableBuilder) => {
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
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('sessions');
}
