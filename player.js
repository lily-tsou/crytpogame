const Tozny = require('@toznysecure/sdk/node')

/**
 * Find the current round number of a given player (the number of the last
 * round that they submitted)
 */
async function getRound(player){
    try {
        const request = new Tozny.types.Search(true)
        request.match({ type: 'move'})
        const resultQuery = await player.search(request)
        const found = await resultQuery.next()
        return parseInt(found[found.length - 1].data.round)
      } catch(e) {
        console.error(e)
      }
}

async function recordMove(player, playerName, move){
    let round = await getRound(player) + 1
    try {
        const submitted = await player.writeRecord(
          'move',
          {
            move: move,
            round: round.toString(),
          }
        )
    
        const read = await player.readRecord(submitted.meta.recordId)
        console.log(`${playerName} recorded ${read.data.move} for round #${read.data.round}`)
  
      } catch(e) {
        console.error(e)
      }
}

async function getMove(playerId, round){
    try {
        const request = new Tozny.types.Search(true, true)
        request.match({ type: 'move', writers: playerId}, 'AND', 'EXACT')
        const resultQuery = await clarence.search(request)
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

async function getWinner(player, round, clarenceId){
  try {
      const request = new Tozny.types.Search(true, true)
      request.match({ type: 'winner', writers: clarenceId}, 'AND', 'EXACT')
      const resultQuery = await player.search(request)
      const winners = await resultQuery.next()
      for (let winner of winners) {
        if(winner.data.round === round){
          return winner.data.winner;
      }
      }
      console.error(`No move winner found for round ${round}`)
    } catch(e) {
      console.error(e)
    }
}

async function main(){
    const args = process.argv.slice(2)
    if (args.length >= 3){
        const playerName = args[1]
        const playerConfig = require(args[2])
        const player = new Tozny.storage.Client(playerConfig)
        if(args[0].toLowerCase() === "move"){
            move = args[3]
            recordMove(player, playerName, move)
        }
        else if(args[0].toLowerCase() === "winner"){
            const round = args[3]
            const clarenceConfig = require(args[4])
            let winner = await getWinner(player, round, clarenceConfig.clientId)
            console.log(winner)
          }
        else
            console.error("Invalid option")
    }
    else
        console.error("Invalid option")
}

main()