#!/usr/bin/env node

import fs from 'node:fs';

// Show usage if insufficient arguments
if (process.argv.length < 3) {
    console.error('Usage: node index.js <module_path> <training_csv> [model_path] [input_csv]');
    console.error('  module_path: Path to the module to use');
    console.error('  training_csv: Path to CSV file with training data');
    console.error('  model_path: (Optional) Path to save/load model');
    console.error('  input_csv: (Optional) Path to CSV file with data to predict');
    process.exit(1);
}

// Parse command line arguments
const modulePath = process.argv[2];
const trainingPath = process.argv[3];
let modelPath = null;
let inputPath = null;

if (process.argv.length === 5) {
    // No model path specified
    inputPath = process.argv[4];
} else if (process.argv.length >= 5) {
    // Model path specified
    modelPath = process.argv[4];
    inputPath = process.argv[5];
}

// Verify file paths
if (!fs.existsSync(trainingPath)) {
    console.error(`Training file not found: ${trainingPath}`);
    process.exit(1);
}

if (!modelPath) { // save model to random file
    modelPath = `model-${Math.random().toString(36).substring(2, 15)}.json`;
}

if (inputPath && !fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
}

// Random forest options
const options = {
    maxFeatures: 1.0,  // Using all features
    nEstimators: 200, // Number of trees in forest
    replacement: false,
    seed: 42
};

console.log('Starting prediction...');
console.log(`Training data: ${trainingPath}`);
if (modelPath) console.log(`Model path: ${modelPath}`);

if (inputPath) {
    console.log(`Input data: ${inputPath}`);
}

// Create predictor instance
const module = await import(modulePath);
const cls = module.default;
const predictor = new cls(trainingPath, modelPath, options);

predictor.trainingPromise.then(({ actuals, data, importance, labels }) => {
    console.log('\nTraining Data:');
    console.log('---------------------------------');

    data.forEach((row, index) => {
        console.log(index, labels[index]);
        console.log(Object.fromEntries(predictor.features.map((field, index) => [field, row[index]])));
        console.log(predictor.predictionField + ':', actuals[index]);
    });

    console.log('Feature Importance:');
    console.log('---------------------------------');
    console.log(importance);
});

if (inputPath) {
    // Run predictions
    predictor.run(inputPath)
        .then(({ actuals, categoricalValues, data, metrics, predictions }) => {
            console.log('\nPrediction Results:');
            console.log('---------------------------------');

            console.log('Categorical Values:');
            console.log('---------------------------------');
            console.log(categoricalValues);

            console.log('Feature Importance:');
            console.log('---------------------------------');
            console.log(metrics.importance);

            // Display predictions
            data.forEach((features, i) => {
                console.log(`Record ${i + 1}:`);
                console.log(`  Features: ${features.join(', ')}`);
                console.log(`  Predicted: ${Math.round(predictions[i]).toLocaleString()}`);
                console.log(`  Actual: ${Math.round(actuals[i]).toLocaleString()}`);
                console.log(`  Difference: ${(metrics.diffs[i] * 100).toFixed(2)}%`);
            });

            console.log('\nMetrics:');
            console.log('---------------------------------');
            console.log(`MAE: ${metrics.mae.toFixed(2)}`);
            console.log(`MSE: ${metrics.mse.toFixed(2)}`);
            console.log(`RMSE: ${metrics.rmse.toFixed(2)}`);
            console.log(`R-squared: ${metrics.r2.toFixed(2)}`);

            console.log('\nPrediction complete!');
        })
        .catch(err => {
            console.error('Error during prediction:', err);
            process.exit(1);
        });
}