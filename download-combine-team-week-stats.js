// download-combine-team-week-stats.js
// Usage: node download-combine-team-week-stats.js <gameResultsCsv> [outputFile]
// Example: node download-combine-team-week-stats.js games.csv all_stats_team_week.csv
// Run: npm install axios csvtojson csv-stringify

import axios from 'axios';
import fs from 'fs';
import csv from 'csvtojson';
import { stringify } from 'csv-stringify/sync';

const BASE_URL = 'https://github.com/nflverse/nflverse-data/releases/download/stats_team';

const gameResultsFile = process.argv[2];
const outputFile = process.argv[3] || 'all_stats_team_week.csv';

if (!gameResultsFile) {
  console.error('Usage: node download-combine-team-week-stats.js <gameResultsCsv> [outputFile]');
  process.exit(1);
}

const startYear = 1999;
const endYear = new Date().getFullYear();

async function downloadCsv(year) {
  const url = `${BASE_URL}/stats_team_week_${year}.csv`;
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    return response.data;
  } catch (e) {
    console.error(`Failed to download for year ${year}: ${e.message}`);
    return null;
  }
}

async function main() {
  // Load game results CSV
  console.log(`Loading game results from ${gameResultsFile}...`);
  const gameResults = await csv().fromFile(gameResultsFile);
  console.log(`Loaded ${gameResults.length} game results`);
  
  // Create lookup map for game results (key: season_week_team)
  const gameResultsMap = new Map();
  for (const game of gameResults) {
    const awayKey = `${game.season}_${game.week}_${game.away_team}`;
    const homeKey = `${game.season}_${game.week}_${game.home_team}`;
    gameResultsMap.set(awayKey, {
      away_score: game.away_score,
      home_score: game.home_score,
      result: game.result
    });
    gameResultsMap.set(homeKey, {
      away_score: game.away_score,
      home_score: game.home_score,
      result: game.result
    });
  }
  
  let allRows = [];
  
  for (let year = startYear; year <= endYear; year++) {
    console.log(`Downloading stats_team_week_${year}.csv ...`);
    const stream = await downloadCsv(year);
    if (!stream) {
      console.error(`Failed to download for year ${year}`);
      continue;
    }
    
    try {
      // Parse CSV properly using csvtojson
      const rows = await csv().fromStream(stream);
      console.log(`Parsed ${rows.length} rows for year ${year}`);
      
      // Add game results data to each row
      for (const row of rows) {
        const key = `${row.season}_${row.week}_${row.team}`;
        const gameData = gameResultsMap.get(key);
        if (gameData) {
          row.away_score = gameData.away_score;
          row.home_score = gameData.home_score;
          row.result = gameData.result;
        } else {
          row.away_score = '';
          row.home_score = '';
          row.result = '';
        }
      }
      
      if (rows.length > 0) {
        allRows = allRows.concat(rows);
      }
    } catch (e) {
      console.error(`Error parsing CSV for year ${year}: ${e.message}`);
      continue;
    }
  }
  
  if (allRows.length === 0) {
    console.log('No data to write');
    return;
  }
  
  // Write all rows to output file
  const csvString = stringify(allRows, { header: true });
  fs.writeFileSync(outputFile, csvString);
  console.log(`Combined CSV written to ${outputFile} with ${allRows.length} total rows`);
}

main();
