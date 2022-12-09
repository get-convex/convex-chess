import { Chess, Move } from "chess.js";
import { Chessboard } from "react-chessboard";

import { useMutation, useQuery } from '../convex/_generated/react'
import { Id } from "../convex/_generated/dataModel";

import { useRouter } from 'next/router'

export default function Game() {
  const router = useRouter();
  const gameId = new Id("games", router.query.gameId as string);

  const gameState = useQuery('games:get', gameId)
  const performMove = useMutation('games:move');
  if (!gameState) {
    return (
      <></>
    );
  }

  const game = new Chess();
  game.loadPgn(gameState.pgn);

  function validateMove(from: string, to: string) : boolean {
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());
    let validatedMove = gameCopy.move({from, to});
    if (!validatedMove) {
      // This is lame but try promoting.
      let moveAndPromote = {from, to, promotion: 'q' }
      moveAndPromote.promotion = 'q';      
      validatedMove = gameCopy.move(moveAndPromote);
    }

    return validatedMove ? true : false;
  }

  async function makeRandomMove() {
    const possibleMoves = game.moves({ verbose: true });
    if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    const move = possibleMoves[randomIndex] as Move;
    await performMove(gameId, move.from, move.to);
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    let valid = validateMove(sourceSquare, targetSquare);
    if (valid) {
      performMove(gameId, sourceSquare, targetSquare);
    }
    return valid;
  }

  if ((game.turn() == 'w' && gameState?.player1 == "random") ||
        (game.turn() == 'b' && gameState?.player2 == "random")) {
    setTimeout(makeRandomMove, 500);
  }

  type Turn = {
    whiteMove: string,
    blackMove: string,
  }
  let turns: Turn[] = [];
  let history = game.history().length > 0 ? game.history() : [""];
  while (history.length > 0) {
    const whiteMove = history.shift() as string;
    const blackMove = history.shift() as string ?? "";
    turns.push({whiteMove, blackMove});
  }

  return (
    <main>
      <div className="game">
        <div className="board">
          <Chessboard position={game.fen()} onPieceDrop={onDrop} />
        </div>
        <div className="movesDiv">
          Moves
          <table className="moves">
            <tbody>
            {
              turns.map((turn, i) => (
                <tr className="turn" key={i}>
                  <td className="turnNumber">{i+1}.</td>
                  <td className="move">{turn.whiteMove}</td>
                  <td className="move">{turn.blackMove}</td>
                </tr>
              ))
            }
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
