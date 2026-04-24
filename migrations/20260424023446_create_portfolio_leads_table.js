exports.up = function(knex) {
    return knex.schema.createTable('portfolio_leads', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('email').notNullable();
        table.text('message').notNullable();
        
        // Memasukkan ide brilianmu sebelumnya: Kolom status!
        // Sangat berguna untuk Dashboard admin nanti agar tahu mana klien yang belum dihubungi
        table.string('status').defaultTo('new'); 
        
        table.timestamps(true, true); // Otomatis mencatat waktu (created_at & updated_at)
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('portfolio_leads');
};