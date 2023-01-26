import { FormEvent } from 'react'

import { useMutation, useQuery } from '../convex/_generated/react'
import { Document, Id } from "../convex/_generated/dataModel";
import { isOpen, hasPlayer } from "../convex/utils"
import { gameTitle } from "../common"

import { useRouter } from 'next/router'
import { useAuth0 } from '@auth0/auth0-react';

export default function() {
  const router = useRouter();

  const { user } = useAuth0();

  const ongoingGames = useQuery("games:ongoingGames") || [];
  const userId = useQuery("users:getUser") ?? null;
  const startNewGame = useMutation("games:newGame");

  async function newGame(event: FormEvent) {
    const value = (event.nativeEvent as any).submitter.defaultValue ?? "";
    const white = Boolean(Math.round(Math.random()));
    let player1 : "Me" | "Computer" | null = null;
    let player2 : "Me" | "Computer" | null = null;
    switch (value) {
      case "Play vs another Player":
        if (white) {
          player1 = "Me";
        } else {
          player2 = "Me";
        }
        break;
      case "Play vs Computer":
        if (white) {
          player1 = "Me";
          player2 = "Computer";
        } else {
          player1 = "Computer";
          player2 = "Me";
        }
        break;
      case "Computer vs Computer":
        player1 = "Computer";
        player2 = "Computer";
        break;
    }
    event.preventDefault();
    const id = await startNewGame(player1, player2);
    router.push({ pathname: "/play", query: { gameId: id.id } });
  }

  async function join(event: FormEvent) {
    event.preventDefault();
    const gameId = (event.nativeEvent as any).submitter.id ?? "";
    router.push({ pathname: "/play", query: { gameId } });
  }

  return (
    <main>
      <form
          onSubmit={newGame}
          className="control-form d-flex justify-content-center"
        >
          <input
            type="submit"
            value="Play vs another Player"
            className="ms-2 btn btn-primary"
            // We use user instead of userId here so this button doesn't toggle
            // between enabled and disabled.
            disabled={!user}
          />
          <input
            type="submit"
            value="Play vs Computer"
            className="ms-2 btn btn-primary"
            // We use user instead of userId here so this button doesn't toggle
            // between enabled and disabled.
            disabled={!user}
          />
          <input
            type="submit"
            value="Computer vs Computer"
            className="ms-2 btn btn-primary"
          />
        </form>
      <b>Ongoing Games</b>
      <table>
        <tbody>
          {
            ongoingGames.map((game, i) => (
              <tr key={game._id.toString()}>
                <td>{gameTitle(game)}</td>
                <td>
                  <form
                    onSubmit={join}
                    className="d-flex justify-content-center"
                  >
                    <input
                      id={game._id.toString()}
                      type="submit"
                      value={hasPlayer(game, userId) ? "Rejoin" : isOpen(game) ? "Join" : "Watch"}
                      className="ms-2 btn btn-primary"
                      // We use user instead of userId here we can join immediately
                      // after logging in.
                      disabled={isOpen(game) && !user}
                    />
                  </form>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </main>
  )
}
