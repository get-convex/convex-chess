"use client";

import { useAction } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export default function AnalysisSpeech({
  gameId,
  moveIndex,
}: {
  gameId: Id<"games">;
  moveIndex: number;
}) {
  const generate = useAction(api.games.speakAnalysis);
  const [source, setSource] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const pending = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      audioRef.current?.pause();
    };
  }, []);

  async function listen() {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(undefined);
    try {
      const source = await generate({ gameId, moveIndex });
      if (mounted.current) setSource(source);
    } catch {
      if (mounted.current)
        setError("Could not generate speech. Please try again.");
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  }

  return (
    <div>
      {source ? (
        <audio
          ref={audioRef}
          src={source}
          controls
          autoPlay
          aria-label="Move analysis narration"
          style={{ maxWidth: "100%" }}
          onError={() => {
            setSource(undefined);
            setError("Audio could not be played. Please try again.");
          }}
        />
      ) : (
        <button type="button" onClick={listen} disabled={loading}>
          {loading ? "Generating speech…" : "Listen to analysis"}
        </button>
      )}
      {loading && <span role="status"> Preparing audio.</span>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
