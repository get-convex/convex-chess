import { FormEvent } from 'react'

import { useMutation, useQuery } from '../convex/_generated/react'
import { Id } from "../convex/_generated/dataModel";

import { useRouter } from 'next/router'

export default function App() {
  const router = useRouter();
  const gameId = router.query.gameId ? new Id("games", router.query.gameId as string) : null;

  const openGames = useQuery("games:openGames") || [];
  const startNewGame = useMutation("games:newGame");

  async function newGame(event: FormEvent) {
    let value = (event.nativeEvent as any).submitter.defaultValue ?? "";
    let player1 = null;
    let player2 : null | "random" = null;
    if (value == "Play vs Computer") {
      player2 = "random";
    }
    event.preventDefault();
    const id = await startNewGame(player1, player2);
    router.push({ pathname: "/play", query: { gameId: id.id } });
  }

  async function join(event: FormEvent) {
    event.preventDefault();
    let gameId = (event.nativeEvent as any).submitter.id ?? "";
    console.log(gameId);
    router.push({ pathname: "/play", query: { gameId } });
  }

  return (
    <main>
      <b>Open Games</b>
      <ul>
        <table>
          <tbody>
            {
              openGames.map((game) => (
                <tr>
                  <td>{game._id.toString().substring(8) + "   "}</td>
                  <td>
                    <form
                      onSubmit={join}
                      className="d-flex justify-content-center"
                    >
                      <input
                        id={game._id.toString()}
                        type="submit"
                        value="Join"
                        className="ms-2 btn btn-primary"
                      />                    
                    </form>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </ul>
      <form
          onSubmit={newGame}
          className="d-flex justify-content-center"
        >
          <input
            type="submit"
            value="Play vs Computer"
            className="ms-2 btn btn-primary"
            disabled={gameId ? true : false}
          />
          <input
            type="submit"
            value="Play vs Real Person"
            className="ms-2 btn btn-primary"
            disabled={gameId ? true : false}
          />
        </form>
    </main>
  )
}