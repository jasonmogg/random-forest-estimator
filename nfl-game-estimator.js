import RandomForestEstimator from './random-forest-estimator.js';

export class NFLGameEstimator extends RandomForestEstimator {
    get features () { // TODO: include date?
        return Object.freeze('awayTeam,awayavgScore,awayavgFirstDowns,awayavgTurnoversLost,awayavgPassingYards,awayavgRushingYards,awayavgOffensiveYards,awayavgPassingYardsAllowed,awayavgRushingYardsAllowed,awayavgTurnoversForced,awayavgYardsAllowed,awayavgOppScore,awayWins,awayStreak,awaySOS,homeTeam,homeavgScore,homeavgFirstDowns,homeavgTurnoversLost,homeavgPassingYards,homeavgRushingYards,homeavgOffensiveYards,homeavgPassingYardsAllowed,homeavgRushingYardsAllowed,homeavgTurnoversForced,homeavgYardsAllowed,homeavgOppScore,homeWins,homeStreak,homeSOS,week,season,awayRecordAgainstOpp,homeRecordAgainstOpp'.split(','));
    }

    get labelField () {
        return 'homeTeam';
    }

    get predictionField () {
        return 'WinScore';
    }

    getPredictionValue ({ fields, row }) {
        const awayScoreIndex = fields.indexOf('AwayScore');
        const awayScore = Number(row[awayScoreIndex]);
        const homeScoreIndex = fields.indexOf('HomeScore');
        const homeScore = Number(row[homeScoreIndex]);

        return homeScore - awayScore;
    }
}

export default NFLGameEstimator;
