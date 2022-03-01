const Tozny = require('@toznysecure/sdk/node')

//All possible moves for a game of rock paper scissors
let moves = ["scissors", "paper", "rock"];

/**
 * Share a record of a given type.
 * 
 * @param {object} sharer     Tozny storage client sharing their record.
 * @param {string} receiverId Client ID of the Tozny storage client receiving the record.
 * @param {string} type       The type of record to share.
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
 * 
 * @param {object} player1 Tozny storage client for player 1.
 * @param {object} player1 Tozny storage client for player 2.
 * @param {object} judge   Tozny storage client for the judge.
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
 *
 * @param {object} revoker      Tozny storage client revoking their record.
 * @param {string} revokeFromId Client ID of the Tozny storage client that will no 
 *                              longer have access to the record.
 * @param {string} type         The type of record to revoke.
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
 * 
 * @param {object} player1  Tozny storage client for player 1.
 * @param {object} player1  Tozny storage client for player 2.
 * @param {object} judge    Tozny storage client for the judge.
*/
async function revokeAllAccess(player1, player2, judge) {
  revoke(player1, judge.config.clientId, 'move')
  revoke(player2, judge.config.clientId, 'move')
  revoke(player2, player1.config.clientId, 'move')
  revoke(judge, player1.config.clientId, 'winner')
  revoke(judge, player2.config.clientId, 'winner')
}

/**
 * Write a record to a specificed Tozny storage client with a given type, data, and metadata.
 * 
 * @param {object} client     Tozny storage client to write the record to.
 * @param {string} type       The type of record to write.
 * @param {object} data       The data to be encrypted before writing to the record.
 * @param {object} meta       The data to be written in plaintext to the record. 
 *                            Default value is an empty object to account for no meta data.
 * 
 * @returns {Promise<object>} The record returned after being written to the Tozny 
 *                            storage client.
 */
async function submitRecord(client, type, data, meta = {}) {
  try {
    const submitted = await client.writeRecord(type, data, meta)
    const record = await client.readRecord(submitted.meta.recordId)
    return record
  } catch (e) {
    console.error(e)
  }
}

/**
 * Get all records of a specified type.
 * 
 * @param {object} searcher   Tozny storage client of the party the retrieving the records.
 * @param {string} type       The type of record to search for.
 * @param {bool} allWriters   Whether or not records written by all clients should be searched for.
 * @param {string} writerID   The writer of the records being searched for (optional).
 * 
 * @returns {Promise<object>} All records found.
 */
async function getRecords(searcher, type, allWriters, writerId) {
  try {
    const request = new Tozny.types.Search(true, allWriters)
    if (!allWriters)
      request.match({ type: type })
    else
      request.match({ type: type, writers: writerId }, 'AND', 'EXACT')
    const resultQuery = await searcher.search(request)
    const record = await resultQuery.next()
    return record
  } catch (e) {
    console.error(e)
  }
}

/**
 * Initialize the players in the judge's records.
 * Set the player IDs and the player names.
 * 
 * @param {object} player1     Tozny storage client for player 1.
 * @param {string} player1Name Player 1's name
 * @param {object} player1     Tozny storage client for player 2.
 * @param {string} player2Name Player 2's name
 * @param {object} judge       Tozny storage client for the judge.
 */
async function initPlayers(player1, player1Name, player2, player2Name, judge) {
  let toSubmit = {
    player1Id: player1.config.clientId,
    player2Id: player2.config.clientId,
    player1Name: player1Name,
    player2Name: player2Name
  }
  let players = await submitRecord(judge, 'players', toSubmit)
  console.log(players)
  console.log(`Player 1 recorded with ID ${players.data.player1Id} and name ${players.data.player1Name}`)
  console.log(`Player 2 recorded with ID ${players.data.player2Id} and name ${players.data.player2Name}`)
}

/**
 * Set the judge ID.
 * 
 * @param {object} judge Tozny storage client for the judge.
 */
async function initJudge(judge) {
  let toSubmit = { judgeId: judge.config.clientId }
  let judgeInfo = await submitRecord(judge, 'judge', toSubmit)
  console.log(`Judge recorded with ID ${judgeInfo.data.judgeId}`)
}

/**
 * Get the current round number of a player (the number of the last
 * round they submitted).
 * 
 * @param {object} player     Tozny storage client for the player searching for the record.
 * @param {string} playerId   Client ID of the Tozny storage client whose record is being retrieved.
 * 
 * @returns {Promise<string>} The current round number of a player.
 */
async function getRound(player, playerId) {
  let rounds = await getRecords(player, 'move', true, playerId)
  if(rounds.length)
    return parseInt(rounds[rounds.length - 1].meta.plain.round)
  else
    return 0
}

/**
 * Submit a record of type `move`.
 * 
 * @param {object} player     Tozny storage client for the player recording a move.
 * @param {string} playerName The player's name.
 * @param {string} move       The game move to be submitted by the player.
 */
async function recordMove(player, playerName, move) {
  let round = await getRound(player, player.config.clientId) + 1
  let data = { move: move.toLowerCase() }
  let meta = { round: round.toString() }
  let read = await submitRecord(player, 'move', data, meta)
  console.log(`${playerName} recorded ${read.data.move} for round #${read.meta.plain.round}`)
}

