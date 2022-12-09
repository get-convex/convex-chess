import { FormEvent } from 'react'

import { useMutation, useQuery } from '../convex/_generated/react'
import { Document } from "../convex/_generated/dataModel";
import { isOpen, hasPlayer } from "../convex/utils"
import { gameTitle } from "../common"

import { useRouter } from 'next/router'

export default function App(props: {userName: string}) {
  const router = useRouter();

  const ongoingGames : Document<"games">[] = useQuery("games:ongoingGames") || [];
  const startNewGame = useMutation("games:newGame");

  async function newGame(event: FormEvent) {
    let value = (event.nativeEvent as any).submitter.defaultValue ?? "";
    let player1 = null;
    let player2 = null;
    const white = Boolean(Math.round(Math.random()));
    switch (value) {
      case "Play vs another Player":
        if (white) {
          player1 = props.userName;
        } else {
          player2 = props.userName;
        }
        break;
      case "Play vs Computer":
        if (white) {
          player1 = props.userName;
          player2 = "Computer";
        } else {
          player1 = "Computer";
          player2 = props.userName;
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
            disabled={props.userName == ""}
          />
          <input
            type="submit"
            value="Play vs Computer"
            className="ms-2 btn btn-primary"
            disabled={props.userName == ""}
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
              <tr key={i}>
                <td>{gameTitle(game)}</td>
                <td>
                  <form
                    onSubmit={join}
                    className="d-flex justify-content-center"
                  >
                    <input
                      id={game._id.toString()}
                      type="submit"
                      value={isOpen(game) ? hasPlayer(game, props.userName) ? "Rejoin" : "Join" : "Watch"}
                      className="ms-2 btn btn-primary"
                      disabled={isOpen(game) && !props.userName}
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