"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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

function readPrefs(): { volume: number; playbackRate: number; isMuted: boolean } {
  const fallback = { volume: 1, playbackRate: 1, isMuted: false };
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
  const [state, setState] = useState<PlayerState>({
    track: null,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    bufferedTo: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    error: null,
  });

  const patch = useCallback((next: Partial<PlayerState>) => {
    setState((current) => ({ ...current, ...next }));
  }, []);

  // Restore volume/rate preferences once, after mount.
  useEffect(() => {
    const prefs = readPrefs();
    patch(prefs);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = prefs.volume;
      audio.muted = prefs.isMuted;
      audio.playbackRate = prefs.playbackRate;
    }
  }, [patch]);

  const persistPosition = useCallback(() => {
    const audio = audioRef.current;
    const track = state.track;
    if (!audio || !track || !Number.isFinite(audio.currentTime)) return;
    try {
      localStorage.setItem(POSITION_KEY(track.id), String(Math.floor(audio.currentTime)));
    } catch {
      // Storage may be unavailable; losing the resume point is acceptable.
    }
  }, [state.track]);

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

  const toggleTrack = useCallback(
    (track: PlayerTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (state.track?.id === track.id) {
        if (audio.paused) void play(audio);
        else audio.pause();
        return;
      }

      persistPosition();
      patch({ track, isLoading: true, error: null, currentTime: 0, duration: track.durationSeconds, bufferedTo: 0 });

      audio.src = track.audioUrl;
      audio.load();

      let resumeAt = 0;
      try {
        const saved = Number(localStorage.getItem(POSITION_KEY(track.id)) ?? 0);
        const limit = track.durationSeconds - RESUME_TAIL_GUARD;
        if (saved > RESUME_THRESHOLD && (limit <= 0 || saved < limit)) resumeAt = saved;
      } catch {
        // Ignore unreadable storage.
      }

      if (resumeAt > 0) {
        audio.currentTime = resumeAt;
        patch({ currentTime: resumeAt });
      }

      void play(audio);
    },
    [patch, persistPosition, play, state.track?.id],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state.track) return;
    if (audio.paused) void play(audio);
    else audio.pause();
  }, [play, state.track]);

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
      artwork: state.track.coverImage
        ? [{ src: state.track.coverImage, sizes: "512x512", type: "image/png" }]
        : undefined,
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
      togglePlay,
      seekTo,
      skipBy,
      setPlaybackRate,
      setVolume,
      toggleMute,
      close,
      isCurrent,
    }),
    [close, isCurrent, seekTo, setPlaybackRate, setVolume, skipBy, state, toggleMute, togglePlay, toggleTrack],
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
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          patch({ currentTime: audio.currentTime });
          // ~4 timeupdate events per second, so this writes roughly every 5s.
          if (Math.floor(audio.currentTime) % 5 === 0) persistPosition();
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
        onEnded={() => {
          patch({ isPlaying: false, currentTime: 0 });
          if (state.track) {
            try {
              localStorage.removeItem(POSITION_KEY(state.track.id));
            } catch {
              // Ignore.
            }
          }
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
