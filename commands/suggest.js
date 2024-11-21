const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'suggest',
        description: 'Suggest a movie',
        options: [{
            name: 'movie',
            type: 3, // STRING type
            description: 'Name of the movie',
            required: true,
        }],
    },
    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });

        const movieSuggestion = interaction.options.getString('movie').toLowerCase();

        db.get('SELECT movie, suggestions FROM movie_suggestions WHERE LOWER(movie) = ?', [movieSuggestion], (err, row) => {
            if (err) {
                console.error(err.message);

                const embed = new EmbedBuilder()
                    .setColor(0xFFFFFF)
                    .setTitle('Failed to Add Suggestion')
                    .setDescription('Failed to add your suggestion.')
                    .setFooter({ text: 'Hot Rock Make Boat Go' });

                interaction.editReply({ embeds: [embed] });
                return;
            }

            if (row) {
                // Update existing entry
                db.run('UPDATE movie_suggestions SET suggestions = suggestions + 1 WHERE LOWER(movie) = ?', [movieSuggestion], function (err) {
                    if (err) {
                        console.error(err.message);

                        const embed = new EmbedBuilder()
                            .setColor(0xFFFFFF)
                            .setTitle('Failed to Update Suggestion')
                            .setDescription('Failed to update your suggestion.')
                            .setFooter({ text: 'Hot Rock Make Boat Go' });

                        interaction.editReply({ embeds: [embed] });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setColor(0xFFFFFF)
                        .setTitle('Movie Suggestion Updated')
                        .setDescription(`Movie suggestion updated: ${row.movie} has now ${row.suggestions + 1} suggestions`)
                        .setFooter({ text: 'Hot Rock Make Boat Go' });

                    interaction.editReply({ embeds: [embed] });
                });
            } else {
                // Insert new entry
                db.run('INSERT INTO movie_suggestions (movie, won, suggestions) VALUES (?, ?, ?)', [movieSuggestion, false, 1], function (err) {
                    if (err) {
                        console.error(err.message);

                        const embed = new EmbedBuilder()
                            .setColor(0xFFFFFF)
                            .setTitle('Failed to Add Suggestion')
                            .setDescription('Failed to add your suggestion.')
                            .setFooter({ text: 'Hot Rock Make Boat Go' });

                        interaction.editReply({ embeds: [embed] });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setColor(0xFFFFFF)
                        .setTitle('Movie Suggestion Received')
                        .setDescription(`Movie suggestion received: ${movieSuggestion}`)
                        .setFooter({ text: 'Hot Rock Make Boat Go' });

                    interaction.editReply({ embeds: [embed] });
                });
            }
        });
    }
};