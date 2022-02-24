const Tozny = require('@toznysecure/sdk/node')

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

async function initGame(alicia, bruce, clarence){
    share(alicia, clarence.config.clientId, 'move')
    share(bruce, clarence.config.clientId, 'move')
    share(bruce, alicia.config.clientId, 'move')
    share(clarence, alicia.config.clientId, 'winner')
    share(clarence, bruce.config.clientId, 'winner')
}

 async function initPlayers(clarence, alicia, bruce){
    try {
        const submitted = await clarence.writeRecord(
          'players',
          {
            aliciaId: alicia.config.clientId,
            bruceId: bruce.config.clientId,
          }
        )
        const players = await clarence.readRecord(submitted.meta.recordId)
        console.log(`alicia recorded with ID ${players.data.aliciaId}`)
        console.log(`bruce recorded with ID ${players.data.bruceId}`)
      } catch(e) {
        console.error(e)
      }
}

async function getPlayers(clarence){
    try {
        const request = new Tozny.types.Search(true) 
        request.match({ type: 'players' })
        const resultQuery = await clarence.search(request)
        const found = await resultQuery.next()
        return [found[found.length -1].data.aliciaId, found[found.length - 1].data.bruceId]
      } catch(e) {
        console.error(e)
      }
}

async function getMove(clarence, playerId, round){
    try {
        const request = new Tozny.types.Search(true, true)
        request.match({ type: 'move', writers: playerId}, 'AND', 'EXACT')
        const resultQuery = await clarence.search(request)
        const moves = await resultQuery.next()
        for (let move of moves) {
            if(move.data.round === round){
                return move.data.move;
            }
        }
        console.error(`No move submitted for ${playerId} for round ${round}`)
      } catch(e) {
        console.error(e)
      }
}

async function getWinner(clarence, round){
    let players = await getPlayers(clarence)
    let aliciaId = players[0]
    let bruceId = players[1]
    let aliciaMove = await getMove(clarence, aliciaId, round)
    let bruceMove = await getMove(clarence, bruceId, round)
    console.log("Alicia " + aliciaMove)
    console.log("Bruce " + bruceMove)

    if(aliciaMove === bruceMove)
        return "draw"
    else{
        if(moves[(moves.indexOf(aliciaMove) + 1) % 3] === bruceMove){
            return "Alicia"
        }
        else
            return "Bruce"
    }
}

async function recordWinner(clarence, round){
     //TODO make round metadata
    let winner = await getWinner(clarence, round)
    try {
        const submitted = await clarence.writeRecord(
          'winner',
          {
            winner: winner,
            round: round.toString(),
          }
        )
        const read = await clarence.readRecord(submitted.meta.recordId)
        console.log(`${read.data.winner} submitted for round #${read.data.round}`)
      } catch(e) {
        console.error(e)
      }
}

async function main(){
    const args = process.argv.slice(2)
    const clarenceConfig = require(args[1])
    const clarence = new Tozny.storage.Client(clarenceConfig)
    
    if(args[0].toLowerCase() === "record"){
        const round = args[2]
        recordWinner(clarence, round)
    }
    else if (args[0].toLowerCase() === "init"){
        const aliciaConfig = require(args[2])
        const alicia = new Tozny.storage.Client(aliciaConfig)
        const bruceConfig = require(args[3])
        const bruce = new Tozny.storage.Client(bruceConfig)
        initPlayers(clarence, alicia, bruce)
        initGame(alicia, bruce, clarence)
    }
    else
        console.error("Invalid option") 
}

main()