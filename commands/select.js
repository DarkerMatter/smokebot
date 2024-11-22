const { EmbedBuilder } = require('discord.js');
const { format } = require('date-fns');

module.exports = {
    data: {
        name: 'select',
        description: 'Select the winner or a random movie from the current voting options',
        options: [{
            name: 'option',
            type: 3, // STRING type
            description: 'Specify "winner" to select the winning movie or "random" to select a random movie',
            required: true,
            choices: [
                { name: 'Winner', value: 'winner' },
                { name: 'Random', value: 'random' }
            ]
        }],
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

        const option = interaction.options.getString('option');
        const channelId = process.env.CHANNEL_ID;
        const channel = interaction.client.channels.cache.get(channelId);

        if (!channel) {
            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('Channel Not Found')
                .setDescription('Channel not found.')
                .setFooter({ text: 'Hot Rock Make Boat Go' });

            interaction.editReply({ embeds: [embed] });
            return;
        }

        if (option === 'winner') {
            await selectWinner(db, interaction, channel);
        } else {
            await selectRandomMovie(db, interaction, channel);
        }
    }
};

async function selectWinner(db, interaction, channel) {
    // Fetch up-to-date messages and find the voting message
    const messages = await interaction.channel.messages.fetch({ limit: 50 });
    const voteMessage = messages.find(msg => msg.embeds.length && msg.embeds[0].title === "Vote for Tomorrow's Movie");

    if (!voteMessage) {
        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('Voting Message Not Found')
            .setDescription('No voting message found.')
            .setFooter({ text: 'Hot Rock Make Boat Go' });

        interaction.editReply({ embeds: [embed] });
        return;
    }

    const reactions = voteMessage.reactions.cache.filter(reaction => reaction.emoji.name.match(/\d\uFE0F\u20E3/));

    if (reactions.size === 0) {
        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('No Votes Cast')
            .setDescription('No votes have been cast.')
            .setFooter({ text: 'Hot Rock Make Boat Go' });

        interaction.editReply({ embeds: [embed] });
        return;
    }

    let maxCount = 0;
    let winnerEmoji = '';

    reactions.forEach(reaction => {
        if (reaction.count > maxCount) {
            maxCount = reaction.count;
            winnerEmoji = reaction.emoji.name;
        }
    });

    const winningMovieIndex = parseInt(winnerEmoji.charAt(0)) - 1;
    const splitMessage = voteMessage.embeds[0].description.split('\n');
    const winningMovie = splitMessage[winningMovieIndex].split('. ')[1].split(' (')[0];

    const currentDate = new Date();
    const dateWon = format(currentDate, 'yyyy-MM-dd');

    db.run('UPDATE movie_suggestions SET won = 1, date_won = ? WHERE movie = ?', [dateWon, winningMovie], function (err) {
        if (err) {
            console.error(err.message);
            const embedFailure = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('Failed to Update Winner')
                .setDescription('Failed to update the winner.')
                .setFooter({ text: 'Hot Rock Make Boat Go' });

            interaction.editReply({ embeds: [embedFailure] });
            return;
        }

        const embedSuccess = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('Winner Selected')
            .setDescription(`The winning movie is:\n\n**${winningMovie}**`)
            .setFooter({ text: 'Hot Rock Make Boat Go' });

        channel.send({ embeds: [embedSuccess] });
        interaction.editReply({ embeds: [embedSuccess] });
    });
}

async function selectRandomMovie(db, interaction, channel) {
    // Fetch up-to-date messages and find the voting message
    const messages = await interaction.channel.messages.fetch({ limit: 50 });
    const voteMessage = messages.find(msg => msg.embeds.length && msg.embeds[0].title === "Vote for Tomorrow's Movie");

    if (!voteMessage) {
        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('Voting Message Not Found')
            .setDescription('No voting message found.')
            .setFooter({ text: 'Hot Rock Make Boat Go' });

        interaction.editReply({ embeds: [embed] });
        return;
    }

    const splitMessage = voteMessage.embeds[0].description.split('\n');
    const moviesForVoting = splitMessage.map(line => line.split('. ')[1].split(' (')[0]);

    if (moviesForVoting.length === 0) {
        const embed = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('No Movies for Voting')
            .setDescription('No movies available for random selection.')
            .setFooter({ text: 'Hot Rock Make Boat Go' });

        interaction.editReply({ embeds: [embed] });
        return;
    }

    const randomMovie = moviesForVoting[Math.floor(Math.random() * moviesForVoting.length)];

    const currentDate = new Date();
    const dateWon = format(currentDate, 'yyyy-MM-dd');

    db.run('UPDATE movie_suggestions SET won = 1, date_won = ? WHERE movie = ?', [dateWon, randomMovie], function (err) {
        if (err) {
            console.error(err.message);
            const embedFailure = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle('Failed to Update Winner')
                .setDescription('Failed to update the winner.')
                .setFooter({ text: 'Hot Rock Make Boat Go' });

            interaction.editReply({ embeds: [embedFailure] });
            return;
        }

        const embedSuccess = new EmbedBuilder()
            .setColor(0xFFFFFF)
            .setTitle('Random Movie Selected')
            .setDescription(`The randomly selected movie is:\n\n**${randomMovie}**`)
            .setFooter({ text: 'Hot Rock Make Boat Go' });

        channel.send({ embeds: [embedSuccess] });
        interaction.editReply({ embeds: [embedSuccess] });
    });
}