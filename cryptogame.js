const Tozny = require('@toznysecure/sdk/node')

const player1config = require('./client1config')
const player1 = new Tozny.storage.Client(player1config)
const player2config = require('./client2config')
const player2 = new Tozny.storage.Client(player2config)
const judgeconfig = require('./client3config')
const judge = new Tozny.storage.Client(judgeconfig)

let moves = ["scissors", "paper", "rock"];

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
     //TODO set up with round 0
    share(player1, judgeconfig.clientId, 'moveb')
    share(player2, judgeconfig.clientId, 'moveb')
    share(player2, player1config.clientId, 'moveb')
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
    revoke(player1, judgeconfig.clientId, 'moveb')
    revoke(player2, judgeconfig.clientId, 'moveb')
    revoke(player2, player1config.clientId, 'moveb')
}

/**
 * Find the current round number of a given player, the number of the last
 * round that they submitted.
 */
async function getRound(player){
    try {
        const request = new Tozny.types.Search(true)
        request.match({ type: 'moveb'})
        const resultQuery = await player.search(request)
        const found = await resultQuery.next()
        return parseInt(found[found.length - 1].data.round);
      } catch(e) {
        console.error(e)
      }
}

async function submitMove(playerName, move){
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
    //TODO make round metadata
    try {
        const submitted = await player.writeRecord(
          'moveb',
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

async function declareWinner(round){
    let move1 = await getMove(player1config.clientId, round)
    let move2 = await getMove(player2config.clientId, round)
    console.log(round + " " + move1 + " " + move2)

    if(move1 === move2)
        console.log("draw")
    else{
        if(moves[(moves.indexOf(move1) + 1) % 3] === move2){
            console.log("player 1 is the winner")
        }
        else
            console.log("player 2 is the winner")
    }
}

async function getMove(playerId, round){
    try {
        const request = new Tozny.types.Search(true, true)
        request.match({ type: 'moveb', writers: playerId}, 'AND', 'EXACT')
        const resultQuery = await judge.search(request)
        const moves = await resultQuery.next()
        for (let move of moves) {
          if(parseInt(move.data.round) === round){
            return move.data.move;
        }
        }
        console.error(`No move submitted for ${playerId} for round ${round}`)
      } catch(e) {
        console.error(e)
      }
}

async function main(){

}

main()