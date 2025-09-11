library(nflreadr)
library(randomForest)
library(stringr)

rstudioapi::writeRStudioPreference("data_viewer_max_columns", 1000L)
options(nflreadr.download_path = tempdir(), nflreadr.prefer = "csv")

teamStats <- load_team_stats(TRUE)
schedules <- load_schedules()

allGames <- merge(schedules, teamStats, by.x = c('season', 'week', 'home_team', 'away_team'), by.y = c('season', 'week', 'team', 'opponent_team'), all.x=TRUE)
pastGames <- allGames[!is.na(allGames$season_type),]
upcomingGames <- allGames[is.na(allGames$season_type),]
upcomingGamesReady <- upcomingGames[!is.na(upcomingGames$spread_line),]

xColumns <- c('season','game_type','week','gameday','weekday','away_team','home_team','location','away_rest','home_rest','spread_line','total_line','div_game','roof','away_qb_id','home_qb_id','away_qb_name','home_qb_name','away_coach','home_coach','stadium_id','stadium')
pastGamesPredictors <- pastGames[,..xColumns]
upcomingGamesPredictors <- upcomingGamesReady[,..xColumns]

results <- pastGames[['result']]

randomForestResult <- randomForest(x = pastGamesPredictors, y = results, importance=TRUE)

resultPredictions <- predict(randomForestResult, upcomingGamesPredictors)
predictions <- cbind(upcomingGamesPredictors[,c('gameday', 'away_team', 'home_team')], resultPredictions)

print(predictions)