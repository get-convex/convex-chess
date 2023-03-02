import { useRouter } from 'next/router'
import { Chess, Move } from "chess.js";
import { Chessboard } from "react-chessboard";

import { useMutation, useQuery } from '../../convex/_generated/react'
import { Id } from "../../convex/_generated/dataModel";
import { validateMove, isOpen, playerEquals } from "../../convex/utils"
import { gameTitle } from "../../common"

export default function() {
  const router = useRouter();
  const gameId = new Id("games", router.query.id as string);

  const gameState = useQuery('games:get', gameId)
  const userId = useQuery("users:getMyUser") ?? null;

  const performMove = useMutation('games:move').withOptimisticUpdate(
    (localStore, gameId, from, to) => {
      const state = localStore.getQuery("games:get", [gameId]);
      if (state) {
        const game = new Chess();
        game.loadPgn(state.pgn);
        game.move({from, to});
        const newState = { ...state };
        newState.pgn = game.pgn();
        console.log("nextState", game.history(), gameId);
        localStore.setQuery("games:get", [gameId], newState);
      }
    }
  );
  const joinGame = useMutation("games:joinGame");
  if (!gameState) {
    return (
      <></>
    );
  }

  if (isOpen(gameState)) {
    joinGame(gameId);
  }

  const game = new Chess();
  game.loadPgn(gameState.pgn);

  function onDrop(sourceSquare: string, targetSquare: string) {
    let nextState = validateMove(gameState!, userId, sourceSquare, targetSquare);
    if (nextState) {
      performMove(gameId, sourceSquare, targetSquare);
    } else {
    }
    return nextState != null;
  }

  type Turn = {
    num: number,
    whiteMove: string,
    blackMove: string,
  }
  let turns: Turn[] = [];
  let history = game.history().length > 0 ? game.history() : [""];
  while (history.length > 0) {
    const whiteMove = history.shift() as string;
    const blackMove = history.shift() as string ?? "";
    turns.push({num: turns.length + 1, whiteMove, blackMove});
  }

  const boardOrientation = playerEquals(userId, gameState.player2 as any) ? 'black' : 'white';

  return (
    <main>
      <div>{gameTitle(gameState)}</div>
      <div className="game">
        <div className="board">
          <Chessboard position={game.fen()} onPieceDrop={onDrop} boardOrientation={boardOrientation} />
        </div>
        <div className="moves">
          Moves
          <table>
            <tbody>
            {
              turns.map((turn, i) => (
                <tr key={i}>
                  <td className="moveNumber">{turn.num}.</td>
                  <td className="moveSquare">{turn.whiteMove}</td>
                  <td className="moveSquare">{turn.blackMove}</td>
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