/**
 * Get a player's move for a specified round.
 * 
 * @param {object} searcher   Tozny storage client for the party searching for a move.
 *                            This may be a player or the judge.
 * @param {string} toSearchId Client ID of the Tozny storage client whose record is being retrieved.
 * @param {int|string} round  The game round to search for.
 * 
 * @returns {Promise<string>} The move of a player for round `round`.
 */
async function getMove(searcher, toSearchId, round) {
  let moves = await getRecords(searcher, 'move', true, toSearchId)
  for (let move of moves) {
    if (parseInt(move.meta.plain.round) === parseInt(round)) {
      return move.data.move;
    }
  }
  console.error(`No move submitted for ${toSearchId} for round ${round}`)
  return null
}

/**
 * Get the info (names or IDs) of the players.
 * 
 * @param {object} judge    Tozny storage client for the judge.
 * @param {string} type     The type of player info to search for. 
 *                          'name': Returns the names of the players.
 *                          'id': Returns the IDs of the players
 * 
 * @returns {Promise<string[]>} Either the two player names or the two player IDs.
 */
async function getPlayerInfo(judge, type) {
  let players = await getRecords(judge, 'players', false, judge.config.clientId)
  // Return the latest record, as this will be for the most recent game.
  if (type.toLowerCase() === 'id')
    return [players[players.length - 1].data.player1Id, players[players.length - 1].data.player2Id]
  else if (type.toLowerCase() === 'name')
    return [players[players.length - 1].data.player1Name, players[players.length - 1].data.player2Name]

}

/**
 * Determine the winner of a round using these rules:
 * Rock beats scissors, scissors beats paper, paper beats rock.
 * 
 * @param {object} judge      Tozny storage client for the judge.
 * @param {string} round      The number of the round to be judged.
 * 
 * @returns {Promise<string>} The name of the winner.
 */
async function determineWinner(judge, round) {
  let playerIds = await getPlayerInfo(judge, 'id')
  let playerNames = await getPlayerInfo(judge, 'name')
  let p1Move = await getMove(judge, playerIds[0], round)
  let p2Move = await getMove(judge, playerIds[1], round)
  //A player has submitted an invalid move
  if (p1Move && p2Move){
    if (!moves.includes(p1Move) || !moves.includes(p2Move))
      return 'Invalid Round'
    if (p1Move === p2Move)
      return 'Draw'
    if (moves[(moves.indexOf(p1Move) + 1) % 3] === p2Move)
      return playerNames[0]
    return playerNames[1]
  }
  return null
}

/**
 * Submit a record of type `winner`.
 * 
 * @param {object} judge Tozny storage client for the judge.
 * @param {string} round The number of the round to be recorded.
 */
async function recordWinner(judge, round) {
  let winner = await determineWinner(judge, round)
  if(winner){
    let data = { winner: winner }
    let meta = { round: round }
    let read = await submitRecord(judge, 'winner', data, meta)
    console.log(`${read.data.winner} submitted for round #${read.meta.plain.round}`)
  }
}

/**
 * Attempt to cheat on a move.
 * If a player has their opponent's ID and access to their `move` records, then
 * that player is able to look up their opponents moves and submit a counter 
 * move that will beat it.
 * 
 * @param {object} player    Tozny storage client for the player searching for the record.
 * @param {string} player2Id Client ID of the Tozny storage player who is being cheated against.
 */
async function tryCheat(player1, player2Id) {
  let p1Round = await getRound(player1, player1.config.clientId)
  let p2Round = await getRound(player1, player2Id)
  if (p1Round < p2Round) {
    let p2Move = await getMove(player1, player2Id, p1Round + 1)
    let move = moves[(moves.indexOf(p2Move) - 1 + 3) % 3]
    recordMove(player1, "Alicia", move)
  }
  else {
    console.error("Cannot cheat")
  }
}

/**
 * Get the ID of the judge.
 * 
 * @param {object} player     Tozny storage client for the player searching for the judge ID.
 * 
 * @returns {Promise<string>} Judge ID
 */
async function getJudgeId(player) {
  let judgeInfo = await getRecords(player, 'judge', true)
  return judgeInfo[judgeInfo.length - 1].data.judgeId
}

/**
 * Get the round winner determined by the judge.
 * 
 * @param {object} player     Tozny storage client for the player searching for the winner.
 * @param {string} round      The round whose winner is being searched for.
 * 
 * @returns {Promise<string>} The winner of the round.
 */
async function getWinner(player, round) {
  let judgeId = await getJudgeId(player)
  let winners = await getRecords(player, 'winner', true, judgeId)
  for (let winner of winners) {
    if (winner.meta.plain.round === round) {
      return winner.data.winner;
    }
  }
  console.error(`No winner found for round ${round}`)
  return null
}

/**
 * Delete all records of a specified type. 
 * 
 * @param {object} client Tozny storage client for the party whose records are to be deleted.
 * @param {string} type   The type of record to delete.
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
 *
 * @param {object} player1 Tozny storage client for player 1.
 * @param {object} player1 Tozny storage client for player 2.
 * @param {object} judge   Tozny storage client for the judge.
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
 * init: Share all records with the appropriate parties and record the player
 * and judge info.
 * reset: Revoke all record sharing and delete all game records.
 * 
 * @param {String[]} args Command line arguments.
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
 * 
 * @param {String[]} args Command line arguments.
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
      console.log(`Winner for round #${round}: ${winner}`)
  }
}

/**
 * Load a Tozny storage client for the judge and submit 
 * a winner.
 * 
 * @param {String[]} args Command line arguments.
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