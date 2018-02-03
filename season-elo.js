import request from 'request-promise-native';
import fs from 'fs-extra';

import clanMembers from './data/destiny-clan-members';

const modes = {
    19: 'Iron Banner',
    10: 'Control',
    12: 'Clash',
    31: 'Supremacy',
    38: 'Countdown',
    39: 'Trials',
    37: 'Survival',
};

(async () => {
    await fs.ensureDir('./data/out/elo');
    for (let player of clanMembers) {
        let seasonNumber = 2;
        let id = player.DestinyUserInfo.membershipId;
        let name = player.DestinyUserInfo.displayName;

        try {
            await fs.unlink(`./data/out/elo/${name}-season${seasonNumber}-elo.csv`);
        } catch (err) {}

        console.log(`Fetching ELO insights for: ${name}...`);

        let eloInsights;
        try {
            eloInsights = await request({
                url: `https://api-insights.destinytracker.com/api/d2/elo/1/${id}?season=${seasonNumber}`,
                json: true,
            });
        } catch (err) {
            console.error(`Failed to lookup ELO insights for ${name}.`);
            console.error(`Skipping data for player ${name}. Perhaps retry later.`);
        }
        let header = "Mode, ELO, GP, W, L, K, A, D\n";
        await fs.appendFile(`./data/out/elo/${name}-season${seasonNumber}-elo.csv`, header, 'utf8');
        for (let insight of eloInsights) {
            let gamemode = modes[insight.mode];
            let elo = insight.currentElo;
            let gamesPlayed = insight.games;
            let kills = insight.kills;
            let deaths = insight.deaths;
            let assists = insight.assists;
            let wins = insight.wins;
            let losses = gamesPlayed - wins;
            let row = `${gamemode}, ${elo}, ${gamesPlayed}, ${wins}, ${losses}, ${kills}, ${assists}, ${deaths}\n`;
            await fs.appendFile(`./data/out/elo/${name}-season${seasonNumber}-elo.csv`, row, 'utf8');
        }
    }
})();
