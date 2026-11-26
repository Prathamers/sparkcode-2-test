// SPDX-License-Identifier: AGPL-3.0-or-later
import type { RuntimeSpriteState, StageSettings, WebGL2RenderConfig } from '../../types/project';
import {
  BLOOM_BLUR_FRAG,
  BLOOM_EXTRACT_FRAG,
  COMPOSITE_FRAG,
  FULLSCREEN_VERT,
  LIGHTING_FRAG,
} from './shaders';
import { hexToRgb01, packLightsUniformData, packOccludersUniformData } from './uniforms';

interface FboTarget {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  width: number;
  height: number;
}

export interface WebGL2PassInput {
  sceneCanvas: HTMLCanvasElement;
  spriteCanvas: HTMLCanvasElement | null;
  width: number;
  height: number;
  dpr: number;
  stage: StageSettings;
  config: WebGL2RenderConfig;
  lights: RuntimeSpriteState[];
  occluders: RuntimeSpriteState[];
  toScreenX: (wx: number) => number;
  toScreenY: (wy: number) => number;
  camZoom: number;
}

export class WebGL2LightingBloomPipeline {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private available = false;
  private fallbackReason: string | null = null;
  private useHalfFloat = false;

  private vao: WebGLVertexArrayObject | null = null;
  private sceneTex: WebGLTexture | null = null;
  private spriteTex: WebGLTexture | null = null;
  private blankTex: WebGLTexture | null = null;

  private litFbo: FboTarget | null = null;
  private bloomFboA: FboTarget | null = null;
  private bloomFboB: FboTarget | null = null;

  private lightingProg: WebGLProgram | null = null;
  private extractProg: WebGLProgram | null = null;
  private blurProg: WebGLProgram | null = null;
  private compositeProg: WebGLProgram | null = null;

  private onContextLostBound: (e: Event) => void;
  private onContextRestoredBound: () => void;

  constructor() {
    this.onContextLostBound = (e: Event) => {
      e.preventDefault();
      this.available = false;
      this.fallbackReason = 'WebGL2 context lost — using 2D Canvas fallback';
    };
    this.onContextRestoredBound = () => this.initResources();

    if (typeof document === 'undefined') {
      this.fallbackReason = 'Headless environment (no DOM canvas)';
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });

      if (!gl) {
        this.fallbackReason = 'WebGL2 is not supported by this browser or GPU';
        return;
      }

