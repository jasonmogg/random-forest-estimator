import csv from 'csvtojson';
import fs from 'node:fs';
import { RandomForestRegression } from 'ml-random-forest';

export class RandomForestEstimator {
    #categoricalValues = { ...this.categoricalValues };
    #regression;
    #trainingPromise;

    constructor (trainingPath, modelPath, options = {
        maxFeatures: 0.8,
        nEstimators: 100,
        replacement: false,
        seed: 42
    }) {
        this.#trainingPromise = this.#load(trainingPath).then(async ({ actuals, data, fields, labels, rows }) => {
            if (modelPath && fs.existsSync(modelPath)) {
                console.log('Loading model from', modelPath);

                this.#regression = RandomForestRegression.load(JSON.parse(await fs.promises.readFile(modelPath)));
            } else {
                console.log('Training model from', trainingPath);

                this.#regression = new RandomForestRegression(options);
                this.#regression.train(data, actuals);

                if (modelPath) {
                    fs.writeFileSync(modelPath, JSON.stringify(this.#regression.toJSON()));
    
                    console.log('Model saved to', modelPath);
                }
            }

            return { actuals, data, fields, importance: this.fieldImportance, labels, rows };
        });
    }

    // public properties

    get categoricalValues () {
        return Object.freeze({});
    }

    get featureFilters () {
        return Object.freeze({});
    }

    get features () {
        throw new Error('Not implemented');
    }

    get fieldImportance () {
        const featureImportance = this.#regression.featureImportance();

        return Object.fromEntries(this.features.map((feature, index) => [feature, featureImportance[index]]));
    }

    get labelField () {
        throw new Error('Not implemented');
    }

    get predictionField () {
        throw new Error('Not implemented');
    }

    get trainingPromise () {
        return this.#trainingPromise;
    }

    // methods

    actualFilter (actual) {
        return true;
    }

    // Calculate common regression metrics
    #calculateMetrics(predictions, actuals) {
        if (predictions.length !== actuals.length) {
            throw new Error('Predictions and actuals must have the same length');
        }

        let diffs, mae, mse, rmse, r2;

        if (actuals) {
            diffs = predictions.map((pred, i) => (pred / actuals[i]) - 1);
            
            // Calculate Mean Absolute Error (MAE)
            mae = predictions.reduce((sum, pred, i) => 
                sum + Math.abs(pred - actuals[i]), 0) / predictions.length;
                
            // Calculate Mean Squared Error (MSE)
            mse = predictions.reduce((sum, pred, i) => 
                sum + Math.pow(pred - actuals[i], 2), 0) / predictions.length;
                
            // Calculate Root Mean Squared Error (RMSE)
            rmse = Math.sqrt(mse);
            
            // Calculate R-squared
            const mean = actuals.reduce((sum, val) => sum + val, 0) / actuals.length;
            const totalVariance = actuals.reduce((sum, val) => 
                sum + Math.pow(val - mean, 2), 0);
            const residualVariance = predictions.reduce((sum, pred, i) => 
                sum + Math.pow(actuals[i] - pred, 2), 0);
            r2 = 1 - (residualVariance / totalVariance);
        }
        
        return { diffs, importance: this.fieldImportance, mae, mse, rmse, r2 };
    }

    // OR array of AND object filters
    get dataFilters () {
        return undefined;
    }

    getPredictionValue ({ fields, row, predictionIndex }) {
        return Number(row[predictionIndex]);
    }

    #load (path) {
        return csv({ noheader: true, output: 'csv' }).fromFile(path).then(rows => {
            const actuals = [];
            const fields = rows[0];
            const dataRows = rows.slice(1);
            const data = [];
            const labelIndex = fields.indexOf(this.labelField);
            const labels = [];
            const orFilters = this.dataFilters;
            const predictionIndex = fields.indexOf(this.predictionField);
            
            dataRows.forEach(row => {
                if (orFilters) {
                    const passesDataFilters = orFilters.some(andFilter => {
                        return Object.keys(andFilter).every(key => {
                            const keyIndex = fields.indexOf(key);

                            return row[keyIndex] === andFilter[key];
                        });
                    });

                    if (!passesDataFilters) {
                        return;
                    }
                }

                const actual = this.getPredictionValue({ fields, row, predictionIndex });

                if (!this.actualFilter(actual)) {
                    return;
                }

                const rowData = [];

                for (let i = 0; i < this.features.length; i++) {
                    const feature = this.features[i];
                    let value = row[fields.indexOf(feature)];
                    const categoricalValues = this.#categoricalValues[feature];

                    if (categoricalValues) {
                        const categoricalValue = categoricalValues.indexOf(value);

                        if (categoricalValue === -1) {
                            categoricalValues.push(value);

                            value = categoricalValues.length - 1;
                        } else {
                            value = categoricalValue;
                        }
                    } else {
                        const numberValue = Number(value);

                        if (isNaN(numberValue)) {
                            this.#categoricalValues[feature] = [value];

                            value = 0;
                        } else {
                            value = numberValue;
                        }
                    }

                    const featureFilter = this.featureFilters[feature];

                    if (featureFilter && !featureFilter(value)) {
                        return;
                    }

                    rowData.push(value);
                }

                actuals.push(actual);
                data.push(rowData);
                labels.push(row[labelIndex]);
            });

            return {
                actuals,
                data,
                fields,
                labels,
                rows
            };
        });
    }

    // Calculate evaluation metrics if actuals are available
    run(inputPath) {
        return Promise.all([
            this.#trainingPromise,
            this.#load(inputPath)
        ]).then(([, { actuals, labels, data }]) => {
            if (!this.#regression) {
                throw new Error('Model not trained or loaded');
            }
            
            // Make predictions
            const predictions = this.#regression.predict(data);
            
            let metrics = null;

            metrics = this.#calculateMetrics(predictions, actuals);
            
            return {
                actuals,
                categoricalValues: this.#categoricalValues,
                data,
                labels,
                metrics,
                predictions
            };
        });
    }
}

export default RandomForestEstimator;
