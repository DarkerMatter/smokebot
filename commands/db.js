const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'db',
        description: 'Admin command to interact with the SQLite database',
        options: [
            {
                name: 'action',
                type: 3, // STRING type
                description: 'The action to run',
                required: true,
                choices: [
                    { name: 'List Movies', value: 'list' },
                    { name: 'Delete Movies', value: 'delete' },
                    { name: 'Manual Query', value: 'manual' }
                ]
            },
            {
                name: 'query',
                type: 3, // STRING type
                description: 'The SQL query to run (for manual action)',
                required: false,
            }
        ]
    },
    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });

        if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('Permission Denied')
                .setDescription('You do not have permission to run this command.')
                .setFooter({ text: 'Hot Rock Make Boat Go' });

            interaction.editReply({ embeds: [embed] });
            return;
        }

        const action = interaction.options.getString('action');
        const query = interaction.options.getString('query');

        switch (action) {
            case 'list':
                listMovies(interaction, db);
                break;
            case 'delete':
                deleteMovies(interaction, db);
                break;
            case 'manual':
                if (!query) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFFFFFF)
                        .setTitle('Invalid Query')
                        .setDescription('You must provide a query for manual action.')
                        .setFooter({ text: 'Hot Rock Make Boat Go' });

                    interaction.editReply({ embeds: [embed] });
                    return;
                }
                executeManualQuery(interaction, db, query);
                break;
            default:
                const embed = new EmbedBuilder()
                    .setColor(0xFFFFFF)
                    .setTitle('Invalid Action')
                    .setDescription('Invalid action selected.')
                    .setFooter({ text: 'Hot Rock Make Boat Go' });

                interaction.editReply({ embeds: [embed] });
        }
    }
};

async function listMovies(interaction, db) {
    db.all('SELECT movie, suggestions, date_won FROM movie_suggestions;', [], (err, rows) => {
        if (err) {
            console.error(err.message);

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('Query Execution Failed')
                .setDescription('Failed to list movies.')
                .setFooter({ text: 'Hot Rock Make Boat Go' });

            interaction.editReply({ embeds: [embed] });
            return;
        }

        const formattedRows = rows.map(row => `Movie: ${row.movie}, Suggested by: ${row.suggestions}, Date Won: ${row.date_won || 'N/A'}`).join('\n');

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('Movie List')
            .setDescription(`\`\`\`${formattedRows}\`\`\``)
            .setFooter({ text: 'Hot Rock Make Boat Go' });

        interaction.editReply({ embeds: [embed] });
    });
}

async function deleteMovies(interaction, db) {
    db.run('DELETE FROM movie_suggestions;', [], function(err) {
        if (err) {
            console.error(err.message);

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('Deletion Failed')
                .setDescription('Failed to delete the movies.')
                .setFooter({ text: 'Hot Rock Make Boat Go' });

            interaction.editReply({ embeds: [embed] });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('Movies Deleted')
            .setDescription('Successfully deleted all movies.')
            .setFooter({ text: 'Hot Rock Make Boat Go' });

        interaction.editReply({ embeds: [embed] });
    });
}

async function executeManualQuery(interaction, db, query) {
    const queryType = query.trim().split(' ')[0].toUpperCase();

    if (!['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALTER'].includes(queryType)) {
        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('Invalid Query Type')
            .setDescription('Only SELECT, INSERT, UPDATE, DELETE, and ALTER queries are allowed.')
            .setFooter({ text: 'Hot Rock Make Boat Go' });

        interaction.editReply({ embeds: [embed] });
        return;
    }

    try {
        if (queryType === 'SELECT') {
            db.all(query, [], (err, rows) => {
                if (err) {
                    console.error(err.message);

                    const embed = new EmbedBuilder()
                        .setColor(0xFFFFFF)
                        .setTitle('Query Execution Failed')
                        .setDescription('Failed to execute SELECT query.')
                        .setFooter({ text: 'Hot Rock Make Boat Go' });

                    interaction.editReply({ embeds: [embed] });
                    return;
                }

                const formattedRows = rows.map(row => JSON.stringify(row)).join('\n');

                const embed = new EmbedBuilder()
                    .setColor(0xFFFFFF)
                    .setTitle('Query Result')
                    .setDescription(`\`\`\`${formattedRows}\`\`\``)
                    .setFooter({ text: 'Hot Rock Make Boat Go' });

                interaction.editReply({ embeds: [embed] });
            });
        } else {
            db.run(query, function (err) {
                if (err) {
                    console.error(err.message);

                    const embed = new EmbedBuilder()
                        .setColor(0xFFFFFF)
                        .setTitle('Query Execution Failed')
                        .setDescription(`Failed to execute ${queryType} query.`)
                        .setFooter({ text: 'Hot Rock Make Boat Go' });

                    interaction.editReply({ embeds: [embed] });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setColor(0xFFFFFF)
                    .setTitle('Query Execution Success')
                    .setDescription(`Successfully executed ${queryType} query.`)
                    .setFooter({ text: 'Hot Rock Make Boat Go' });

                interaction.editReply({ embeds: [embed] });
            });
        }
    } catch (error) {
        console.error(error);

        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('Error in Query Execution')
            .setDescription('Error executing the query.')
            .setFooter({ text: 'Hot Rock Make Boat Go' });

        interaction.editReply({ embeds: [embed] });
    }
}