      this.canvas = canvas;
      this.gl = gl;
      canvas.addEventListener('webglcontextlost', this.onContextLostBound);
      canvas.addEventListener('webglcontextrestored', this.onContextRestoredBound);
      this.initResources();
    } catch (err) {
      this.fallbackReason = err instanceof Error ? err.message : 'Failed to initialize WebGL2';
    }
  }

  public isAvailable(): boolean {
    return this.available && Boolean(this.gl) && Boolean(this.canvas);
  }

  public getFallbackReason(): string | null {
    return this.fallbackReason;
  }

  public getOutputCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  private initResources(): void {
    const gl = this.gl;
    if (!gl) return;

    try {
      const extColorFloat = gl.getExtension('EXT_color_buffer_float');
      const extFloatLinear = gl.getExtension('OES_texture_float_linear');
      this.useHalfFloat = Boolean(extColorFloat && extFloatLinear);

      this.lightingProg = this.createProgram(gl, FULLSCREEN_VERT, LIGHTING_FRAG);
      this.extractProg = this.createProgram(gl, FULLSCREEN_VERT, BLOOM_EXTRACT_FRAG);
      this.blurProg = this.createProgram(gl, FULLSCREEN_VERT, BLOOM_BLUR_FRAG);
      this.compositeProg = this.createProgram(gl, FULLSCREEN_VERT, COMPOSITE_FRAG);

      this.vao = gl.createVertexArray();
      this.sceneTex = this.createDynamicTexture(gl);
      this.spriteTex = this.createDynamicTexture(gl);
      this.blankTex = this.createBlankTexture(gl);

      this.available = true;
      this.fallbackReason = null;
    } catch (err) {
      this.available = false;
      this.fallbackReason =
        err instanceof Error ? `WebGL2 shader error: ${err.message}` : 'WebGL2 shader compile failed';
    }
  }

  private compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Unable to allocate WebGL2 shader');
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) || 'Unknown shader compile error';
      gl.deleteShader(shader);
      throw new Error(log);
    }
    return shader;
  }

  private createProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
    const vs = this.compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram();
    if (!prog) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      throw new Error('Unable to allocate WebGL2 program');
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog) || 'Unknown program link error';
      gl.deleteProgram(prog);
      throw new Error(log);
    }
    return prog;
  }

  private createDynamicTexture(gl: WebGL2RenderingContext): WebGLTexture {
    const tex = gl.createTexture();
    if (!tex) throw new Error('Unable to create WebGL2 texture');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  private createBlankTexture(gl: WebGL2RenderingContext): WebGLTexture {
    const tex = this.createDynamicTexture(gl);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    return tex;
  }

  private createFbo(gl: WebGL2RenderingContext, width: number, height: number): FboTarget {
    const fbo = gl.createFramebuffer();
    const tex = this.createDynamicTexture(gl);
    if (!fbo) throw new Error('Unable to create WebGL2 framebuffer');

    const alloc = (useFloat: boolean) => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (useFloat) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    };

    if (this.useHalfFloat && !alloc(true)) {
      this.useHalfFloat = false;
      if (!alloc(false)) throw new Error('WebGL2 framebuffer incomplete');
    } else if (!this.useHalfFloat && !alloc(false)) {
      throw new Error('WebGL2 framebuffer incomplete');
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, width, height };
  }

  private destroyFbo(gl: WebGL2RenderingContext, target: FboTarget | null): void {
    if (!target) return;
    gl.deleteFramebuffer(target.fbo);
    gl.deleteTexture(target.tex);
  }

  private ensureTargets(gl: WebGL2RenderingContext, width: number, height: number): void {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const bw = Math.max(1, Math.floor(w / 2));
    const bh = Math.max(1, Math.floor(h / 2));

    if (this.canvas && (this.canvas.width !== w || this.canvas.height !== h)) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    if (!this.litFbo || this.litFbo.width !== w || this.litFbo.height !== h) {
      this.destroyFbo(gl, this.litFbo);
      this.litFbo = this.createFbo(gl, w, h);
    }
    if (!this.bloomFboA || this.bloomFboA.width !== bw || this.bloomFboA.height !== bh) {
      this.destroyFbo(gl, this.bloomFboA);
      this.destroyFbo(gl, this.bloomFboB);
      this.bloomFboA = this.createFbo(gl, bw, bh);
      this.bloomFboB = this.createFbo(gl, bw, bh);
    }
  }

  public render(input: WebGL2PassInput): number {
    const gl = this.gl;
    if (
      !this.available ||
      !gl ||
      !this.canvas ||
      !this.vao ||
      !this.sceneTex ||
      !this.spriteTex ||
      !this.blankTex ||
      !this.lightingProg ||
      !this.extractProg ||
      !this.blurProg ||
      !this.compositeProg
    ) {
      return -1;
    }

    try {
      this.ensureTargets(gl, input.width, input.height);
      const litFbo = this.litFbo!;
      const bloomA = this.bloomFboA!;
      const bloomB = this.bloomFboB!;

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, input.sceneCanvas);

      gl.activeTexture(gl.TEXTURE1);
      if (input.spriteCanvas && input.config.normalMapping) {
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, input.spriteCanvas);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, this.blankTex);
      }

      gl.bindVertexArray(this.vao);

      const packedLights = packLightsUniformData(
        input.lights,
        input.toScreenX,
        input.toScreenY,
        input.camZoom,
        input.dpr,
        input.height
      );
      const packedOccluders = packOccludersUniformData(
        input.occluders,
        input.toScreenX,
        input.toScreenY,
        input.camZoom,
        input.dpr,
        input.height
      );
      const [ambR, ambG, ambB] = hexToRgb01(input.stage.ambientColor || '#050811');

      // Pass 1: Deferred Normal-Mapped Lighting + Hardware Soft Shadows
      gl.bindFramebuffer(gl.FRAMEBUFFER, litFbo.fbo);
      gl.viewport(0, 0, litFbo.width, litFbo.height);
      gl.useProgram(this.lightingProg);
      gl.uniform1i(gl.getUniformLocation(this.lightingProg, 'uSceneTex'), 0);
      gl.uniform1i(gl.getUniformLocation(this.lightingProg, 'uSpriteTex'), 1);
      gl.uniform2f(gl.getUniformLocation(this.lightingProg, 'uResolution'), input.width, input.height);
      gl.uniform3f(gl.getUniformLocation(this.lightingProg, 'uAmbientColor'), ambR, ambG, ambB);
      gl.uniform1f(gl.getUniformLocation(this.lightingProg, 'uAmbientDarkness'), input.stage.ambientDarkness);
      gl.uniform1f(gl.getUniformLocation(this.lightingProg, 'uNormalMapping'), input.config.normalMapping ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(this.lightingProg, 'uNormalStrength'), input.config.normalStrength);
      gl.uniform1f(gl.getUniformLocation(this.lightingProg, 'uHardwareShadows'), input.config.hardwareShadows ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(this.lightingProg, 'uShadowSoftness'), input.config.shadowSoftness);
      gl.uniform1i(gl.getUniformLocation(this.lightingProg, 'uLightCount'), packedLights.count);
      gl.uniform4fv(gl.getUniformLocation(this.lightingProg, 'uLightPosRad'), packedLights.posRad);
      gl.uniform4fv(gl.getUniformLocation(this.lightingProg, 'uLightColorType'), packedLights.colorType);
      gl.uniform4fv(gl.getUniformLocation(this.lightingProg, 'uLightSpotDir'), packedLights.spotDir);
      gl.uniform1i(gl.getUniformLocation(this.lightingProg, 'uOccluderCount'), packedOccluders.count);
      gl.uniform4fv(gl.getUniformLocation(this.lightingProg, 'uOccBox'), packedOccluders.boxes);
      gl.uniform2fv(gl.getUniformLocation(this.lightingProg, 'uOccRot'), packedOccluders.rotations);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      let passes = 1;

      // Pass 2 & 3: Bright-Pass Extraction + Dual-Pass Separable Blur
      if (input.config.bloomEnabled && input.config.bloomIntensity > 0.01) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
        gl.viewport(0, 0, bloomA.width, bloomA.height);
        gl.useProgram(this.extractProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, litFbo.tex);
        gl.uniform1i(gl.getUniformLocation(this.extractProg, 'uLitTex'), 0);
        gl.uniform1f(gl.getUniformLocation(this.extractProg, 'uThreshold'), input.config.bloomThreshold);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        passes += 1;

        gl.useProgram(this.blurProg);
        const texLoc = gl.getUniformLocation(this.blurProg, 'uTex');
        const dirLoc = gl.getUniformLocation(this.blurProg, 'uDirection');
        gl.uniform1i(texLoc, 0);

        const baseRadius = input.config.bloomRadius * Math.max(1, input.dpr * 0.65);
        for (let iter = 0; iter < 2; iter++) {
          const r = baseRadius * (iter === 0 ? 1.0 : 1.75);
          gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fbo);
          gl.viewport(0, 0, bloomB.width, bloomB.height);
          gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
          gl.uniform2f(dirLoc, r / bloomA.width, 0);
          gl.drawArrays(gl.TRIANGLES, 0, 3);

          gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
          gl.viewport(0, 0, bloomA.width, bloomA.height);
          gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
          gl.uniform2f(dirLoc, 0, r / bloomA.height);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          passes += 2;
        }
      }

      // Pass 4: Final Composite + Soft Filmic Tone Mapping + GPU Post-FX
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, input.width, input.height);
      gl.useProgram(this.compositeProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, litFbo.tex);
      gl.uniform1i(gl.getUniformLocation(this.compositeProg, 'uLitTex'), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
      gl.uniform1i(gl.getUniformLocation(this.compositeProg, 'uBloomTex'), 1);

      const fx = input.stage.stageEffects;
      const [tintR, tintG, tintB] = hexToRgb01(fx.tint || '#38BDF8');

      gl.uniform2f(gl.getUniformLocation(this.compositeProg, 'uResolution'), input.width, input.height);
      gl.uniform1f(gl.getUniformLocation(this.compositeProg, 'uBloomEnabled'), input.config.bloomEnabled ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(this.compositeProg, 'uBloomIntensity'), input.config.bloomIntensity);
      gl.uniform1f(
        gl.getUniformLocation(this.compositeProg, 'uPixelate'),
        fx.pixelate > 1 ? Math.max(2, Math.min(24, Math.round(fx.pixelate))) : 0
      );
      gl.uniform1f(
        gl.getUniformLocation(this.compositeProg, 'uChromatic'),
        fx.chromatic > 0.2 ? Math.min(14, fx.chromatic) * input.dpr : 0
      );
      gl.uniform1f(gl.getUniformLocation(this.compositeProg, 'uVignette'), fx.vignette);
      gl.uniform3f(gl.getUniformLocation(this.compositeProg, 'uTintColor'), tintR, tintG, tintB);
      gl.uniform1f(gl.getUniformLocation(this.compositeProg, 'uTintAmount'), fx.tintAmount);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      return passes + 1;
    } catch (err) {
      this.available = false;
      this.fallbackReason =
        err instanceof Error ? `WebGL2 render error: ${err.message}` : 'WebGL2 render failure';
      return -1;
    }
  }

  public dispose(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this.onContextLostBound);
      this.canvas.removeEventListener('webglcontextrestored', this.onContextRestoredBound);
    }
    const gl = this.gl;
    if (gl) {
      this.destroyFbo(gl, this.litFbo);
      this.destroyFbo(gl, this.bloomFboA);
      this.destroyFbo(gl, this.bloomFboB);
      if (this.sceneTex) gl.deleteTexture(this.sceneTex);
      if (this.spriteTex) gl.deleteTexture(this.spriteTex);
      if (this.blankTex) gl.deleteTexture(this.blankTex);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.lightingProg) gl.deleteProgram(this.lightingProg);
      if (this.extractProg) gl.deleteProgram(this.extractProg);
      if (this.blurProg) gl.deleteProgram(this.blurProg);
      if (this.compositeProg) gl.deleteProgram(this.compositeProg);
    }
    this.litFbo = null;
    this.bloomFboA = null;
    this.bloomFboB = null;
    this.gl = null;
    this.canvas = null;
    this.available = false;
  }
}
