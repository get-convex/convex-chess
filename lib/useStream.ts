import { StreamBody, StreamId } from "@convex-dev/persistent-text-streaming";
import { useQuery } from "convex/react";
import { FunctionReference } from "convex/server";
import { useState, useMemo, useRef, useEffect } from "react";

type StreamStatus = "pending" | "streaming" | "done" | "error" | "timeout";

// This is a modified version of the useStream hook from the persistent-text-streaming package.
// It fixes a bug where the state never reset when the streamId changed.

/**
 * React hook for persistent text streaming.
 *
 * @param getPersistentBody - A query function reference that returns the body
 * of a stream using the component's `getStreamBody` method.
 * @param streamUrl - The URL of the http action that will kick off the stream
 * generation and stream the result back to the client using the component's
 * `stream` method.
 * @param driven - Whether this particular session is driving the stream. Set this
 * to true if this is the client session that first created the stream using the
 * component's `createStream` method. If you're simply reloading an existing
 * stream, set this to false.
 * @param streamId - The ID of the stream. If this is not provided, the return
 * value will be an empty string for the stream body and the status will be
 * `pending`.
 * @returns The body and status of the stream.
 */
export function useStream(
  getPersistentBody: FunctionReference<
    "query",
    "public",
    { streamId: string },
    StreamBody
  >,
  streamUrl: URL,
  driven: boolean,
  streamId?: StreamId
) {
  const [streamIdState, setStreamIdState] = useState(streamId);
  const [streamEnded, setStreamEnded] = useState(null as boolean | null);

  // Used to prevent strict mode from causing multiple streams to be started.
  const streamStarted = useRef(false);
  const [streamBody, setStreamBody] = useState<string>("");

  useEffect(() => {
    if (streamId !== streamIdState) {
      // reset all state variables
      setStreamIdState(streamId);
      setStreamEnded(null);
      streamStarted.current = false;
      setStreamBody("");
    }
  }, [streamId, streamIdState]);
  const usePersistence = useMemo(() => {
    // Something is wrong with the stream, so we need to use the database value.
    if (streamEnded === false) {
      return true;
    }
    // If we're not driving the stream, we must use the database value.
    if (!driven) {
      return true;
    }
    // Otherwise, we'll try to drive the stream and use the HTTP response.
    return false;
  }, [driven, streamId, streamEnded]);
  //  console.log("usePersistence", usePersistence);
  const persistentBody = useQuery(
    getPersistentBody,
    usePersistence && streamId ? { streamId: streamId! } : "skip"
  );

  useEffect(() => {
    if (driven && streamId && !streamStarted.current) {
      // Kick off HTTP action.
      void (async () => {
        const success = await startStreaming(streamUrl, streamId, (text) => {
          setStreamBody((prev) => prev + text);
        });
        setStreamEnded(success);
      })();
      // If we get remounted, we don't want to start a new stream.
      return () => {
        streamStarted.current = true;
      };
    }
  }, [driven, streamId, setStreamEnded, streamStarted]);

  const body = useMemo<StreamBody>(() => {
    if (persistentBody) {
      return persistentBody;
    }
    let status: StreamStatus;
    if (streamEnded === null) {
      status = streamBody.length > 0 ? "streaming" : "pending";
    } else {
      status = streamEnded ? "done" : "error";
    }
    return {
      text: streamBody,
      status: status as StreamStatus,
    };
  }, [persistentBody, streamBody, streamEnded]);

  return body;
}

/**
 * Internal helper for starting a stream.
 *
 * @param url - The URL of the http action that will kick off the stream
 * generation and stream the result back to the client using the component's
 * `stream` method.
 * @param streamId - The ID of the stream.
 * @param onUpdate - A function that updates the stream body.
 * @returns A promise that resolves to a boolean indicating whether the stream
 * was started successfully. It can fail if the http action is not found, or
 * CORS fails, or an exception is raised, or the stream is already running
 * or finished, etc.
 */
async function startStreaming(
  url: URL,
  streamId: StreamId,
  onUpdate: (text: string) => void
) {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      streamId: streamId,
    }),
    headers: { "Content-Type": "application/json" },
  });
  // Adapted from https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams
  if (response.status === 205) {
    console.error("Stream already finished", response);
    return false;
  }
  if (!response.ok) {
    console.error("Failed to reach streaming endpoint", response);
    return false;
  }
  if (!response.body) {
    console.error("No body in response", response);
    return false;
  }
  const reader = response.body.getReader();
  while (true) {
    try {
      const { done, value } = await reader.read();
      if (done) {
        onUpdate(new TextDecoder().decode(value));
        return true;
      }
      onUpdate(new TextDecoder().decode(value));
    } catch (e) {
      console.error("Error reading stream", e);
      return false;
    }
  }
}
