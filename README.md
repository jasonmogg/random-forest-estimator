# Random Forest Estimator

A Node.js application that uses random forest algorithm to predict values (actuals) based on CSV data.

## Features

- Uses machine learning (Random Forest) to predict values based on features
- Supports training on CSV files containing data
- Can save and load trained models
- Provides value predictions for data rows

## Installation

```bash
npm install
```

## Usage

Run the program with the following command:

```bash
node index.js <class_module_path> <training_csv> [model_path] [input_csv]
```

Where:
- `training_csv`: Path to CSV file with training data
- `model_path`: (Optional) Path to save/load model
- `input_csv`: Path to CSV file with data to predict

Example:
```bash
node index.js training2.csv model.json input2.csv
```

## CSV Format

The CSV file should contain at least one feature by overriding the features getter and providing the predictionField

## Requirements

- Node.js v14 or higher
- npm packages:
  - ml-random-forest
  - csvtojson
