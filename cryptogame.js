const Tozny = require('@toznysecure/sdk/node')

//All possible moves for a game of rock paper scissors
let moves = ["scissors", "paper", "rock"];

/**
 * Share a record of a given type.
 */
async function share(sharer, receiverId, type) {
  try {
    await sharer.share(type, receiverId)
    console.log(`${type} shared with ${receiverId}`)
  } catch (e) {
    console.error(e)
  }
}

/**
 * Give access to the players and judge with the following specifications:
 * 
 * Player 1's moves can only be viewed by Player 1 and the judge.
 * Player 2's moves can be viewed by Player 1, Player 2, and the judge.
 * The judge's winner decision can be viewed by the judge, Player 1,
 * and Player 2.  
 */
async function giveAccess(player1, player2, judge) {
  share(player1, judge.config.clientId, 'move')
  share(player2, judge.config.clientId, 'move')
  share(player2, player1.config.clientId, 'move')
  share(judge, player1.config.clientId, 'winner')
  share(judge, player2.config.clientId, 'winner')
  share(judge, player1.config.clientId, 'judge')
  share(judge, player2.config.clientId, 'judge')
}

/**
 * Revoke a record of a given type.
 */
async function revoke(revoker, revokeFromId, type) {
  try {
    await revoker.revoke(type, revokeFromId)
    console.log(`${type} no longer shared with ${revokeFromId}`)
  } catch (e) {
    console.error(e)
  }
}

/**
* Revoke all access granted in initializeParties()
*/
async function revokeAllAccess(player1, player2, judge) {
  revoke(player1, judge.config.clientId, 'move')
  revoke(player2, judge.config.clientId, 'move')
  revoke(player2, player1.config.clientId, 'move')
  revoke(judge, player1.config.clientId, 'winner')
  revoke(judge, player2.config.clientId, 'winner')
}

/**
 * Initialize the players in the judge's records.
 * Set the player IDs and the player names.
 */
async function initPlayers(player1, player1Name, player2, player2Name, judge) {
  try {
    const submitted = await judge.writeRecord(
      'players',
      {
        player1Id: player1.config.clientId,
        player2Id: player2.config.clientId,
        player1Name: player1Name,
        player2Name: player2Name
      }
    )
    const players = await judge.readRecord(submitted.meta.recordId)
    console.log(`Player 1 recorded with ID ${players.data.player1Id} and name ${players.data.player1Name}`)
    console.log(`Player 2 recorded with ID ${players.data.player2Id} and name ${players.data.player2Name}`)
  } catch (e) {
    console.error(e)
  }
}

/**
 * Set the judge ID.
 */
async function initJudge(judge) {
  console.log(judge)
  try {
    const submitted = await judge.writeRecord(
      'judge',
      {
        judgeId: judge.config.clientId
      }
    )
    const judgeInfo = await judge.readRecord(submitted.meta.recordId)
    console.log(`Judge recorded with ID ${judgeInfo.data.judgeId}`)
  } catch (e) {
    console.error(e)
  }
}

/**
 * Get the current round number of a player (the number of the last
 * round they submitted).
 */
async function getRound(player, playerId) {
  try {
    const request = new Tozny.types.Search(true, true)
    request.match({ type: 'move', writers: playerId }, 'AND', 'EXACT')
    const resultQuery = await player.search(request)
    const found = await resultQuery.next()
    return parseInt(found[found.length - 1].data.round)
  } catch (e) {
    console.error(e)
  }
}

/**
 * Submit a record of type `move`.
 */
async function recordMove(player, playerName, move) {
  let round = await getRound(player, player.config.clientId) + 1
  if (isNaN(round))
    round = 1
  try {
    const submitted = await player.writeRecord(
      'move',
      {
        move: move.toLowerCase(),
        round: round.toString(),
      }
    )
    const read = await player.readRecord(submitted.meta.recordId)
    console.log(`${playerName} recorded ${read.data.move} for round #${read.data.round}`)
  } catch (e) {
    console.error(e)
  }
}

/**
 * Get a player's move for a specified round.
 */
async function getMove(searcher, toSearchId, round) {
  try {
    const request = new Tozny.types.Search(true, true)
    request.match({ type: 'move', writers: toSearchId }, 'AND', 'EXACT')
    const resultQuery = await searcher.search(request)
    const moves = await resultQuery.next()
    for (let move of moves) {
      if (parseInt(move.data.round) === parseInt(round)) {
        return move.data.move;
      }
    }
    console.error(`No move submitted for ${toSearchId} for round ${round}`)
  } catch (e) {
    console.error(e)
  }
}

/**
 * Get the info (names or IDs) of the players.
 */
async function getPlayerInfo(judge, type) {
  try {
    const request = new Tozny.types.Search(true)
    request.match({ type: 'players' })
    const resultQuery = await judge.search(request)
    const found = await resultQuery.next()

    // Return the latest record, as this will be for the most recent game.
    if (type.toLowerCase() === "id")
      return [found[found.length - 1].data.player1Id, found[found.length - 1].data.player2Id]
    else if (type.toLowerCase() === "name")
      return [found[found.length - 1].data.player1Name, found[found.length - 1].data.player2Name]

  } catch (e) {
    console.error(e)
  }
}

/**
 * Determine the winner of a round using these rules:
 * Rock beats scissors, scissors beats paper, paper beats rock.
 */
async function determineWinner(judge, round) {
  let playerIds = await getPlayerInfo(judge, "id")
  let playerNames = await getPlayerInfo(judge, "name")
  let p1Move = await getMove(judge, playerIds[0], round)
  let p2Move = await getMove(judge, playerIds[1], round)
  //A player has submitted an invalid move
  if (!moves.includes(p1Move) || !moves.includes(p2Move))
    return "Invalid Round"
  if (p1Move === p2Move)
    return "Draw"
  if (moves[(moves.indexOf(p1Move) + 1) % 3] === p2Move)
    return playerNames[0]
  else
    return playerNames[1]
}

