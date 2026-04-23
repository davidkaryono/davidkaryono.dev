/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // 1. Table to store unique Telegram users who interact with the webhook
    .createTable('telegram_users', (table) => {
      table.increments('id').primary();
      table.bigInteger('telegram_id').unique().notNullable(); // Unique identifier from Telegram
      table.string('first_name');
      table.string('username');
      table.timestamp('created_at').defaultTo(knex.fn.now()); // Auto-record creation time
    })
    
    // 2. Table to log all incoming webhook messages for audit and debugging purposes
    .createTable('webhook_logs', (table) => {
      table.increments('id').primary();
      table.bigInteger('chat_id').notNullable(); // Relates to the user's chat session
      table.text('message_text');
      table.json('raw_payload'); // Store the entire JSON request from Telegram
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Drop tables in reverse order to ensure clean rollback
  return knex.schema
    .dropTableIfExists('webhook_logs')
    .dropTableIfExists('telegram_users');
};