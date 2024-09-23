"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";

export function JoinButton({
  text,
  gameId,
  disabled,
}: {
  text: string;
  gameId: string;
  disabled: boolean;
}) {
  const router = useRouter();

  async function join(event: FormEvent) {
    event.preventDefault();
    const gameId = (event.nativeEvent as any).submitter.id ?? "";
    router.push(`/play/${gameId}`);
  }

  return (
    <form onSubmit={join} className="d-flex justify-content-center">
      <input
        id={gameId}
        type="submit"
        value={text}
        className="ms-2 btn btn-primary"
        // We use user instead of userId here we can join immediately
        // after logging in.
        disabled={disabled}
      />
    </form>
  );
}
