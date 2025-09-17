import axios from 'axios';
import csv from 'csvtojson';

export const NFLVERSE_GAMES_CSV = 'https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv';

export const teamAbbrToFullName = {
  ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns',
  DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers',
  HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs',
  LA: 'Los Angeles Rams', LV: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins',
  MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants',
  NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SF: 'San Francisco 49ers',
  SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Commanders'
};

export function getPriorShortName(priorGames, teamFull, isAway, fallback) {
  for (let i = priorGames.length - 1; i >= 0; i--) {
    const row = priorGames[i];
    if (isAway && row.awayTeam === teamFull && row.awayTeamShort) return row.awayTeamShort;
    if (!isAway && row.homeTeam === teamFull && row.homeTeamShort) return row.homeTeamShort;
  }
  return fallback;
}

export function calculateTeamStats(priorGames, team, isAway) {
  const games = priorGames.filter(row => (isAway ? row.awayTeamShort : row.homeTeamShort) === team);
  if (!games.length) return {};
  const avg = field => {
    const vals = games.map(row => parseFloat(row[field])).filter(v => !isNaN(v));
    if (!vals.length) return '';
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  };
  const sum = field => {
    const vals = games.map(row => parseFloat(row[field])).filter(v => !isNaN(v));
    if (!vals.length) return '';
    return vals.reduce((a, b) => a + b, 0);
  };
  let streak = 0, last = null;
  for (let i = games.length - 1; i >= 0; i--) {
    const win = isAway ? games[i].AwayScore > games[i].HomeScore : games[i].HomeScore > games[i].AwayScore;
    if (last === null) last = win;
    if (win === last) streak++;
    else break;
  }
  return {
    avgScore: avg(isAway ? 'AwayScore' : 'HomeScore'),
    avgFirstDowns: avg(isAway ? 'awayavgFirstDowns' : 'homeavgFirstDowns'),
    avgTurnoversLost: avg(isAway ? 'awayavgTurnoversLost' : 'homeavgTurnoversLost'),
    avgPassingYards: avg(isAway ? 'awayavgPassingYards' : 'homeavgPassingYards'),
    avgRushingYards: avg(isAway ? 'awayavgRushingYards' : 'homeavgRushingYards'),
    avgOffensiveYards: avg(isAway ? 'awayavgOffensiveYards' : 'homeavgOffensiveYards'),
    avgPassingYardsAllowed: avg(isAway ? 'awayavgPassingYardsAllowed' : 'homeavgPassingYardsAllowed'),
    avgRushingYardsAllowed: avg(isAway ? 'awayavgRushingYardsAllowed' : 'homeavgRushingYardsAllowed'),
    avgTurnoversForced: avg(isAway ? 'awayavgTurnoversForced' : 'homeavgTurnoversForced'),
    avgYardsAllowed: avg(isAway ? 'awayavgYardsAllowed' : 'homeavgYardsAllowed'),
    avgOppScore: avg(isAway ? 'awayavgOppScore' : 'homeavgOppScore'),
    wins: sum(isAway ? 'awayWins' : 'homeWins'),
    streak: streak,
  };
}

export async function fetchNflverseGames() {
  const response = await axios.get(NFLVERSE_GAMES_CSV, { responseType: 'stream' });
  return await csv().fromStream(response.data);
}


