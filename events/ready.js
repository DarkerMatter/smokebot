// events/ready.js
const cron = require('node-cron');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);

        const channelId = process.env.CHANNEL_ID;
        const timezone = 'America/New_York';

        // Schedule daily movie voting announcement at 1700 Eastern Time
        cron.schedule('0 17 * * *', () => {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                announceMoviesForVoting(channel, client.db);
            }
        }, { timezone });
    },
};

/**
 * Announces a list of movies for voting on a specified channel.
 *
 * @param {Object} channel - The communication channel to send the voting message to.
 * @param {Object} db - The database connection to retrieve movie suggestions.
 * @return {Promise<void>} A promise that resolves once the voting message is sent successfully and reactions are added.
 */
async function announceMoviesForVoting(channel, db) {
    return new Promise((resolve, reject) => {
        db.all('SELECT movie FROM movie_suggestions', [], (err, rows) => {
            if (err) {
                reject(err);
                throw err;
            }
            if (rows.length === 0) {
                channel.send('No movie suggestions available for voting.');
                resolve();
                return;
            }

            const moviesForVoting = getRandomMovies(rows.map(row => row.movie), 3);
            let votingMessage = 'Vote for tomorrow\'s movie:\n';
            moviesForVoting.forEach((movie, index) => {
                votingMessage += `${index + 1}. ${movie}\n`;
            });
            votingMessage += '\nReact to this message with the number of your choice!';

            channel.send(votingMessage).then(sentMessage => {
                for (let i = 0; i < moviesForVoting.length; i++) {
                    sentMessage.react((i + 1).toString() + '\uFE0F\u20E3');
                }
                resolve();
            });
        });
    });
}

/**
 * Selects a specified number of random movies from a given list.
 *
 * @param {Array} movies - The array containing movie objects.
 * @param {number} num - The number of random movies to select.
 * @return {Array} An array containing the selected random movies.
 */
function getRandomMovies(movies, num) {
    const shuffled = movies.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}