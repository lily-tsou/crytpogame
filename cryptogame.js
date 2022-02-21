const Tozny = require('@toznysecure/sdk/node')

const config1 = require('./client1config')
const player1 = new Tozny.storage.Client(config1)

const config2 = require('./client2config')
const player2 = new Tozny.storage.Client(config2)

