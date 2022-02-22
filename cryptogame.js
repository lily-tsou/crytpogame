const Tozny = require('@toznysecure/sdk/node')

const player1config = require('./client1config')
const player1 = new Tozny.storage.Client(player1config)
const player2config = require('./client2config')
const player2 = new Tozny.storage.Client(player2config)
const judgeconfig = require('./client3config')
const judge = new Tozny.storage.Client(judgeconfig)

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
 * Initialize the parties in the game based on the following assumptions:
 * 
 * Player 1 submits a move of rock, paper, or scissors that can only be viewed
 * by Player 1 and the judge.
 * 
 * Player 2 submits a move of rock, paper, or scissors that can be viewed by
 * Player 1, Player 2, and the judge.
 */
 async function initializeAccess(){
    share(player1, judgeconfig.clientId, 'move')
    share(player2, judgeconfig.clientId, 'move')
    share(player2, player1config.clientId, 'move')
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

/**
 * Revoke all access granted in initializeParties()
 */
async function revokeAllAccess(){
    revoke(player1, judgeconfig.clientId, 'move')
    revoke(player2, judgeconfig.clientId, 'move')
    revoke(player2, player1config.clientId, 'move')
}

/**
 * Find the current round number of a given player, the number of the last
 * round that they submitted.
 */
async function getRound(player){
    try {
        const request = new Tozny.types.Search(true)
        request.match({ type: 'move'})
        const resultQuery = await player.search(request)
        const found = await resultQuery.next()
        return parseInt(found[found.length - 1].data.round);
      } catch(e) {
        console.error(e)
      }
}

async function setupMove(playerName, move){
    console.log(`Submitting move for ${playerName}`)
    if(playerName === 'player1'){
        let round = await getRound(player1)
        recordMove(player1, move, round + 1)


    }
    else if(playerName === 'player2'){
        let round = await getRound(player2)
        recordMove(player2, move, round + 1)
    }
    else{
        console.log("Not a valid player")
    }
}

async function recordMove(player, moveChoice, roundNumber){
    try {
        const submitted = await player.writeRecord(
          'move',
          {
            move: moveChoice.toString(),
            round: roundNumber.toString(),
          }
        //   {                              
        //     round: roundNumber.toString();
        //   }
        )
    
        const read = await player.readRecord(submitted.meta.recordId)
        console.log(`${read.data.move} submitted for round # ${read.data.round}`)
  
      } catch(e) {
        console.error(e)
      }
}

async function main(){
    //initializeAccess()
    //revokeAllAccess()
    setupMove("player2", "scissors")
}

main()