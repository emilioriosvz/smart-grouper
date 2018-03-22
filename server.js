const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const grouper = require('./lib/grouper')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/grouper', (req, res) => {
  const payload = req.body.text
  const minSize = req.query.minSize || 5
  const lang = req.query.lang
  const result = grouper(payload, minSize, lang)

  return res.json(result)
})

app.all('*', (req, res) => res.status(404).send({success: false, response: '404 Not Found'}))

app.listen(3000, () => console.log(`SMART GROUPER RUNING http://localhost:${3000}`))
