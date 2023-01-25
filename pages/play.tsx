import { useRouter } from 'next/router'
import { Chess, Move } from "chess.js";
import { Chessboard } from "react-chessboard";

import { useMutation, useQuery } from '../convex/_generated/react'
import { Id } from "../convex/_generated/dataModel";
import { validateMove, isOpen } from "../convex/utils"
import { gameTitle } from "../common"

export default function(props: {userName: string}) {
  const router = useRouter();
  const gameId = new Id("games", router.query.gameId as string);

  const gameState = useQuery('games:get', gameId)
  const performMove = useMutation('games:move').withOptimisticUpdate(
    (localStore, gameId, _, from, to) => {
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
    joinGame(gameId, props.userName);
  }

  const game = new Chess();
  game.loadPgn(gameState.pgn);

  function onDrop(sourceSquare: string, targetSquare: string) {
    console.log("Dropped");
    let nextState = validateMove(gameState!, props.userName, sourceSquare, targetSquare);
    if (nextState) {
      performMove(gameId, props.userName, sourceSquare, targetSquare);
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

  const boardOrientation = (props.userName == gameState.player2) ? 'black' : 'white';

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
              turns.reverse().map((turn, i) => (
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
