"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { siteConfig } from "@/config/site";

export type PlayerTrack = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  audioUrl: string;
  coverImage?: string | null;
  durationSeconds: number;
  episodeNumber?: number | null;
};

type PlayerState = {
  track: PlayerTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  bufferedTo: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  error: string | null;
};

type PlayerContextValue = PlayerState & {
  /** Starts a track, or toggles play/pause when it is already loaded. */
  toggleTrack: (track: PlayerTrack) => void;
  /** Plays a track from a given second, loading it first if needed (show-note timestamps). */
  playFrom: (track: PlayerTrack, seconds: number) => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  skipBy: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  close: () => void;
  isCurrent: (trackId: string) => boolean;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const POSITION_KEY = (id: string) => `player:position:${id}`;
const PREFS_KEY = "player:prefs";
/** Below this, resuming mid-episode is more annoying than helpful. */
const RESUME_THRESHOLD = 30;
/** Treat the last few seconds as "finished" and start over instead. */
const RESUME_TAIL_GUARD = 15;

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** Fired whenever a resume point is written, so play buttons can redraw their progress. */
const POSITION_EVENT = "player:position";

function readSavedPosition(trackId: string): number {
  try {
    return Number(localStorage.getItem(POSITION_KEY(trackId))) || 0;
  } catch {
    return 0;
  }
}

function savePosition(trackId: string, seconds: number) {
  try {
    localStorage.setItem(POSITION_KEY(trackId), String(Math.floor(seconds)));
  } catch {
    // Storage may be unavailable; losing the resume point is acceptable.
    return;
  }
  window.dispatchEvent(new Event(POSITION_EVENT));
}

function subscribePositions(onChange: () => void) {
  window.addEventListener(POSITION_EVENT, onChange);
  // Another tab playing the same episode.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(POSITION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Seconds already heard of an episode in this browser; 0 on the server and before hydration. */
export function useSavedPosition(trackId: string): number {
  return useSyncExternalStore(subscribePositions, () => readSavedPosition(trackId), () => 0);
}

/** A saved point this close to the end means the episode has been heard. */
export function isFinished(position: number, duration: number): boolean {
  return duration > 0 && position >= duration - RESUME_TAIL_GUARD;
}

/** Where playback should pick up again, or 0 to start from the top. */
export function resumePoint(position: number, duration: number): number {
  return position > RESUME_THRESHOLD && !isFinished(position, duration) ? position : 0;
}

/** Keeps the lock-screen / notification scrubber in step with the element. */
function syncPositionState(audio: HTMLAudioElement) {
  if (!("mediaSession" in navigator) || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate,
      position: Math.min(audio.currentTime, audio.duration),
    });
  } catch {
    // Older browsers lack setPositionState.
  }
}

