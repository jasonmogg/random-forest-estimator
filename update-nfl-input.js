// update-nfl-input.js
// Appends to nfl.input.csv all games after the last one in nfl.data.csv, with all fields except AwayScore, HomeScore, and Winner (which are blank)
// Run: npm install axios csvtojson csv-stringify

import fs from 'fs';
import csv from 'csvtojson';
import { stringify } from 'csv-stringify/sync';
import { teamAbbrToFullName, getPriorShortName, calculateTeamStats, fetchNflverseGames } from './nfl-shared.js';

const DATA_CSV = 'nfl.data.csv';
const INPUT_CSV = 'nfl.input.csv';

function mapNflverseToInput(row, priorGames) {
  const parseNum = v => v === '' || v == null ? '' : parseFloat(v);
  const awayFull = teamAbbrToFullName[row.away_team] || row.away_team;
  const homeFull = teamAbbrToFullName[row.home_team] || row.home_team;
  const awayShort = getPriorShortName(priorGames, awayFull, true, (row.away_team || '').toUpperCase());
  const homeShort = getPriorShortName(priorGames, homeFull, false, (row.home_team || '').toUpperCase());
  const awayCalc = calculateTeamStats(priorGames, awayShort, true);
  const homeCalc = calculateTeamStats(priorGames, homeShort, false);
  return {
    awayTeam: awayFull,
    awayTeamShort: awayShort,
    awayavgScore: awayCalc.avgScore || '',
    awayavgFirstDowns: awayCalc.avgFirstDowns || '',
    awayavgTurnoversLost: awayCalc.avgTurnoversLost || '',
    awayavgPassingYards: awayCalc.avgPassingYards || '',
    awayavgRushingYards: awayCalc.avgRushingYards || '',
    awayavgOffensiveYards: awayCalc.avgOffensiveYards || '',
    awayavgPassingYardsAllowed: awayCalc.avgPassingYardsAllowed || '',
    awayavgRushingYardsAllowed: awayCalc.avgRushingYardsAllowed || '',
    awayavgTurnoversForced: awayCalc.avgTurnoversForced || '',
    awayavgYardsAllowed: awayCalc.avgYardsAllowed || '',
    awayavgOppScore: awayCalc.avgOppScore || '',
    awayWins: awayCalc.wins || '',
    awayStreak: awayCalc.streak || '',
    awaySOS: '',
    homeTeam: homeFull,
    homeTeamShort: homeShort,
    homeavgScore: homeCalc.avgScore || '',
    homeavgFirstDowns: homeCalc.avgFirstDowns || '',
    homeavgTurnoversLost: homeCalc.avgTurnoversLost || '',
    homeavgPassingYards: homeCalc.avgPassingYards || '',
    homeavgRushingYards: homeCalc.avgRushingYards || '',
    homeavgOffensiveYards: homeCalc.avgOffensiveYards || '',
    homeavgPassingYardsAllowed: homeCalc.avgPassingYardsAllowed || '',
    homeavgRushingYardsAllowed: homeCalc.avgRushingYardsAllowed || '',
    homeavgTurnoversForced: homeCalc.avgTurnoversForced || '',
    homeavgYardsAllowed: homeCalc.avgYardsAllowed || '',
    homeavgOppScore: homeCalc.avgOppScore || '',
    homeWins: homeCalc.wins || '',
    homeStreak: homeCalc.streak || '',
    homeSOS: '',
    AwayScore: '',
    HomeScore: '',
    Winner: '',
    actualSpread: '',
    Date: row.game_date,
    VegasLine: row.vegas_line || '',
    week: row.week,
    season: row.season,
    awayRecordAgainstOpp: row.away_record_against_opp || '',
    homeRecordAgainstOpp: row.home_record_against_opp || ''
  };
}

(async () => {
  const priorGames = await csv().fromFile(DATA_CSV);
  let maxSeason = 0, maxWeek = 0;
  for (const row of priorGames) {
    const season = parseInt(row.season);
    const week = parseInt(row.week);
    if (season > maxSeason || (season === maxSeason && week > maxWeek)) {
      maxSeason = season;
      maxWeek = week;
    }
  }
  const nflverseRows = await fetchNflverseGames();
  const newRows = nflverseRows.filter(row => {
    const season = parseInt(row.season);
    const week = parseInt(row.week);
    if (season < maxSeason || (season === maxSeason && week < maxWeek)) return false;
    return true;
  });
  if (!newRows.length) {
    console.log('No new games to append.');
    return;
  }
  const inputRows = newRows.map(row => mapNflverseToInput(row, priorGames));
  const csvString = stringify(inputRows, { header: false });
  fs.appendFileSync(INPUT_CSV, csvString);
  console.log(`Appended ${inputRows.length} new games to ${INPUT_CSV}`);
})();
