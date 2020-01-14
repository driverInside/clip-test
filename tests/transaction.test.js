const fs = require('fs')
const faker = require('faker')
const request = require('supertest')
const app = require('../app')

const Transaction = require('../lib/transaction')
const transaction = new Transaction()

describe('Transactions', () => {
  describe('Transaction class', () => {
    it('should create a new object', () => {
      expect(typeof transaction).toBe('object')
    })

    it('should clear the data', () => {
      const result = transaction.clearData()
      expect(result).toHaveLength(0)

      const data = transaction.getData()
      expect(data).toHaveLength(0)
    })

    describe('Add transaction', () => {
      beforeEach((() => {
        transaction.clearData()
      }))

      it('should throw an error if a transaction doesnt have user id', () => {
        expect(() => {
          transaction.add()
        }).toThrow(Error)
      })

      it('should add transactions', () => {
        expect(transaction.getData()).toHaveLength(0)
        for (let i = 0; i < 6; i++) {
          const userId = faker.random.number()
          const amount = 123
          const description = 'Lorem ipsum'
          const date = new Date()

          const result = transaction.add(userId, amount, description, date)
          expect(result).toHaveProperty('id')
        }
        
        expect(transaction.getData()).toHaveLength(6)
      })
    })

    describe('Find a transaction', () => {
      beforeEach((() => {
        transaction.clearData()
      }))

      it('should return -1 if a transaction doesnt exist', () => {
        const userId = faker.random.number()
        const amount = 123
        const description = 'Lorem ipsum'
        const date = new Date()

        const result = transaction.add(userId, amount, description, date)
        expect(transaction.find('lorem', result.id)).toBe(-1)
        expect(transaction.find(userId, 'ipsum')).toBe(-1)
      })

      it('should find a transaction', () => {
        const userId = String(faker.random.number())

        for (let i = 0; i < 5; i++) {
          transaction.add(
            userId,
            faker.random.number(),
            faker.random.words(),
          )
        }

        const result = transaction.add(
          userId,
          faker.random.number(),
          faker.random.words(),
        )
        const record = transaction.find(userId, result.id)

        expect(record).toHaveProperty('id')
        expect(record).toHaveProperty('amount')
        expect(record).toHaveProperty('date')
      })
    })

    describe('List transactions', () => {
      beforeEach((() => {
        transaction.clearData()
      }))
      
      it('should return an empty list', () => {
        const transactionsNoId = transaction.getByUserId()
        expect(transactionsNoId).toHaveLength(0)

        const result = transaction.add(
          faker.random.number(),
          faker.random.number(),
          faker.random.words(),
        )        
        const transactionsNotFound = transaction.getByUserId('foo')
        expect(transactionsNotFound).toHaveLength(0)
      })

      it('should return a list of transaction sorted by date', () => {
        const userId = faker.random.number()
        for (let i = 0; i < 5; i++) {
          transaction.add(
            userId,
            faker.random.number(),
            faker.random.words(),
            faker.date.past()
          )          
        }

        const transactions = transaction.getByUserId(userId)
        expect(transactions).toHaveLength(5)

        let current = transactions[0]
        for (let i = 1; i < 5; i++) {
          expect(new Date(current.date).getTime())
            .toBeLessThanOrEqual(new Date(transactions[i].date).getTime()) 
          current = transactions[i]
        }
      })
    })

    describe('Sum transactions', () => {
      beforeEach((() => {
        transaction.clearData()
      }))

      it('should get 0 if user doesnt exist', () => {
        const sum = transaction.getSumByUserId()
        expect(sum).toBe(0)
      })

      it('should return the sum of the transactions', () => {
        const userId = faker.random.number()
        let total = 0

        for (let i = 0; i < 10; i++) {
          const amount = faker.random.number()
          
          transaction.add(
            userId,
            amount,
            faker.random.words(),
            faker.date.past()
          )

          total += amount
        }

        expect(transaction.getSumByUserId(userId)).toBe(total)
      })
    })

    describe('Report by user', () => {
      let report
      beforeAll(() => {
        transaction.clearData()
        loadReportExample()
        report = transaction.getReportByUserId('123')
      })

      it('should return an empty array', () => {
        const emptyReport = transaction.getReportByUserId()
        expect(emptyReport).toHaveLength(0)
      })

      it('should return a report with at least one record', () => {
        expect(report.length).toBeGreaterThanOrEqual(0)
      })

      it('should return a report with weeks', () => {
        for (const week of report) {
          expect(week).toHaveProperty('start')
          expect(week).toHaveProperty('end')
          expect(week).toHaveProperty('amount')
          expect(week).toHaveProperty('totalAmount')
          expect(week).toHaveProperty('transactions')
          expect(week.transactions.length).toBeGreaterThanOrEqual(0)
        }
      })

      it('should return return the first week starting at Sep 28th and ending sept 30th', () => {
        const firstWeek = report[0]
        const startDate = new Date(firstWeek.start)
        const endDate = new Date(firstWeek.end)

        expect(startDate.getMonth()).toBe(8)
        expect(startDate.getDate()).toBe(28)
        expect(startDate.getFullYear()).toBe(2018)
        expect(endDate.getMonth()).toBe(8)
        expect(endDate.getDate()).toBe(30)
        expect(endDate.getFullYear()).toBe(2018)
      })

      it('should get the first week with two transactions', () => {
        expect(report[0].transactions).toHaveLength(2)
      })

      it('should the amount of the first week to be 21.22', () => {
        expect(report[0].amount).toBe(21.22)
      })

      it('should the total amount in the first week to be 0', () => {
        expect(report[0].totalAmount).toBe(0)
      })

      it('should the second week starts at Oct 1st and ends at oct 4th', () => {
        const secondWeek = report[1]
        const startDate = new Date(secondWeek.start)
        const endDate = new Date(secondWeek.end)

        expect(startDate.getMonth()).toBe(9)
        expect(startDate.getDate()).toBe(1)
        expect(startDate.getFullYear()).toBe(2018)
        expect(endDate.getMonth()).toBe(9)
        expect(endDate.getDate()).toBe(4)
        expect(endDate.getFullYear()).toBe(2018)
      })

      it('should the second week with one transaction', () => {
        expect(report[1].transactions).toHaveLength(1)
      })

      it('should the amount of the second week to be 10.22', () => {
        expect(report[1].amount).toBe(10.22)
      })

      it('should the total amount in the second week to be 21.22', () => {
        expect(report[1].totalAmount).toBe(21.22)
      })

      it('should the third week starts at Feb 1st and ends at Feb 7th', () => {
        const third = report[2]
        const startDate = new Date(third.start)
        const endDate = new Date(third.end)

        expect(startDate.getMonth()).toBe(1)
        expect(startDate.getDate()).toBe(1)
        expect(startDate.getFullYear()).toBe(2019)
        expect(endDate.getMonth()).toBe(1)
        expect(endDate.getDate()).toBe(7)
        expect(endDate.getFullYear()).toBe(2019)
      })
    })
  })

  describe('Transaction API', () => {
    describe('GET /api/transactions', () => {
      beforeAll(() => {
        transaction.clearData()
        loadReportExample()
      })

      it('should return two objects', async () => {
        const res = await request(app)
          .get('/api/transactions')

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveLength(2)
      })
    })

    describe('POST /api/transactions', () => {
      beforeAll(() => {
        transaction.clearData()
        loadReportExample()
      })

      it('should add a transaction to a specific user', async () => {
        const res = await request(app)
          .post('/api/transactions/987')
          .send({
            amount: 1.23,
            description: 'Joes tacos',
            date: '2018-12-30'
          })
        expect(res.statusCode).toBe(201)
        expect(res.body).toHaveProperty('id')
        expect(res.body).toHaveProperty('amount')
        expect(res.body).toHaveProperty('date')
        expect(res.body).toHaveProperty('description')
      })
    })

    describe('GET /api/transactions/:userId', () => {
      beforeAll(() => {
        transaction.clearData()
        loadReportExample()
      })

      it('should return an empty array', async () => {
        const res = await request(app)
          .get('/api/transactions/777')
        
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveLength(0)
      })

      it('should return an array with an item', async () => {
        const res = await request(app)
          .get('/api/transactions/987')

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveLength(1)
      })
    })

    describe('GET /api/transactions/:userId/:transactionsId', () => {
      beforeAll(() => {
        transaction.clearData()
        loadReportExample()
      })

      it('should return not found', async () => {
        const res = await request(app)
          .get('/api/transactions/111/222')

        expect(res.statusCode).toBe(404)
      })

      it('should return a single transaction', async () => {
        const result = transaction.add(
          '987',
          123,
          'Lorem ipsum',
          new Date()
        )

        const res = await request(app)
          .get('/api/transactions/987/' + result.id)

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('id')
        expect(res.body).toHaveProperty('amount')
        expect(res.body).toHaveProperty('description')
        expect(res.body).toHaveProperty('date')
      })
    })

    describe('GET /api/transactions/:userId/sum', () => {
      beforeAll(() => {
        transaction.clearData()
        loadReportExample()
      })

      it('should return the sum of the amounts', async () => {
        const res = await request(app)
          .get('/api/transactions/987/sum')

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('userId')
        expect(res.body).toHaveProperty('sum')
      })
    })

    describe('GET /api/transactions/:userId/report', async () => {
      beforeAll(() => {
        transaction.clearData()
        loadReportExample()
      })

      it('should generate the transaction report for a specific user', async () => {
        const res = await request(app)
          .get('/api/transactions/123/report')

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveLength(5)
        for (const week of res.body) {
          expect(week).toHaveProperty('weekStart')
          expect(week).toHaveProperty('weekEnd')
          expect(week).toHaveProperty('quantity')
          expect(week).toHaveProperty('amount')
          expect(week).toHaveProperty('totalAmount')
        }
      })
    })
  })
})

function loadReportExample () {
  const raw = fs.readFileSync('tests/reportExample.json')
  const data = JSON.parse(raw)

  for (const record of data) {
    const userId = record.userId

    for (const trans of record.transactions) {
      transaction.add(
        userId,
        trans.amount,
        trans.description,
        trans.date
      )
    }
    transaction.write()
  }
}