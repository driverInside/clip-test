# clip-test

## Install

Once you clone this repo, install dependencies

```
npm i
```

## Run tests

To run the test (including the API tests):

```
npm run test
```

## Run the app

After install the project dependencies, type:

```
npm run start
```
This app uses the port 3000

## Routes list

| Method | Route | Description |
| :---: | :---: | :---: |
| **GET** | /api/transactions | List all the transactions grouped by user id |
| **GET** | /api/transactions/:userId | Get the transactions of a single user by id |
| **GET** | /api/transactions/:userId/report | Generates a report with a single user transactions |
| **GET** | /api/transactions/:userId/sum | Calculates the sum of the user transactions |
| **GET** | /api/transactions/:userId/:transactionId | Retrieves a single transaction |
| **POST** | /api/transactions/:userId | Adds a new transaction |




