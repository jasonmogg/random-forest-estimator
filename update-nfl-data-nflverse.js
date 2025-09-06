// update-nfl-data-nflverse.js
// Fetches the latest NFL game data from nflverse and appends missing games to nfl.data.csv
// Run: npm install axios csvtojson csv-stringify

import fs from 'fs';
import csv from 'csvtojson';
import { stringify } from 'csv-stringify/sync';
import { teamAbbrToFullName, getPriorShortName, calculateTeamStats, fetchNflverseGames } from './nfl-shared.js';

const CSV_FILE = 'nfl.data.csv';

// Helper: Get all games already in the CSV (by season, week, teams)
async function getExistingGames() {
  const rows = await csv().fromFile(CSV_FILE);
  const set = new Set();
  for (const row of rows) {
    set.add(`${row.season}|${row.week}|${row.awayTeam}|${row.homeTeam}`);
  }
  return set;
}

// Helper: Get the last season and week in the CSV
async function getLastSeasonWeek() {
  const rows = await csv().fromFile(CSV_FILE);
  let maxSeason = 0, maxWeek = 0;
  for (const row of rows) {
    const season = parseInt(row.season);
    const week = parseInt(row.week);
    if (season > maxSeason || (season === maxSeason && week > maxWeek)) {
      maxSeason = season;
      maxWeek = week;
    }
  }
  return { season: maxSeason, week: maxWeek };
}

// Map nflverse row to your CSV format, now with calculated stats if missing
function mapNflverseToCSV(row, priorGames) {
  const parseNum = v => v === '' || v == null ? '' : parseFloat(v);
  const awayFull = teamAbbrToFullName[row.away_team] || row.away_team;
  const homeFull = teamAbbrToFullName[row.home_team] || row.home_team;
  // Use prior short name if available, else fallback to abbreviation
  const awayShort = getPriorShortName(priorGames, awayFull, true, (row.away_team || '').toUpperCase());
  const homeShort = getPriorShortName(priorGames, homeFull, false, (row.home_team || '').toUpperCase());
  // Calculate prior stats for away and home
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
    awaySOS: '', // can be calculated if needed
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
    homeSOS: '', // can be calculated if needed
    AwayScore: parseNum(row.away_score),
    HomeScore: parseNum(row.home_score),
    Winner: row.result === 'home' ? 1 : 0,
    actualSpread: parseNum(row.home_score) - parseNum(row.away_score),
    Date: row.game_date,
    VegasLine: row.vegas_line || '',
    week: row.week,
    season: row.season,
    awayRecordAgainstOpp: row.away_record_against_opp || '',
    homeRecordAgainstOpp: row.home_record_against_opp || ''
  };
}

// Main
(async () => {
  const existing = await getExistingGames();
  const { season: lastSeason, week: lastWeek } = await getLastSeasonWeek();
  const nflverseRows = await fetchNflverseGames();
  // Load all prior games from nfl.data.csv
  const priorGames = await csv().fromFile(CSV_FILE);
  // Only add games after the last one in the CSV and with scores
  const newRows = nflverseRows.filter(row => {
    const season = parseInt(row.season);
    const week = parseInt(row.week);
    const key = `${season}|${week}|${row.away_team}|${row.home_team}`;
    if (existing.has(key)) return false;
    if (season < lastSeason || (season === lastSeason && week <= lastWeek)) return false;
    // Only add games with both scores present and not empty
    if (!row.away_score || !row.home_score) return false;
    return true;
  });
  if (!newRows.length) {
    console.log('No new games to append.');
    return;
  }
  const csvRows = newRows.map(row => mapNflverseToCSV(row, priorGames));
  const csvString = stringify(csvRows, { header: false });
  fs.appendFileSync(CSV_FILE, csvString);
  console.log(`Appended ${csvRows.length} new games to ${CSV_FILE}`);
})();
