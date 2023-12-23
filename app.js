const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const app = express()
app.use(express.json())
const dbpath = path.join(__dirname, 'covid19India.db')

let db = null
const functiondb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running...')
    })
  } catch (error) {
    console.log(`Database Error ${error.message}`)
    process.exit(1)
  }
}

functiondb()

app.get('/states', async (request, response) => {
  try {
    const querry = `SELECT * FROM state;`
    const states = await db.all(querry)
    const funName = data => {
      return {
        stateId: data.state_id,
        stateName: data.state_name,
        population: data.population,
      }
    }
    response.send(states.map(each => funName(each)))
  } catch (error) {
    console.log(`Querry Error ${error.message}`)
  }
})

//state numbers

app.get('/states/:stateId', async (request, response) => {
  try {
    const {stateId} = request.params
    const querry = `SELECT * FROM state WHERE state_id=?;`
    const states = await db.get(querry, [stateId])
    const funName = data => {
      return {
        stateId: data.state_id,
        stateName: data.state_name,
        population: data.population,
      }
    }
    response.send(funName(states))
  } catch (error) {
    console.log(`Querry Error ${error.message}`)
  }
})

// post districts

app.post('/districts/', async (request, response) => {
  try {
    const {districtName, stateId, cases, cured, active, deaths} = request.body
    const querry = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
  VALUES(?,?,?,?,?,?)`
    await db.run(querry, [districtName, stateId, cases, cured, active, deaths])
    response.send('District Successfully Added')
  } catch (error) {
    console.log(`Querry Error ${error.message}`)
  }
})

//single distric

app.get('/districts/:districtId/', async (request, response) => {
  try {
    const {districtId} = request.params
    const querry =
      'SELECT * FROM district WHERE district_id = ? GROUP BY district_id;'
    const result = await db.get(querry, [districtId])
    const districfun = data => {
      return {
        districtId: data.district_id,
        districtName: data.district_name,
        stateId: data.state_id,
        cases: data.cases,
        cured: data.cured,
        active: data.active,
        deaths: data.deaths,
      }
    }
    response.send(districfun(result))
  } catch (error) {
    console.log(`Querry Error ${error.message}`)
  }
})

//delete distric

app.delete('/districts/:districtId/', async (request, response) => {
  try {
    const {districtId} = request.params
    const querry = 'DELETE FROM district WHERE district_id = ?'
    await db.run(querry, [districtId])
    response.send('District Removed')
  } catch (error) {
    console.log(`Querry Error ${error.message}`)
  }
})

//update distric

app.put('/districts/:districtId', async (request, response) => {
  try {
    const {districtId} = request.params
    const districtDetails = request.body
    const {districtName, stateId, cases, cured, active, deaths} =
      districtDetails
    const querry = `UPDATE district
    SET  district_name = ?,state_id=?,cases =?,cured=?,active=?,deaths=?
    WHERE district_id=?;`
    await db.run(querry, [
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
      districtId,
    ])
    response.send('District Details Updated')
  } catch (error) {
    console.log(`Querry Error ${error.message}`)
  }
})

//stats
app.get('/states/:stateId/stats/', async (request, response) => {
  try {
    const {stateId} = request.params
    const querry =
      'SELECT sum(cases),sum(cured),sum(active),sum(deaths) FROM district WHERE state_id = ? GROUP BY state_id;'
    const result = await db.get(querry, [stateId])

    response.send({
      totalCases: result['sum(cases)'],
      totalCured: result['sum(cured)'],
      totalActive: result['sum(active)'],
      totalDeaths: result['sum(deaths)'],
    })
  } catch (error) {
    console.log(`Querry Error ${error}`)
  }
})

app.get('/districts/:districtId/details/', async (request, response) => {
  try {
    const {districtId} = request.params
    const querry = 'SELECT state_id FROM district WHERE district_id = ?'
    const result = await db.get(querry, [districtId])
    const querr = 'SELECT state_name as stateName FROM state WHERE state_id = ?'
    const resul = await db.get(querr, [result.state_id])

    response.send(resul)
  } catch (error) {
    console.log(`Querry Error ${error}`)
  }
})

module.exports = app
