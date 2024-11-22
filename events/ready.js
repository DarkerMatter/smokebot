// events/ready.js
const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);

        const channelId = process.env.CHANNEL_ID;
        const timezone = 'America/New_York';
        const db = client.db;

        // Ensure necessary tables are created and schema is updated
        await initializeDatabase(db);

        // Schedule daily movie voting announcement at 1700 Eastern Time
        cron.schedule('0 17 * * *', () => {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                announceMoviesForVoting(channel, db);
            }
        }, { timezone });
    },
};

/**
 * Initialize the database by creating or altering necessary tables.
 *
 * @param {Object} db - The database connection.
 * @return {Promise<void>} A promise that resolves once the tables are created.
 */
async function initializeDatabase(db) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS movie_suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                movie TEXT NOT NULL,
                suggestions INTEGER DEFAULT 1,
                won INTEGER DEFAULT 0,
                date_won TEXT
            )`, async (err) => {
                if (err) {
                    console.error('Failed to create movie_suggestions table:', err.message);
                    reject(err);
                    return;
                }
                try {
                    await ensureColumnsExist(db);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        });
    });
}

/**
 * Ensure that the necessary columns exist in the database table.
 *
 * @param {Object} db - The database connection.
 * @return {Promise<void>}
 */
async function ensureColumnsExist(db) {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(movie_suggestions);`, (err, columns) => {
            if (err) {
                console.error('Failed to get table info:', err.message);
                reject(err);
                return;
            }

            const columnNames = columns.map(column => column.name);
            const alterTablePromises = [];

            if (!columnNames.includes('suggestions')) {
                alterTablePromises.push(new Promise((res, rej) => {
                    db.run('ALTER TABLE movie_suggestions ADD COLUMN suggestions INTEGER DEFAULT 1;', (err) => {
                        if (err) rej(err); else res();
                    });
                }));
            }
            if (!columnNames.includes('won')) {
                alterTablePromises.push(new Promise((res, rej) => {
                    db.run('ALTER TABLE movie_suggestions ADD COLUMN won INTEGER DEFAULT 0;', (err) => {
                        if (err) rej(err); else res();
                    });
                }));
            }
            if (!columnNames.includes('date_won')) {
                alterTablePromises.push(new Promise((res, rej) => {
                    db.run('ALTER TABLE movie_suggestions ADD COLUMN date_won TEXT;', (err) => {
                        if (err) rej(err); else res();
                    });
                }));
            }

            Promise.all(alterTablePromises)
                .then(() => {
                    resolve();
                })
                .catch((e) => {
                    console.error('Failed to add columns:', e.message);
                    reject(e);
                });
        });
    });
}

/**
 * Announces a list of movies for voting on a specified channel.
 *
 * @param {Object} channel - The communication channel to send the voting message to.
 * @param {Object} db - The database connection to retrieve movie suggestions.
 * @return {Promise<void>} A promise that resolves once the voting message is sent successfully and reactions are added.
 */
async function announceMoviesForVoting(channel, db) {
    return new Promise((resolve, reject) => {
        const excludeDate = format(subWeeks(new Date(), 1), 'yyyy-MM-dd');

        db.all('SELECT movie, suggestions FROM movie_suggestions WHERE won = 0 AND (date_won IS NULL OR date_won < ?)', [excludeDate], async (err, rows) => {
            if (err) {
                console.error('Error fetching movie suggestions:', err.message);
                reject(err);
                throw err;
            }

            if (rows.length === 0) {
                channel.send('No movie suggestions available for voting.');
                resolve();
                return;
            }

            const shuffledMovies = rows.sort(() => 0.5 - Math.random()).slice(0, 3);
            const movies = shuffledMovies.map((movie, index) => `${index + 1}. ${movie.movie} (${movie.suggestions} suggestions)`).join('\n');

            const embed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle("Vote for Tomorrow's Movie")
                .setDescription(movies)
                .setFooter({ text: 'Hot Rock Make Boat Go' });

            const voteMessage = await channel.send({ embeds: [embed] });

            for (let i = 1; i <= shuffledMovies.length; i++) {
                voteMessage.react(`${i}\uFE0F\u20E3`);
            }

            resolve();
        });
    });
}