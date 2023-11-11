import { api } from '../../convex/_generated/api';
import { useRouter } from 'next/router';
import { Chess, Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';

import { useMutation, useQuery } from 'convex/react';
import { Id } from '../../convex/_generated/dataModel';
import { validateMove, isOpen, playerEquals } from '../../convex/utils';
import { gameTitle } from '../../common';
import { useEffect, useState } from 'react';

export default function () {
  const router = useRouter();
  const gameId = router.query.id as Id<'games'>;
  const moveIdx = router.query.moveIndex
    ? Number(router.query.moveIndex)
    : undefined;

  const gameState = useQuery(api.games.get, { id: gameId });
  const userId = useQuery(api.users.getMyUser) ?? null;
  const [selectedMove, setSelectedMove] = useState<undefined | number>(moveIdx);

  useEffect(() => {
    if (moveIdx !== undefined && moveIdx !== selectedMove)
      setSelectedMove(moveIdx);
  }, [moveIdx]);

  const { analysis, moveIndex, move } =
    useQuery(
      api.games.getAnalysis,
      gameState ? { gameId: gameState._id, moveIndex: selectedMove } : 'skip'
    ) ?? {};

  const performMove = useMutation(api.games.move).withOptimisticUpdate(
    (localStore, { gameId, from, to }) => {
      const state = localStore.getQuery(api.games.get, { id: gameId });
      if (state) {
        const game = new Chess();
        game.loadPgn(state.pgn);
        game.move({ from, to });
        const newState = { ...state };
        newState.pgn = game.pgn();
        console.log('nextState', game.history(), gameId);
        localStore.setQuery(api.games.get, { id: gameId }, newState);
      }
    }
  );
  const joinGame = useMutation(api.games.joinGame);
  if (!gameState) {
    return <></>;
  }

  if (isOpen(gameState)) {
    joinGame({ id: gameId });
  }

  const game = new Chess();
  game.loadPgn(gameState.pgn);

  const clickWhiteMove = (i: number) => {
    setSelectedMove(i * 2);
  };
  const clickBlackMove = (i: number) => {
    setSelectedMove(i * 2 + 1);
  };

  function onDrop(sourceSquare: string, targetSquare: string) {
    let nextState = validateMove(
      gameState!,
      userId,
      sourceSquare,
      targetSquare
    );
    if (nextState) {
      performMove({ gameId, from: sourceSquare, to: targetSquare });
      setSelectedMove(undefined);
    } else {
    }
    return nextState != null;
  }

  type Turn = {
    num: number;
    whiteMove: string;
    blackMove: string;
  };
  let turns: Turn[] = [];
  let history = game.history().length > 0 ? game.history() : [''];
  while (history.length > 0) {
    const whiteMove = history.shift() as string;
    const blackMove = (history.shift() as string) ?? '';
    turns.push({ num: turns.length + 1, whiteMove, blackMove });
  }

  const boardOrientation = playerEquals(userId, gameState.player2 as any)
    ? 'black'
    : 'white';

  return (
    <main>
      <div>{gameTitle(gameState)}</div>
      <div className="game">
        <div className="board">
          <Chessboard
            boardWidth={560}
            position={game.fen()}
            onPieceDrop={onDrop}
            boardOrientation={boardOrientation}
          />
        </div>
        <div className="moves">
          Moves
          <table>
            <tbody>
              {turns.map((turn, i) => (
                <tr key={i}>
                  <td className="moveNumber">{turn.num}.</td>
                  <td className="moveSquare" onClick={() => clickWhiteMove(i)}>
                    {turn.whiteMove}
                  </td>
                  <td className="moveSquare" onClick={() => clickBlackMove(i)}>
                    {turn.blackMove}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {moveIndex !== undefined && (
            <table>
              <tbody>
                <tr>
                  <td>
                    <strong>
                      {Math.floor(moveIndex / 2) + 1}
                      {moveIndex % 2 ? 'b' : 'a'}. {move}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td className="analysis">{analysis}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
