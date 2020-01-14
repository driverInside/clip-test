const fs = require('fs')
const uuidv4 = require('uuid/v4')
const moment = require('moment')

module.exports = class Transaction {
  /**
   * constructor
   */
  constructor () {
    if (!!Transaction.instance) {
      return Transaction.instance
    }
    // This is a singleton class
    Transaction.instance = this
    this.fileName = 'data/transactions.json'
    this.userIdIndexTable = {}
    this.weekdays = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',

    ]

    this.getData()
    return this
  }

  getUserIdIndexTable () {
    return this.userIdIndexTable
  }

  /**
   * find
   * @description Find a specific transaction by user id and transaction id
   * @param {string} userId User id
   * @param {string} transactionId Transaction id
   * @returns {number|object} the transaction or -1 if the transaction is not found
   */
  find (userId, transactionId) {
    const userIdIndex = this.userIdIndexTable[String(userId)]
    
    if (!!userIdIndex || userIdIndex === 0) {
      const record = Transaction.data[userIdIndex]

      for (let i = 0; i < record.transactions.length; i++) {
        const element = record.transactions[i]
        if (element.id === transactionId) {
          return element
        }
      }
    }
    return -1
  }

  /**
   * getData
   * @description Reads the data file
   * @returns {object} The data as object
   */
  getData () {
    if (!!Transaction.data) {
      return Transaction.data
    }

    const raw = fs.readFileSync(this.fileName)
    const data = JSON.parse(raw)
    
    Transaction.data = data

    let counter = 0
    for (const record of data) {
      this.userIdIndexTable[record.userId] = counter
      counter++
    }
    return data
  }

  /**
   * clearData
   * @description clear the object data
   * @returns {array} an empty array
   */
  clearData () {
    Transaction.data = []
    this.userIdIndexTable = {}

    fs.writeFileSync(this.fileName, JSON.stringify(Transaction.data))
    return Transaction.data
  }

  /**
   * add
   * @description add a new transaction to a specific user
   * @param {string} userId The user id
   * @param {number} amount The amount of the transaction
   * @param {string} description Description
   * @param {date} date transaction date
   */
  add (userId, amount, description = '', date = new Date()) {
    if (!userId || userId === '') {
      throw new Error('A transaction must have an user id')
    }

    const data = {
      id: uuidv4(),
      amount,
      description,
      date
    }
    
    if (!Transaction.data.length) {
      const record = {
        transactions: [data],
        userId
      }
      Transaction.data.push(record)
      this.userIdIndexTable[userId] = 0
      return data
    }

    for (let i = 0; i < Transaction.data.length; i++) {
      if (Transaction.data[i].userId === userId) {
        Transaction.data[i].transactions.push(data)
        this.userIdIndexTable[userId] = i
        return data
      }
    }

    const record = {
      transactions: [data],
      userId
    }
    this.userIdIndexTable[userId] = Transaction.data.length
    Transaction.data.push(record)

    return data
  }

  /**
   * getByUserId
   * @description Get the user transactions
   * @param {string} userId The user id
   */
  getByUserId (userId = '') {
    if (!userId || userId === '') {
      return []
    }

    const userIdIndex = this.userIdIndexTable[String(userId)]
    if (!!userIdIndex || userIdIndex === 0) {
      return Transaction.data[userIdIndex].transactions.sort((a, b) => {
        return new Date(a.date).getTime() > new Date(b.date).getTime()
      })
    }

    return []
  }

  /**
   * getSumByUserId
   * @description Calculates the sum of the user transactions
   * @param {string} userId The user id
   * @returns {number} The sum of all user transactions
   */
  getSumByUserId (userId = '') {
    if (userId === '') {
      return 0
    }

    const userIdIndex = this.userIdIndexTable[String(userId)]
    if (!!userIdIndex || userIdIndex === 0) {
      let sum = 0
      for (let i = 0; i < Transaction.data[userIdIndex].transactions.length; i++) {
        sum += parseFloat(Transaction.data[userIdIndex].transactions[i].amount)
      }
      return sum
    }

    return 0
  }

  /**
   * getReportByUserId
   * @description Build the report of the user transactions
   * @param {string} userId The user id
   */
  getReportByUserId (userId = '') {
    if (userId === '') {
      return []
    }

    const userIdIndex = this.userIdIndexTable[String(userId)]
    const records = Transaction.data[userIdIndex].transactions.sort((a, b) => {
      return new Date(a.date).getTime() > new Date(b.date).getTime()
    })
    if (!records.length) {
      return []
    }

    const reportTransactions = []
    const firstDate = moment(records[0].date).utc()
    const finalDate = moment(records[records.length -1].date).utc()

    let thisFriday = moment(firstDate).day(5)
    let nextThursday = moment(firstDate).day(11) // 4 + 11
    let firstMonthDay = moment(firstDate).date(1)
    let lastMonthDay = moment([firstDate.year(), 0, 31]).month(firstDate.month()).utc()

    let currentWeek = {
      start: (thisFriday.get('month') === firstDate.get('month'))? thisFriday: firstMonthDay,
      end: (nextThursday.get('month') === firstDate.get('month'))? nextThursday: lastMonthDay,
      amount: 0,
      totalAmount: 0,
      transactions: []
    }

    currentWeek.weekdayStart = this.weekdays[currentWeek.start.weekday()]
    currentWeek.weekdayEnd = this.weekdays[currentWeek.end.weekday()]

    for (const transaction of records) {
      const transactionDate = moment(transaction.date).utc()
      if (currentWeek.start <= transactionDate && currentWeek.end >= transactionDate) {
        currentWeek.transactions.push(transaction)
        currentWeek.amount += transaction.amount
      } else {
        const totalAmount = currentWeek.totalAmount
        reportTransactions.push({...currentWeek})

        thisFriday = moment(transactionDate).day(-5) // last friday
        nextThursday = moment(transactionDate).day(4) // next thursday
        firstMonthDay = moment(transactionDate).date(1)
        lastMonthDay = moment([transactionDate.year(), 0, 31]).month(transactionDate.month()).utc()

        currentWeek.start = (thisFriday.get('month') === transactionDate.get('month'))? thisFriday: firstMonthDay
        currentWeek.end = (nextThursday.get('month') === transactionDate.get('month'))? nextThursday: lastMonthDay
        currentWeek.totalAmount = totalAmount + currentWeek.amount
        currentWeek.amount = transaction.amount
        currentWeek.weekdayStart = this.weekdays[currentWeek.start.weekday()]
        currentWeek.weekdayEnd = this.weekdays[currentWeek.end.weekday()]
        currentWeek.transactions = [transaction]
      }
    }

    return reportTransactions
  }

  /**
   * write
   * @description Writes in the data file all the transactions
   * @returns {array} All the transactions
   */
  write () {
    fs.writeFileSync(this.fileName, JSON.stringify(Transaction.data, null, 2))
    return Transaction.data
  }
}
