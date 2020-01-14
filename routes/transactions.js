const express = require('express')
const router = express.Router()
const moment = require('moment')

const Transaction = require('../lib/transaction')
const transaction = new Transaction()

/* GET transactions listing. */
router.get('/', function (req, res, next) {
  const transactions = transaction.getData()

  res.send(transactions)
})

router.get('/:userId', function (req, res, next) {
  const userId = req.params.userId
  const transactions = transaction.getByUserId(userId)

  res.send(transactions)
})

router.get('/:userId/sum', function (req, res, next) {
  const userId = req.params.userId
  const sum = transaction.getSumByUserId(userId)

  res.send({
    userId,
    sum
  })
})

router.get('/:userId/report', function (req, res, next) {
  const userId = req.params.userId
  const report = transaction.getReportByUserId(userId)

  const reportFormat = report.map(record => {
    return {
      id: record.userId,
      weekStart: `${moment(record.start).utc().format('YYYY-MM-DD')} ${record.weekdayStart}`,
      weekEnd: `${moment(record.end).utc().format('YYYY-MM-DD')} ${record.weekdayEnd}`,
      quantity: record.transactions.length,
      amount: record.amount,
      totalAmount: record.totalAmount
    }
  })

  res.send(reportFormat)
})

router.get('/:userId/:transactionId', function (req, res, next) {
  const userId = req.params.userId
  const transactionId = req.params.transactionId

  const result = transaction.find(userId, transactionId)

  if (result === -1) {
    res.status(404)
    res.send('Transaction not found')
  } else {
    res.send(result)
  }
})

router.post('/:userId', function (req, res, next) {
  const userId = req.params.userId
  const body = req.body

  const result = transaction.add(userId, body.amount, body.description, body.date)

  res.status(201)
  res.send(result)
})

module.exports = router
