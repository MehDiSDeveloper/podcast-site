"use client";

import { useEffect, useRef } from "react";

import { usePlayer } from "@/components/player/player-provider";

/**
 * Full-viewport animated backdrop for the public site, plus the pointer
 * reactions of the glass elements laid over it.
 *
 * A single fragment shader paints a "pastel silk" field: five soft colour
 * pools (rose, lilac, sky, mint, peach) drifting on slow paths and blended
 * through a noise warp. The cursor carries its own pool of colour, draws the
 * nearby pools toward it and drags the silk along its motion; clicks send a
 * ripple through the field. A faint bundle of wave lines runs along the bottom
 * and breathes harder while an episode is playing.
 *
 * It renders below device resolution (the image is soft by design), pauses
 * when the tab is hidden, and draws a single still frame under reduced motion.
 * If WebGL is unavailable the CSS gradient on the wrapper is all that shows.
 */

const VERTEX = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const RIPPLES = 4;

const FRAGMENT = `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseAmt;
uniform vec2 uVel;
uniform float uScroll;
uniform float uDark;
uniform float uEnergy;
// xy: position (0..1, y up), z: age in seconds, w: strength.
uniform vec4 uRipples[${RIPPLES}];

// 2D simplex noise (Ashima Arts, MIT).
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * snoise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 rot(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

// One line of the wave bundle; fi in 0..1 picks the line.
float waveY(float x, float fi, float amp, float centre, float t, float drift, float aspect) {
  float u = x / aspect;
  float env = smoothstep(-0.1, 0.45, u) * smoothstep(1.1, 0.55, u);
  float ph = fi * 3.14159 * 1.15;
  return centre
    + (sin(x * 1.6 + t * 0.22 + ph + drift) + 0.35 * sin(x * 3.7 - t * 0.31 + ph * 0.6 - drift * 0.7)) * amp * env
    + (fi - 0.5) * 0.12 * (0.6 + 0.4 * sin(x * 1.1 - t * 0.1 + drift * 0.5));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 st = vec2(uv.x * aspect, uv.y);
  vec2 mouse = vec2(uMouse.x * aspect, uMouse.y);
  float t = uTime;
  float scroll = uScroll;
  float dark = uDark;

  // Pastels for paper, deeper jewel tones of the same hues for ink.
  vec3 base  = mix(vec3(0.950, 0.925, 0.945), vec3(0.047, 0.052, 0.086), dark);
  vec3 rose  = mix(vec3(0.970, 0.760, 0.810), vec3(0.300, 0.110, 0.190), dark);
  vec3 lilac = mix(vec3(0.800, 0.760, 0.965), vec3(0.200, 0.140, 0.380), dark);
  vec3 sky   = mix(vec3(0.740, 0.845, 0.975), vec3(0.090, 0.180, 0.340), dark);
  vec3 mint  = mix(vec3(0.740, 0.915, 0.850), vec3(0.060, 0.230, 0.240), dark);
  vec3 peach = mix(vec3(0.990, 0.845, 0.720), vec3(0.330, 0.190, 0.110), dark);

  // ------------------------------------------------------- cursor distortion
  // The silk is dragged along the cursor's path and gently twisted around it.
  vec2 toM = st - mouse;
  float mFall = exp(-dot(toM, toM) * 5.0) * uMouseAmt;
  float speed = length(uVel);
  vec2 p = mouse + rot(toM, mFall * (0.35 + speed * 0.5)) - uVel * mFall * 0.22;

  // ------------------------------------------------------------ click ripples
  float ring = 0.0;
  float flash = 0.0;
  for (int k = 0; k < ${RIPPLES}; k++) {
    vec4 r = uRipples[k];
    if (r.w <= 0.0) continue;
    vec2 dv = st - vec2(r.x * aspect, r.y);
    float d = length(dv);
    float front = r.z * 0.7;
    float fade = exp(-r.z * 1.25) * r.w;
    float band = exp(-pow((d - front) * 9.0, 2.0)) * fade;
    // A trailing, weaker second wave makes it read as liquid, not a shockwave.
    float band2 = exp(-pow((d - front * 0.62) * 12.0, 2.0)) * fade * 0.45;
    p -= (dv / max(d, 1e-4)) * (band - band2) * 0.05;
    ring += band + band2;
    flash += exp(-d * d * 30.0) * exp(-r.z * 3.0) * r.w;
  }

  // -------------------------------------------------------------- silk field
  vec2 q = p * 1.05 + vec2(0.0, scroll * 0.22);
  vec2 warp = vec2(fbm(q + t * 0.03), fbm(q + vec2(5.2, 1.3) - t * 0.026));
  vec2 wp = p + warp * 0.2;

  float breath = 1.0 + uEnergy * 0.12 * sin(t * 1.7);
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 c = vec2(
      aspect * (0.5 + 0.42 * sin(t * (0.045 + fi * 0.011) + fi * 1.7 + scroll * 0.35)),
      0.5 + 0.44 * cos(t * (0.038 + fi * 0.009) + fi * 2.3 - scroll * 0.28)
    );
    // Pools lean toward the cursor, more strongly the closer they are.
    vec2 toC = mouse - c;
    c += toC * 0.22 * uMouseAmt * exp(-dot(toC, toC) * 1.2);
    vec3 col = i == 0 ? rose : i == 1 ? lilac : i == 2 ? sky : i == 3 ? mint : peach;
    vec2 dd = wp - c;
    float w = exp(-dot(dd, dd) / (0.15 * breath));
    acc += col * w;
    wsum += w;
  }

  // The cursor carries a pool of its own, slowly cycling through the hues.
  float hue = t * 0.18;
  vec3 cursorCol = mix(mix(lilac, rose, 0.5 + 0.5 * sin(hue)), sky, 0.25 + 0.25 * sin(hue * 0.7 + 2.0));
  vec2 dm = wp - mouse;
  float wm = exp(-dot(dm, dm) / 0.05) * uMouseAmt * (1.4 + speed * 0.8);
  acc += cursorCol * wm;
  wsum += wm;

  vec3 field = acc / max(wsum, 1e-4);
  float cover = smoothstep(0.0, 0.7, wsum);
  vec3 col = mix(base, field, cover * mix(0.95, 0.5, dark));
  // Soft light from the top, weight toward the bottom.
  col = mix(col, col * mix(0.975, 0.72, dark), smoothstep(0.85, 0.0, uv.y) * 0.55);

  // ------------------------------------------------------------ cursor halo
  float md = distance(st, mouse);
  float halo = exp(-md * md * 6.0) * uMouseAmt;
  vec3 haloLight = mix(cursorCol * 0.92, cursorCol * 2.2 + 0.03, dark);
  col = mix(col, haloLight, halo * mix(0.42, 0.3, dark));

  // Ripple light.
  vec3 ringCol = mix(mix(lilac, rose, 0.4) * 0.9, mix(lilac, sky, 0.5) * 2.0, dark);
  col = mix(col, ringCol, clamp(ring * 0.38 + flash * 0.3, 0.0, 0.6));

  // ------------------------------------------------------------- wave lines
  // Faint on purpose: texture, not a feature. Distances are measured
  // perpendicular to each line so steep stretches stay as thin as flat ones.
  float centre = 0.12 + 0.03 * sin(t * 0.07) + 0.22 * (0.5 - 0.5 * cos(scroll * 0.7));
  float drift = scroll * 0.9;
  float x = st.x;
  float near = exp(-pow((x - mouse.x) * 2.2, 2.0)) * uMouseAmt;
  float amp0 = 1.0 + uEnergy * 0.6 + near * 0.7;
  float px = 1.0 / uRes.y;
  float lines = 0.0;
  const int N = 14;
  for (int i = 0; i < N; i++) {
    float fi = float(i) / float(N - 1);
    float amp = (0.07 + 0.05 * sin(t * 0.13 + fi * 2.0)) * amp0;
    float y = waveY(x, fi, amp, centre, t, drift, aspect);
    float slope = (waveY(x + px, fi, amp, centre, t, drift, aspect) - y) / px;
    float dy = uv.y - y;
    float push = near * 0.035 * sign(dy) * exp(-abs(uv.y - mouse.y) * 6.0);
    float d = abs(dy - push) / sqrt(1.0 + slope * slope) / px;
    lines += exp(-d * d * 0.9) * (0.55 + 0.45 * sin(fi * 6.28 + t * 0.4));
  }
  float envLine = smoothstep(-0.05, 0.4, uv.x) * smoothstep(1.05, 0.6, uv.x);
  vec3 lineCol = mix(field * vec3(0.7, 0.66, 0.8), field * 1.7 + 0.05, dark);
  col = mix(col, lineCol, clamp(lines, 0.0, 1.0) * envLine * mix(0.16, 0.16, dark));

  // Vignette keeps the edges heavy and the centre calm.
  float vig = smoothstep(1.35, 0.35, length((uv - 0.5) * vec2(aspect * 0.8, 1.0)));
  col *= mix(0.95 + 0.05 * vig, 0.68 + 0.32 * vig, dark);

  // Dither hides banding in the long, shallow gradients.
  col += (hash(frag + fract(t)) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying } = usePlayer();
  const playingRef = useRef(isPlaying);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uRes = u("uRes");
    const uTime = u("uTime");
    const uMouse = u("uMouse");
    const uMouseAmt = u("uMouseAmt");
    const uVel = u("uVel");
    const uScroll = u("uScroll");
    const uDark = u("uDark");
    const uEnergy = u("uEnergy");
    const uRipples = u("uRipples");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isDark = () => document.documentElement.classList.contains("dark");

    // Targets are written by listeners; the render loop eases toward them.
    const target = { mx: 0.7, my: 0.6, active: 0, vx: 0, vy: 0, scroll: 0, dark: isDark() ? 1 : 0 };
    const state = { ...target, energy: 0 };
    let lastMove = 0;
    let lastPointer = { x: 0, y: 0, t: 0 };

    // Ring buffer of click ripples: [x, y, startTime, strength] each.
    const ripples = new Float32Array(RIPPLES * 4);
    const rippleUniform = new Float32Array(RIPPLES * 4);
    let nextRipple = 0;

    const resize = () => {
      // The image is soft by design, so a fraction of device pixels is plenty;
      // enough, though, to keep the thin wave lines clean.
      const dpr = window.devicePixelRatio || 1;
      const scale = dpr >= 1.5 ? Math.min(dpr, 2) * 0.5 : dpr * 0.75;
      const w = Math.max(1, Math.round(window.innerWidth * scale));
      const h = Math.max(1, Math.round(window.innerHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const x = event.clientX / window.innerWidth;
      const y = 1 - event.clientY / window.innerHeight;
      const now = performance.now();
      const dt = (now - lastPointer.t) / 1000;
      if (dt > 0 && dt < 0.1) {
        // Velocity in screen heights per second, capped so flicks stay graceful.
        const aspect = window.innerWidth / window.innerHeight;
        const vx = ((x - lastPointer.x) * aspect) / dt;
        const vy = (y - lastPointer.y) / dt;
        const len = Math.hypot(vx, vy);
        const k = len > 2.5 ? 2.5 / len : 1;
        target.vx = vx * k;
        target.vy = vy * k;
      }
      lastPointer = { x, y, t: now };
      target.mx = x;
      target.my = y;
      target.active = 1;
      lastMove = now;
    };
    const onDown = (event: PointerEvent) => {
      if (reduceMotion.matches) return;
      const i = nextRipple * 4;
      ripples[i] = event.clientX / window.innerWidth;
      ripples[i + 1] = 1 - event.clientY / window.innerHeight;
      ripples[i + 2] = performance.now();
      ripples[i + 3] = 1;
      nextRipple = (nextRipple + 1) % RIPPLES;
      if (event.pointerType !== "touch") {
        target.mx = ripples[i];
        target.my = ripples[i + 1];
        target.active = 1;
        lastMove = performance.now();
      }
    };
    const onLeave = () => {
      target.active = 0;
    };
    const onScroll = () => {
      target.scroll = window.scrollY / Math.max(1, window.innerHeight);
    };
    const themeObserver = new MutationObserver(() => {
      target.dark = isDark() ? 1 : 0;
      if (reduceMotion.matches) {
        state.dark = target.dark;
        draw(performance.now());
      }
    });

    const start = performance.now();
    let frame = 0;
    let prev = start;

    function draw(now: number) {
      if (!gl) return;
      resize();
      for (let k = 0; k < RIPPLES; k++) {
        const i = k * 4;
        const age = (now - ripples[i + 2]) / 1000;
        const alive = ripples[i + 3] > 0 && age < 3.5;
        rippleUniform[i] = ripples[i];
        rippleUniform[i + 1] = ripples[i + 1];
        rippleUniform[i + 2] = age;
        rippleUniform[i + 3] = alive ? ripples[i + 3] : 0;
      }
      gl.uniform2f(uRes, canvas!.width, canvas!.height);
      gl.uniform1f(uTime, reduceMotion.matches ? 12 : (now - start) / 1000);
      gl.uniform2f(uMouse, state.mx, state.my);
      gl.uniform1f(uMouseAmt, state.active);
      gl.uniform2f(uVel, state.vx, state.vy);
      gl.uniform1f(uScroll, state.scroll);
      gl.uniform1f(uDark, state.dark);
      gl.uniform1f(uEnergy, state.energy);
      gl.uniform4fv(uRipples, rippleUniform);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function loop(now: number) {
      frame = requestAnimationFrame(loop);
      // ~30fps is plenty for motion this soft, and halves the work for the
      // GPU and for every glass panel re-blurring the canvas behind it.
      if (now - prev < 30) return;
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      // Idle cursors fade out so the light does not sit in one place forever.
      if (now - lastMove > 5000) target.active = 0;
      const ease = (k: number) => 1 - Math.exp(-k * dt);
      // Motion settles on its own once the pointer stops.
      target.vx *= 1 - ease(5);
      target.vy *= 1 - ease(5);
      state.mx += (target.mx - state.mx) * ease(4.5);
      state.my += (target.my - state.my) * ease(4.5);
      state.vx += (target.vx - state.vx) * ease(6);
      state.vy += (target.vy - state.vy) * ease(6);
      state.active += (target.active - state.active) * ease(target.active ? 4 : 0.8);
      state.scroll += (target.scroll - state.scroll) * ease(4);
      state.dark += (target.dark - state.dark) * ease(5);
      state.energy += ((playingRef.current ? 1 : 0) - state.energy) * ease(1.2);
      draw(now);
    }

    const run = () => {
      cancelAnimationFrame(frame);
      if (reduceMotion.matches || document.hidden) {
        Object.assign(state, { ...target, active: 0, vx: 0, vy: 0, energy: 0 });
        ripples.fill(0);
        draw(performance.now());
        return;
      }
      prev = performance.now();
      frame = requestAnimationFrame(loop);
    };

    onScroll();
    Object.assign(state, target);
    run();
    canvas.dataset.ready = "true";

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", run);
    document.addEventListener("visibilitychange", run);
    reduceMotion.addEventListener("change", run);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", run);
      document.removeEventListener("visibilitychange", run);
      reduceMotion.removeEventListener("change", run);
      themeObserver.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  usePointerEffects();

  return (
    <div aria-hidden="true" className="ambient">
      <canvas ref={canvasRef} className="ambient-canvas" />
      <div className="ambient-grain" />
    </div>
  );
}

/**
 * Pointer reactions for the glass UI, via one set of delegated listeners:
 *
 * - `.spotlight` cards get a light and a lit rim under the cursor, and tilt a
 *   couple of degrees toward it (--mx/--my/--spot/--rx/--ry).
 * - `.magnetic` controls lean a few pixels toward the cursor (--mag-x/--mag-y).
 * - Pressing a card or a primary control sends a soft ripple from the press
 *   point (a transient `.press-ripple` span).
 *
 * Movement is batched to one write per frame; tilt, pull and ripples are
 * skipped under reduced motion.
 */
function usePointerEffects() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let card: HTMLElement | null = null;
    let magnet: HTMLElement | null = null;
    let pending: PointerEvent | null = null;
    let raf = 0;

    const releaseCard = () => {
      if (!card) return;
      card.style.removeProperty("--spot");
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
      card = null;
    };
    const releaseMagnet = () => {
      if (!magnet) return;
      magnet.style.removeProperty("--mag-x");
      magnet.style.removeProperty("--mag-y");
      magnet = null;
    };

    const apply = () => {
      raf = 0;
      const event = pending;
      if (!event) return;
      const el = event.target as Element | null;
      const still = reduceMotion.matches;

      const nextCard = el?.closest?.<HTMLElement>(".spotlight") ?? null;
      if (nextCard !== card) releaseCard();
      card = nextCard;
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);
        card.style.setProperty("--spot", "1");
        if (!still) {
          // Up to ~2.5° either way: enough to feel the card, not to see it spin.
          const tilt = 5 * Math.min(1, 320 / Math.max(rect.width, rect.height));
          card.style.setProperty("--rx", `${((0.5 - y / rect.height) * tilt).toFixed(2)}deg`);
          card.style.setProperty("--ry", `${((x / rect.width - 0.5) * tilt).toFixed(2)}deg`);
        }
      }

      const nextMagnet = still ? null : (el?.closest?.<HTMLElement>(".magnetic") ?? null);
      if (nextMagnet !== magnet) releaseMagnet();
      magnet = nextMagnet;
      if (magnet) {
        const rect = magnet.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const clamp = (v: number) => Math.max(-5, Math.min(5, v));
        magnet.style.setProperty("--mag-x", `${clamp(dx * 0.16).toFixed(2)}px`);
        magnet.style.setProperty("--mag-y", `${clamp(dy * 0.22).toFixed(2)}px`);
      }
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pending = event;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onDown = (event: PointerEvent) => {
      if (reduceMotion.matches) return;
      const host = (event.target as Element | null)?.closest?.<HTMLElement>(".spotlight, .sheen, .magnetic");
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "press-ripple";
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.setProperty("--cx", `${event.clientX - rect.left}px`);
      ripple.style.setProperty("--cy", `${event.clientY - rect.top}px`);
      ripple.style.setProperty("--size", `${Math.hypot(rect.width, rect.height) * 2}px`);
      host.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    };

    const onLeave = () => {
      releaseCard();
      releaseMagnet();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);
}
