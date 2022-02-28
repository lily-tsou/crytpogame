# Crypto Game
**Lily Tsou**
<hr>
<em>Crypto Game</em> is a simple game of Rock Paper Scissors implemented using Tozny's JavaScript Software Developers Kit. <br>
The game allows two players to compete against each other in a series of rounds, with a neutral judge declaring the winner of each round. <br>
<hr>
<h2> To run this code: </h2>
First clone this repo and then run <code>npm install</code> install the Tozny SDK node dependency. <br>
Once installation has finished, you will be able to run the program by using the following command:<br>
<code>node .\cryptogame.js [game-args]</code><br>
Where [game-args] are a set of arguments that indicate to the program whether you would like to submit a move as a player, determine the winner as the judge, view the winner as a player, or initialize/reset the game state.<br> 
<h4> All [game-args] and their behavior:</h4>
<strong>game init player1Name player1config player2Name player2config judgeConfig </strong> <br>
Sets up the initial game state by sharing all appropriate records and recording the judge and player IDs. <br>
Note that Player 1 is able to view Player 2's moves, but Player 2 is not able to view Player 1's moves.<br>
To set up a game with players Alicia and Bruce and judge Clarence: <br>
<code>node .\cryptogame.js game init Alicia .\aliciaconfig.js Bruce .\bruceconfig.js .\clarenceconfig.js</code><br><br>
<strong>move playerName playerConfig move</strong><br>
Submits a player's move to their storage. The round number is calculated automatically. <br>
To submit a move of "rock" for player Alicia:<br>
<code>node .\cryptogame.js move Alicia .\aliciaconfig.js rock</code><br><br>
<strong>record-winner judgeConfig round</strong><br>
Determine the winner of a given round and submit it to the judge's records. <br>
To find the winner of round 1 by judge Clarence:<br>
<code>node .\cryptogame.js record-winner .\clarenceconfig.js 1</code><br><br>
<strong>show-winner playerName playerConfig round</strong><br>
Show a player the winner recorded by the judge for a given round. <br>
To have Bruce search for the winner of round 1:<br>
<code>node .\cryptogame.js show-winner Bruce .\bruceconfig.js 1</code><br><br>
<strong>cheat playerName playerConfig opponentId</strong><br>
Determines whether a player can cheat or not, and submits an optimal move if they can. <br>
A player can cheat if they have access to their opponents `move` records and their client ID.<br>
To see if Alicia can cheat against an opponent with a client ID of "122e23c6-9b17-4e6b-b759-a69b4cb96f17":<br>
<code>node .\cryptogame.js cheat Alicia .\aliciaconfig.js "122e23c6-9b17-4e6b-b759-a69b4cb96f17"</code><br><br>
<strong>game reset player1Name player1Config player2Name player2Config judgeConfig </strong><br>
Resets the current game by revoking all record access and deleting all game records. <br>
To reset a game with players Alicia and Bruce and judge Clarence:<br>
<code>node .\cryptogame.js game reset Alicia .\aliciaconfig.js Bruce .\bruceconfig.js .\clarenceconfig.js</code><br><br>
