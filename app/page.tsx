import { preloadQuery } from "convex/nextjs";
import { GameList } from "../components/GameList";
import { Topbar } from "../components/Topbar";
import { api } from "../convex/_generated/api";

export default async function Home() {
  const preloadedGames = await preloadQuery(api.games.ongoingGames);
  return (
    <>
      <Topbar />
      <GameList preloadedGames={preloadedGames} />
    </>
  );
}
