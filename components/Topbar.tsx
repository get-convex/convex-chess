"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../convex/_generated/api";
import { FormEvent } from "react";

export function Topbar() {
  const router = useRouter();
  const user = useQuery(api.users.getMyUser) ?? null;

  const startNewGame = useMutation(api.games.newGame);

  async function newGame(event: FormEvent) {
    const value = (event.nativeEvent as any).submitter.defaultValue ?? "";
    const white = Boolean(Math.round(Math.random()));
    let player1: "Me" | "Computer" | null = null;
    let player2: "Me" | "Computer" | null = null;
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
    const id = await startNewGame({ player1, player2 });
    router.push(`/play/${id}`);
  }

  return (
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
  );
}
