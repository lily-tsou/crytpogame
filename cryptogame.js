const Tozny = require('@toznysecure/sdk/node')

const player1config = require('./client1config')
const player1 = new Tozny.storage.Client(player1config)
const player2config = require('./client2config')
const player2 = new Tozny.storage.Client(player2config)
const judgeconfig = require('./client3config')
const judge = new Tozny.storage.Client(judgeconfig)

/**
 * Initialize the parties in the game based on the following assumptions:
 * 
 * Player 1 submits a move of rock, paper, or scissors that can only be viewed
 * by Player 1 and the judge.
 * 
 * Player 2 submits a move of rock, paper, or scissors that can be viewed by
 * Player 1, Player 2, and the judge.
 */
async function initializeParties(){
    share(player1, judgeconfig.clientId, 'move')
    share(player2, judgeconfig.clientId, 'move')
    share(player2, player1config.clientId, 'move')
}

/**
 * Share a record of a given type.
 */
async function share(sharer, receiverId, type) {
    try {
      await sharer.share(type, receiverId)
      console.log(`${type} shared with ${receiverId}`)
    } catch(e) {
      console.error(e)
    }
}

/**
 * Revoke a record of a given type.
 */
async function revoke(revoker, revokeFromId, type){
    try{
        await revoker.revoke(type, revokeFromId)
        console.log(`${type} no longer shared with ${revokeFromId}`)
    }catch(e) {
        console.error(e)
    }
}

function main(){
    // initializeParties();
}

main()