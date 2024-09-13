import { api } from "../../convex/_generated/api";
import { useRouter } from "next/router";
import { Chess, Move, Square } from "chess.js";
import { Chessboard } from "react-chessboard";

import { useMutation, useQuery } from "convex/react";
import { Id } from "../../convex/_generated/dataModel";
import { validateMove, isOpen, playerEquals } from "../../convex/utils";
import { gameTitle } from "../../common";
import { useEffect, useState } from "react";
import { Piece } from "react-chessboard/dist/chessboard/types";

export default function () {
  const router = useRouter();
  const gameId = router.query.id as Id<"games">;
  const moveIdx = router.query.moveIndex
    ? Number(router.query.moveIndex)
    : undefined;

  const gameState = useQuery(api.games.get, { id: gameId });
  const user = useQuery(api.users.getMyUser) ?? null;
  const [selectedMove, setSelectedMove] = useState<undefined | number>(moveIdx);
  const [mainStyle, setMainStyle] = useState<{ backgroundColor?: string }>({});

  useEffect(() => {
    if (moveIdx !== undefined && moveIdx !== selectedMove)
      setSelectedMove(moveIdx);
  }, [moveIdx]);

  const { analysis, moveIndex, move } =
    useQuery(
      api.games.getAnalysis,
      gameState ? { gameId: gameState._id, moveIndex: selectedMove } : "skip"
    ) ?? {};

  const performMove = useMutation(api.games.move).withOptimisticUpdate(
    (localStore, { gameId, from, to, finalPiece }) => {
      const state = localStore.getQuery(api.games.get, { id: gameId });
      if (state) {
        const game = new Chess();
        game.loadPgn(state.pgn);
        // This is lame but try promoting.
        try {
          game.move({ from, to });
        } catch {
          game.move({ from, to, promotion: finalPiece });
        }
        const newState = { ...state };
        newState.pgn = game.pgn();
        console.log("nextState", game.history(), gameId);
        localStore.setQuery(api.games.get, { id: gameId }, newState);
      }
    }
  );
  const joinGame = useMutation(api.games.joinGame);
  const tryPerformMove = useMutation(api.games.move);

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

  async function onDrop(
    sourceSquare: Square,
    targetSquare: Square,
    piece: Piece
  ) {
    const finalPiece = piece[1].toLowerCase();
    let nextState = validateMove(
      gameState!,
      user?._id ?? null,
      sourceSquare,
      targetSquare,
      finalPiece
    );
    if (nextState) {
      await performMove({
        gameId,
        from: sourceSquare,
        to: targetSquare,
        finalPiece,
      });
      setSelectedMove(undefined);
    } else {
      setMainStyle({ backgroundColor: "red" });
      setTimeout(() => setMainStyle({}), 50);
      try {
        await tryPerformMove({
          gameId,
          from: sourceSquare,
          to: targetSquare,
          finalPiece,
        });
      } catch (error) {
        console.log(error);
      }
    }
    return nextState != null;
  }

  type Turn = {
    num: number;
    whiteMove: string;
    blackMove: string;
  };
  let turns: Turn[] = [];
  let history = game.history().length > 0 ? game.history() : [""];
  while (history.length > 0) {
    const whiteMove = history.shift() as string;
    const blackMove = (history.shift() as string) ?? "";
    turns.push({ num: turns.length + 1, whiteMove, blackMove });
  }

  const boardOrientation = playerEquals(
    user?._id ?? null,
    gameState.player2 as any
  )
    ? "black"
    : "white";

  return (
    <main style={mainStyle}>
      <div>{gameTitle(gameState)}</div>
      <div className="game">
        <div className="board">
          <Chessboard
            boardWidth={560}
            position={game.fen()}
            onPieceDrop={(source, target, piece) =>
              onDrop(source, target, piece) as unknown as boolean
            }
            boardOrientation={boardOrientation}
            showPromotionDialog
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
                      {moveIndex % 2 ? "b" : "a"}. {move}
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
