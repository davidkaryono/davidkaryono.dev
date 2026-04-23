// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    },
    // SQLite requires this setting to be true to avoid inserting default NULL values
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  }

};