/** Reports a play once per episode per browser session, fire-and-forget. */
function countPlay(trackId: string) {
  const key = `player:counted:${trackId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Without storage we may over-count slightly; that is acceptable.
  }
  void fetch(`/api/episodes/${encodeURIComponent(trackId)}/play`, { method: "POST", keepalive: true }).catch(
    () => undefined,
  );
}

function readPrefs(): { volume: number; playbackRate: number; isMuted: boolean } {
  const fallback = { volume: 1, playbackRate: 1, isMuted: false };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<typeof fallback>) };
  } catch {
    return fallback;
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Saved preferences are read up front. Nothing rendered during hydration
  // depends on them (the bar only appears once a track is chosen), so reading
  // storage in the initialiser cannot cause a mismatch.
  const [state, setState] = useState<PlayerState>(() => ({
    track: null,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    bufferedTo: 0,
    error: null,
    ...readPrefs(),
  }));

  const patch = useCallback((next: Partial<PlayerState>) => {
    setState((current) => ({ ...current, ...next }));
  }, []);

  // Keep the element in sync with preferences. defaultPlaybackRate matters:
  // audio.load() on every new track resets playbackRate to it.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = state.volume;
    audio.muted = state.isMuted;
    audio.defaultPlaybackRate = state.playbackRate;
    audio.playbackRate = state.playbackRate;
  }, [state.volume, state.isMuted, state.playbackRate, state.track]);

  // The track the element is actually playing. Updated synchronously on every
  // switch, unlike state, so a late event from the old source (pause, timeupdate)
  // can never write its time under the wrong episode.
  const trackRef = useRef<PlayerTrack | null>(null);
  // Last second written to storage, so timeupdate only saves every few seconds.
  const lastSavedRef = useRef(0);

  const persistPosition = useCallback(() => {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track || !Number.isFinite(audio.currentTime)) return;
    lastSavedRef.current = audio.currentTime;
    savePosition(track.id, audio.currentTime);
  }, []);

  const play = useCallback(
    async (audio: HTMLAudioElement) => {
      try {
        await audio.play();
      } catch (error) {
        // A rejected play() is usually an autoplay-policy block, not a real fault.
        if ((error as DOMException)?.name !== "AbortError") {
          patch({ isPlaying: false, isLoading: false });
        }
      }
    },
    [patch],
  );

  /** Swaps the element over to a new track and starts it at `startAt` seconds. */
  const loadAndPlay = useCallback(
    (track: PlayerTrack, startAt: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      persistPosition();
      trackRef.current = track;
      patch({ track, isLoading: true, error: null, currentTime: startAt, duration: track.durationSeconds, bufferedTo: 0 });

      audio.src = track.audioUrl;
      audio.load();
      if (startAt > 0) audio.currentTime = startAt;
      lastSavedRef.current = startAt;

      countPlay(track.id);
      void play(audio);
    },
    [patch, persistPosition, play],
  );

  const toggleTrack = useCallback(
    (track: PlayerTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (state.track?.id === track.id) {
        if (audio.paused) void play(audio);
        else audio.pause();
        return;
      }

      loadAndPlay(track, resumePoint(readSavedPosition(track.id), track.durationSeconds));
    },
    [loadAndPlay, play, state.track?.id],
  );

  const playFrom = useCallback(
    (track: PlayerTrack, seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (state.track?.id !== track.id) {
        loadAndPlay(track, seconds);
        return;
      }

      audio.currentTime = seconds;
      patch({ currentTime: seconds });
      if (audio.paused) void play(audio);
    },
    [loadAndPlay, patch, play, state.track?.id],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state.track) return;
    // After a network error the element is stuck; reloading is the retry.
    if (audio.error) {
      const at = state.currentTime;
      patch({ error: null, isLoading: true });
      audio.load();
      audio.currentTime = at;
    }
    if (audio.paused) void play(audio);
    else audio.pause();
  }, [patch, play, state.currentTime, state.track]);

  const seekTo = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const max = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : state.duration;
      const next = Math.min(Math.max(seconds, 0), max || 0);
      audio.currentTime = next;
      patch({ currentTime: next });
    },
    [patch, state.duration],
  );

  const skipBy = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      seekTo(audio.currentTime + seconds);
    },
    [seekTo],
  );

  const savePrefs = useCallback((prefs: { volume?: number; playbackRate?: number; isMuted?: boolean }) => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(), ...prefs }));
    } catch {
      // Non-fatal.
    }
  }, []);

  const setPlaybackRate = useCallback(
    (rate: number) => {
      const audio = audioRef.current;
      if (audio) audio.playbackRate = rate;
      patch({ playbackRate: rate });
      savePrefs({ playbackRate: rate });
    },
    [patch, savePrefs],
  );

  const setVolume = useCallback(
    (volume: number) => {
      const audio = audioRef.current;
      const next = Math.min(Math.max(volume, 0), 1);
      if (audio) {
        audio.volume = next;
        audio.muted = next === 0;
      }
      patch({ volume: next, isMuted: next === 0 });
      savePrefs({ volume: next, isMuted: next === 0 });
    },
    [patch, savePrefs],
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !audio.muted;
    audio.muted = next;
    patch({ isMuted: next });
    savePrefs({ isMuted: next });
  }, [patch, savePrefs]);

  const close = useCallback(() => {
    const audio = audioRef.current;
    persistPosition();
    trackRef.current = null;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    patch({ track: null, isPlaying: false, isLoading: false, currentTime: 0, duration: 0, bufferedTo: 0 });
  }, [patch, persistPosition]);

  const isCurrent = useCallback((trackId: string) => state.track?.id === trackId, [state.track?.id]);

  // Keep the OS-level media controls (lock screen, headset buttons) in sync.
  useEffect(() => {
    if (!("mediaSession" in navigator) || !state.track) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.track.title,
      artist: siteConfig.author.name,
      album: siteConfig.name,
      // No type or size: covers can be any format, and the show artwork is the fallback.
      artwork: [{ src: state.track.coverImage || siteConfig.podcast.artwork }],
    });

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => togglePlay()],
      ["pause", () => togglePlay()],
      ["seekbackward", () => skipBy(-15)],
      ["seekforward", () => skipBy(30)],
      ["seekto", (details) => details.seekTime != null && seekTo(details.seekTime)],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Not every browser supports every action.
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore.
        }
      }
    };
  }, [seekTo, skipBy, state.track, togglePlay]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
    }
  }, [state.isPlaying]);

  // Global shortcuts, ignored while the visitor is typing.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!state.track) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target?.tagName ?? "")
      ) {
        return;
      }

      switch (event.key) {
        case " ":
          event.preventDefault();
          togglePlay();
          break;
        // Arrows are mirrored: in RTL, "forward" is the left arrow.
        case "ArrowLeft":
          event.preventDefault();
          skipBy(30);
          break;
        case "ArrowRight":
          event.preventDefault();
          skipBy(-15);
          break;
        case "m":
          toggleMute();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [skipBy, state.track, toggleMute, togglePlay]);

  // Save the resume point when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => persistPosition();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [persistPosition]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      ...state,
      toggleTrack,
      playFrom,
      togglePlay,
      seekTo,
      skipBy,
      setPlaybackRate,
      setVolume,
      toggleMute,
      close,
      isCurrent,
    }),
    [close, isCurrent, playFrom, seekTo, setPlaybackRate, setVolume, skipBy, state, toggleMute, togglePlay, toggleTrack],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/*
        A single audio element for the whole app. It lives above the router
        outlet so client-side navigation never unmounts it — that is what keeps
        playback going while the visitor browses.
      */}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => patch({ isPlaying: true, error: null })}
        onPause={() => {
          patch({ isPlaying: false });
          persistPosition();
        }}
        onWaiting={() => patch({ isLoading: true })}
        onPlaying={() => patch({ isLoading: false })}
        onCanPlay={() => patch({ isLoading: false })}
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;
          if (Number.isFinite(audio.duration) && audio.duration > 0) patch({ duration: audio.duration });
          syncPositionState(audio);
        }}
        onSeeked={(event) => syncPositionState(event.currentTarget)}
        onRateChange={(event) => syncPositionState(event.currentTarget)}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          patch({ currentTime: audio.currentTime });
          if (Math.abs(audio.currentTime - lastSavedRef.current) >= 5) persistPosition();
        }}
        onProgress={(event) => {
          const { buffered, currentTime } = event.currentTarget;
          for (let i = buffered.length - 1; i >= 0; i -= 1) {
            if (buffered.start(i) <= currentTime) {
              patch({ bufferedTo: buffered.end(i) });
              break;
            }
          }
        }}
        onEnded={(event) => {
          patch({ isPlaying: false });
          // Saved as the full length: the episode now reads as heard, and the next play starts over.
          const track = trackRef.current;
          if (track) savePosition(track.id, event.currentTarget.duration || track.durationSeconds);
        }}
        onError={() =>
          patch({
            isPlaying: false,
            isLoading: false,
            error: "پخش این فایل صوتی ممکن نشد. لطفاً دوباره تلاش کنید.",
          })
        }
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside <PlayerProvider>.");
  return context;
}
