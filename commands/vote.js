const { EmbedBuilder } = require('discord.js');
const { format, subWeeks } = require('date-fns');

module.exports = {
    data: {
        name: 'vote',
        description: 'Starts the voting process for selecting a movie',
    },
    async execute(interaction, db) {
        // Permissions Check
        if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('Permission Denied')
                .setDescription('You do not have permission to run this command.')
                .setFooter({ text: 'Hot Rock Make Boat Go' });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const excludeDate = format(subWeeks(new Date(), 1), 'yyyy-MM-dd');

        db.all('SELECT movie FROM movie_suggestions WHERE won = 0 AND (date_won IS NULL OR date_won < ?)', [excludeDate], async (err, rows) => {
            if (err) {
                console.error(err.message);
                const embed = new EmbedBuilder()
                    .setColor(0xFFFFFF)
                    .setTitle('Failed to Fetch Suggestions')
                    .setDescription('Failed to fetch movie suggestions.')
                    .setFooter({ text: 'Hot Rock Make Boat Go' });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (rows.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFFFFFF)
                    .setTitle('No Suggestions Available')
                    .setDescription('No movie suggestions available.')
                    .setFooter({ text: 'Hot Rock Make Boat Go' });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const movies = rows.map((row, index) => `${index + 1}. ${row.movie}`).join('\n');

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle("Vote for Tomorrow's Movie")
                .setDescription(movies)
                .setFooter({ text: 'Hot Rock Make Boat Go' });

            const voteMessage = await interaction.channel.send({ embeds: [embed] });

            for (let i = 1; i <= rows.length; i++) {
                voteMessage.react(`${i}\uFE0F\u20E3`);
            }

            const embedConfirmation = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('Voting Started')
                .setDescription('Voting has started!')
                .setFooter({ text: 'Hot Rock Make Boat Go' });

            return interaction.reply({ embeds: [embedConfirmation], ephemeral: true });
        });
    }
};