/**
 * Submit a record of type `winner`.
 */
async function recordWinner(judge, round) {
  let winner = await determineWinner(judge, round)
  try {
    const submitted = await judge.writeRecord(
      'winner',
      {
        winner: winner,
        round: round.toString(),
      }
    )
    const read = await judge.readRecord(submitted.meta.recordId)
    console.log(`${read.data.winner} submitted for round #${read.data.round}`)
  } catch (e) {
    console.error(e)
  }
}

/**
 * Attempt to cheat on a move.
 * If a player has their opponent's ID and access to their `move` records, then
 * that player is able to look up their opponents latest move and submit a counter 
 * move that will beat it.
 */
async function tryCheat(player1, player2Id) {
  let p1Round = await getRound(player1, player1.config.clientId)
  let p2Round = await getRound(player1, player2Id)
  if (p1Round === p2Round - 1) {
    let p2Move = await getMove(player1, player2Id, p2Round)
    let move = moves[(moves.indexOf(p2Move) - 1 + 3) % 3]
    recordMove(player1, "Alicia", move)
  }
  else {
    console.error("Cannot cheat")
  }
}

/**
 * Get the ID of the judge.
 */
async function getJudgeId(player) {
  try {
    // You cannot check that the writer of this record is the judge (since 
    // you do not yet know the judge ID) so there must be some inherent trust. 
    // A better solution may be to have a hardcopy of the judge ID or to 
    // do an initial key exchange.
    const request = new Tozny.types.Search(true, true)
    request.match({ type: 'judge' })
    const resultQuery = await player.search(request)
    const found = await resultQuery.next()
    return found[found.length - 1].data.judgeId
  } catch (e) {
    console.error(e)
  }
}

/**
 * Get the round winner determined by the judge.
 */
async function getWinner(player, round) {
  let judgeId = await getJudgeId(player)
  try {
    const request = new Tozny.types.Search(true, true)
    request.match({ type: 'winner', writers: judgeId }, 'AND', 'EXACT')
    const resultQuery = await player.search(request)
    const winners = await resultQuery.next()
    for (let winner of winners) {
      if (winner.data.round === round) {
        return winner.data.winner;
      }
    }
    console.error(`No winner found for round ${round}`)
    return null
  } catch (e) {
    console.error(e)
  }
}

/**
 * Delete all all records of a specified type. 
 */
async function deleteAllClientRecords(client, type) {
  try {
    const request = new Tozny.types.Search(true)
    request.match({ type: type })
    const resultQuery = await client.search(request)
    const moves = await resultQuery.next()
    for (let move of moves)
      await client.deleteRecord(move.meta.recordId, move.meta.version)
  } catch (e) {
    console.error(e)
  }
}

/**
* Delete all game records from all participants.
*/
async function deleteAllGameRecords(player1, player2, judge) {
  deleteAllClientRecords(judge, 'players')
  deleteAllClientRecords(judge, 'judge')
  deleteAllClientRecords(judge, 'winner')
  deleteAllClientRecords(player1, 'move')
  deleteAllClientRecords(player2, 'move')
}

/**
 * Process changes to the game state.
 * Initialize: Share all records with the appropriate parties and record the player
 * and judge info.
 * Reset: Revoke all record sharing and delete all game records.
 */
async function game(args) {
  const player1Name = args[2]
  const player1Config = require(args[3])
  const player1 = new Tozny.storage.Client(player1Config)
  const player2Name = args[4]
  const player2Config = require(args[5])
  const player2 = new Tozny.storage.Client(player2Config)
  const judgeConfig = require(args[6])
  const judge = new Tozny.storage.Client(judgeConfig)

  if (args[1].toLowerCase() === "init") {
    giveAccess(player1, player2, judge)
    initPlayers(player1, player1Name, player2, player2Name, judge)
    initJudge(judge)
  }
  else if (args[1].toLowerCase() === "reset") {
    revokeAllAccess(player1, player2, judge)
    deleteAllGameRecords(player1, player2, judge)
  }
}

/**
 * Load a Tozny storage client based on the user input and either
 * submit a move or show the winner of a round.
 */
async function player(args) {
  const playerName = args[1]
  const playerConfig = require(args[2])
  const player = new Tozny.storage.Client(playerConfig)

  if (args[0].toLowerCase() === "move") {
    let move = args[3]
    recordMove(player, playerName, move)
  }
  else if (args[0].toLowerCase() === "cheat") {
    const player2Id = args[3]
    tryCheat(player, player2Id)
  }
  else if (args[0].toLowerCase() === "show-winner") {
    const round = args[3]
    const judgeId = args[4]
    let winner = await getWinner(player, round)
    if (winner)
      console.log(winner)
  }
}

/**
 * Load a Tozny storage client based on the user input and submit 
 * a winner.
 */
async function judge(args) {
  const judgeConfig = require(args[1])
  const judge = new Tozny.storage.Client(judgeConfig)
  const round = args[2]
  recordWinner(judge, round)
}

/**
 * Main driver.
 */
async function main() {
  const args = process.argv.slice(2)
  if (args[0].toLowerCase() === "game")
    game(args)
  else if (args[0].toLowerCase() === "move" || args[0] === "show-winner" || args[0] === "cheat")
    player(args)
  else if (args[0].toLowerCase() === "record-winner")
    judge(args)
  else
    console.error("Invalid option")
}

main()