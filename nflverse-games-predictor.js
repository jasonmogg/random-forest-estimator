import RandomForestEstimator from './random-forest-estimator.js';

export class NFLVerseGamesPredictor extends RandomForestEstimator {
    get features () {
        return Object.freeze('season,game_type,week,gameday,weekday,gametime,away_team,home_team,location,away_rest,home_rest,away_moneyline,home_moneyline,spread_line,away_spread_odds,home_spread_odds,total_line,under_odds,over_odds,div_game,roof,surface,temp,wind,away_qb_id,home_qb_id,away_qb_name,home_qb_name,away_coach,home_coach,referee,stadium_id,stadium'.split(','));
    }

    get labelField () {
        return 'game_id';
    }

    get predictionField () {
        return 'result';
    }
}

export default NFLVerseGamesPredictor;
