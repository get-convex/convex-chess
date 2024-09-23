"use client";

import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { gameTitle } from "../common";
import { hasPlayer, isOpen } from "../convex/utils";
import { JoinButton } from "./JoinButton";

export function GameList({
  preloadedGames,
}: {
  preloadedGames: Preloaded<typeof api.games.ongoingGames>;
}) {
  const ongoingGames = usePreloadedQuery(preloadedGames) || [];
  const user = useQuery(api.users.getMyUser) ?? null;

  return (
    <div
      style={{
        marginLeft: "auto",
        marginRight: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <b>Ongoing Games</b>
      <table>
        <tbody>
          {ongoingGames.map((game, i) => (
            <tr key={game._id.toString()}>
              <td>{gameTitle(game)}</td>
              <td>
                <JoinButton
                  text={
                    hasPlayer(game, user?._id ?? null)
                      ? "Rejoin"
                      : isOpen(game)
                      ? "Join"
                      : "Watch"
                  }
                  gameId={game._id.toString()}
                  disabled={isOpen(game) && !user}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
