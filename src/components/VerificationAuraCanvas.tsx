import React, { useEffect, useRef } from 'react';

interface VerificationAuraCanvasProps {
  /** Dynamic intensity factor calculated from scroll velocity (defaults to 0) */
  intensity?: number;
  /** Whether the master has verified status (shows vivid emerald aura) */
  isVerified?: boolean;
  /** Custom base color in hex (defaults to emerald #10b981) */
  colorHex?: string;
  /** Optional container className */
  className?: string;
}

// Vertex shader: Full-screen quad
const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Fragment shader: Raw WebGL 2D Simplex Noise + FBM Emerald Smoke / Plasma
const FRAGMENT_SHADER_SRC = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform float u_intensity;

varying vec2 v_uv;

// Simplex 2D noise implementation
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                 + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                          dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 5-Octave Fractional Brownian Motion (FBM)
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 5; i++) {
    value += amplitude * (snoise(p * frequency) * 0.5 + 0.5);
    p = p * 2.05 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  // Correct aspect ratio so the aura is organic and naturally centered
  float aspect = u_resolution.x / u_resolution.y;
  vec2 center = vec2(0.5, 0.44);
  vec2 p = v_uv - center;
  p.x *= aspect;

  float dist = length(p);

  // Time dynamics: accelerates slightly during scroll intensity
  float speed = 0.32 + u_intensity * 0.38;
  float t = u_time * speed;

  // Domain warping for organic wisps and swirls of emerald smoke
  vec2 coord = p * (2.6 - u_intensity * 0.2);
  vec2 q = vec2(
    fbm(coord + vec2(0.0, t * 0.35)),
    fbm(coord + vec2(5.2, 1.3 - t * 0.28))
  );
  vec2 r = vec2(
    fbm(coord + 3.2 * q + vec2(1.7, 9.2 + 0.22 * t)),
    fbm(coord + 3.2 * q + vec2(8.3, 2.8 - 0.18 * t))
  );
  float smoke = fbm(coord + 3.6 * r);

  // Masking: smoothstep for soft radial falloff that fades completely to 0 at edges
  // Reaches absolute transparency well before the canvas borders (no square clipping)
  float maxRadius = 0.52 + u_intensity * 0.14;
  float innerRadius = 0.06;
  float radialAlpha = smoothstep(maxRadius, innerRadius, dist);

  // Vertical bottom fade so the smoke seamlessly blends into content
  float bottomFade = smoothstep(1.0, 0.70, v_uv.y);

  // Deep emerald color spectrum
  // Base emerald (#10b981) -> Vivid neon -> Luminescent mint/white core
  vec3 darkSmoke = vec3(0.015, 0.12, 0.08);
  vec3 baseEmerald = u_color;
  vec3 brightNeon = vec3(0.18, 0.96, 0.65);
  vec3 coreMint = vec3(0.72, 1.0, 0.88);

  // Smoke color blending
  vec3 color = mix(darkSmoke, baseEmerald, smoothstep(0.12, 0.62, smoke));
  color = mix(color, brightNeon, smoothstep(0.52, 0.82, smoke));
  color = mix(color, coreMint, pow(smoke, 3.2) * (0.5 + u_intensity * 0.7));

  // Flare boost on swipe/scroll intensity
  color += brightNeon * (u_intensity * 0.45 * radialAlpha);

  // Alpha calculation with smoothstep edge masking
  float alpha = pow(smoke, 1.35) * radialAlpha * bottomFade;
  alpha *= (0.62 + u_intensity * 0.5);
  alpha = clamp(alpha, 0.0, 0.95);

  // Premultiplied alpha for clean WebGL blending onto dark background
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

function hexToRgbNormalized(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = ((bigint >> 16) & 255) / 255.0;
  const g = ((bigint >> 8) & 255) / 255.0;
  const b = (bigint & 255) / 255.0;
  return [r, g, b];
}

export const VerificationAuraCanvas: React.FC<VerificationAuraCanvasProps> = ({
  intensity = 0,
  isVerified = true,
  colorHex = '#10b981',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  // Springy lerp references
  const currentIntensityRef = useRef<number>(0);
  const targetIntensityRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());

  // Update target intensity when prop changes
  useEffect(() => {
    targetIntensityRef.current = Math.max(targetIntensityRef.current, intensity);
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize raw WebGL
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false
    });

    if (!gl) {
      console.warn("WebGL not supported for Verification Aura");
      return;
    }

    // Compile Shader Helper
    const createShader = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry (-1,-1 to 1,1)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPosLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uResLoc = gl.getUniformLocation(program, 'u_resolution');
    const uColorLoc = gl.getUniformLocation(program, 'u_color');
    const uIntensityLoc = gl.getUniformLocation(program, 'u_intensity');

    const [r, g, b] = hexToRgbNormalized(colorHex);
    gl.uniform3f(uColorLoc, r, g, b);

    // WebGL blending setup
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    // 4. Optimization: Downscaling (render at width/2, height/2 for 4x GPU savings)
    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Half resolution downscaling
      const width = Math.max(1, Math.floor((rect.width * dpr) / 2));
      const height = Math.max(1, Math.floor((rect.height * dpr) / 2));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(uResLoc, width, height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 3. Scroll Physics & Smooth Lerp Loop
    const render = () => {
      if (!isVisibleRef.current) return;

      const now = performance.now();
      const elapsedSeconds = (now - startTimeRef.current) / 1000.0;

      // Subtle resting breathing wave (0.1 to 0.18)
      const breathing = Math.sin(elapsedSeconds * 1.8) * 0.05;
      const baseRestingIntensity = isVerified ? (0.12 + breathing) : 0.0;

      // Elastic decay back towards base
      currentIntensityRef.current += (targetIntensityRef.current - currentIntensityRef.current) * 0.12;
      targetIntensityRef.current += (baseRestingIntensity - targetIntensityRef.current) * 0.05;

      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uTimeLoc, elapsedSeconds);
      gl.uniform1f(uIntensityLoc, currentIntensityRef.current);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    const stopLoop = () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };

    // 4. Optimization: Intersection Observer to pause rendering when out of viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        isVisibleRef.current = isVisible;
        if (isVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(canvas);
    startLoop();

    return () => {
      stopLoop();
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (vertShader) gl.deleteShader(vertShader);
      if (fragShader) gl.deleteShader(fragShader);
      if (program) gl.deleteProgram(program);
    };
  }, [colorHex, isVerified]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      style={{
        // Stretched via CSS to 100% while WebGL downscales internal buffer by 2x
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    />
  );
};
