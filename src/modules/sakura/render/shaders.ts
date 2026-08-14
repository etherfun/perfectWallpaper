/**
 * 樱花效果 GLSL 着色器 — 从 index.html 整合为 TS 常量
 *
 * 原为 index.html 中的 <script type="x-shader/..."> 标签，
 * 现统一收敛于此，index.html 不再内嵌 GLSL。
 */

// ─── 樱花粒子顶点着色器（sakura_point_vsh） ──────────────────────────────
export const sakuraPointVsh = `
    //樱花
    uniform mat4 uProjection;
    uniform mat4 uModelview;
    uniform vec3 uResolution;
    uniform vec3 uOffset;
    uniform vec3 uDOF;  //x:focus distance, y:focus radius, z:max radius
    uniform vec3 uFade; //x:start distance, y:half distance, z:near fade start

    attribute vec3 aPosition;
    attribute vec3 aEuler;
    attribute vec2 aMisc; //x:size, y:fade

    varying vec3 pposition;
    varying float psize;
    varying float palpha;
    varying float pdist;

    //varying mat3 rotMat;
    varying vec3 normX;
    varying vec3 normY;
    varying vec3 normZ;
    varying vec3 normal;

    varying float diffuse;
    varying float specular;
    varying float rstop;
    varying float distancefade;

    void main(void) {
        // Projection is based on vertical angle
        vec4 pos = uModelview * vec4(aPosition + uOffset, 1.0);
        gl_Position = uProjection * pos;
        gl_PointSize = aMisc.x * uProjection[1][1] / -pos.z * uResolution.y * 0.5;

        pposition = pos.xyz;
        psize = aMisc.x;
        pdist = length(pos.xyz);
        palpha = smoothstep(0.0, 1.0, (pdist - 0.1) / uFade.z);

        vec3 elrsn = sin(aEuler);
        vec3 elrcs = cos(aEuler);
        mat3 rotx = mat3(
            1.0, 0.0, 0.0,
            0.0, elrcs.x, elrsn.x,
            0.0, -elrsn.x, elrcs.x
        );
        mat3 roty = mat3(
            elrcs.y, 0.0, -elrsn.y,
            0.0, 1.0, 0.0,
            elrsn.y, 0.0, elrcs.y
        );
        mat3 rotz = mat3(
            elrcs.z, elrsn.z, 0.0,
            -elrsn.z, elrcs.z, 0.0,
            0.0, 0.0, 1.0
        );
        mat3 rotmat = rotx * roty * rotz;
        normal = rotmat[2];

        mat3 trrotm = mat3(
            rotmat[0][0], rotmat[1][0], rotmat[2][0],
            rotmat[0][1], rotmat[1][1], rotmat[2][1],
            rotmat[0][2], rotmat[1][2], rotmat[2][2]
        );
        normX = trrotm[0];
        normY = trrotm[1];
        normZ = trrotm[2];

        const vec3 lit = vec3(0.6917144638660746, 0.6917144638660746, -0.20751433915982237);

        float tmpdfs = dot(lit, normal);
        if(tmpdfs < 0.0) {
            normal = -normal;
            tmpdfs = dot(lit, normal);
        }
        diffuse = 0.4 + tmpdfs;

        vec3 eyev = normalize(-pos.xyz);
        if(dot(eyev, normal) > 0.0) {
            vec3 hv = normalize(eyev + lit);
            specular = pow(max(dot(hv, normal), 0.0), 20.0);
        }
        else {
            specular = 0.0;
        }

        rstop = clamp((abs(pdist - uDOF.x) - uDOF.y) / uDOF.z, 0.0, 1.0);
        rstop = pow(rstop, 0.5);
        //-0.69315 = ln(0.5)
        distancefade = min(1.0, exp((uFade.x - pdist) * 0.69315 / uFade.y));
    }
    `;

// ─── 樱花粒子片元着色器（sakura_point_fsh） ──────────────────────────────
export const sakuraPointFsh = `
    #ifdef GL_ES
    //precision mediump float;
    precision highp float;
    #endif

    uniform vec3 uDOF;  //x:focus distance, y:focus radius, z:max radius
    uniform vec3 uFade; //x:start distance, y:half distance, z:near fade start

    const vec3 fadeCol = vec3(0.08, 0.03, 0.06);

    varying vec3 pposition;
    varying float psize;
    varying float palpha;
    varying float pdist;

    //varying mat3 rotMat;
    varying vec3 normX;
    varying vec3 normY;
    varying vec3 normZ;
    varying vec3 normal;

    varying float diffuse;
    varying float specular;
    varying float rstop;
    varying float distancefade;

    float ellipse(vec2 p, vec2 o, vec2 r) {
        vec2 lp = (p - o) / r;
        return length(lp) - 1.0;
    }

    void main(void) {
        vec3 p = vec3(gl_PointCoord - vec2(0.5, 0.5), 0.0) * 2.0;
        vec3 d = vec3(0.0, 0.0, -1.0);
        float nd = normZ.z; //dot(-normZ, d);
        if(abs(nd) < 0.0001) discard;

        float np = dot(normZ, p);
        vec3 tp = p + d * np / nd;
        vec2 coord = vec2(dot(normX, tp), dot(normY, tp));

        //angle = 15 degree
        const float flwrsn = 0.28819045102521;
        const float flwrcs = 0.965925826289068;
        mat2 flwrm = mat2(flwrcs, -flwrsn, flwrsn, flwrcs);
        vec2 flwrp = vec2(abs(coord.x), coord.y) * flwrm;

        float r;
        if(flwrp.x < 0.0) {
            r = ellipse(flwrp, vec2(0.065, 0.024) * 0.5, vec2(0.36, 0.96) * 0.5);
        }
        else {
            r = ellipse(flwrp, vec2(0.065, 0.024) * 0.5, vec2(0.58, 0.96) * 0.5);
        }

        if(r > rstop) discard;
        //花瓣颜色
        vec3 col = mix(vec3(1.0, 0.9, 0.75), vec3(1.0, 0.9, 0.87), r);
        float grady = mix(0.0, 1.0, pow(coord.y * 0.5 + 0.5, 0.35));
        col *= vec3(3.0, grady, grady);
        col *= mix(0.9, 1.0, pow(abs(coord.x), 1.0));
        col = col * diffuse + specular;

        col = mix(fadeCol, col, distancefade);

        float alpha = (rstop > 0.001)? (0.5 - r / (rstop * 2.0)) : 1.0;
        alpha = smoothstep(0.0, 1.0, alpha) * palpha;

        gl_FragColor = vec4(col * 3.0, alpha);
    }
    `;

// ─── 效果公共顶点着色器（fx_common_vsh） ──────────────────────────────────
export const fxCommonVsh = `
    uniform vec3 uResolution;
    attribute vec2 aPosition;

    varying vec2 texCoord;
    varying vec2 screenCoord;

    void main(void) {
        gl_Position = vec4(aPosition, 0.0, 1.0);
        texCoord = aPosition.xy * 0.5 + vec2(0.5, 0.5);
        screenCoord = aPosition.xy * vec2(uResolution.z, 1.0);
    }
    `;

// ─── 场景背景片元着色器（bg_fsh） ─────────────────────────────────────────
export const bgFsh = `
    #ifdef GL_ES
    //precision mediump float;
    precision highp float;
    #endif

    uniform vec2 uTimes;

    varying vec2 texCoord;
    varying vec2 screenCoord;

    void main(void) {
        vec3 col;
        float c;
        vec2 tmpv = texCoord * vec2(0.8, 1.0) - vec2(0.95, 1.0);
        c = exp(-pow(length(tmpv) * 1.2, 2.0));
        col = mix(vec3(0.05, 0.0, 0.03), vec3(0.96,0.88, 1.0) * 1.5, c);
        gl_FragColor = vec4(col * 0.5, 1.0);
    }
    `;

// ─── 提亮缓冲片元着色器（fx_brightbuf_fsh） ───────────────────────────────
export const fxBrightbufFsh = `
    #ifdef GL_ES
    //precision mediump float;
    precision highp float;
    #endif
    uniform sampler2D uSrc;
    uniform vec2 uDelta;

    varying vec2 texCoord;
    varying vec2 screenCoord;

    void main(void) {
        vec4 col = texture2D(uSrc, texCoord);
        gl_FragColor = vec4(col.rgb * 2.0 - vec3(0.5), 1.0);
    }
    `;

// ─── 方向模糊片元着色器（fx_dirblur_r4_fsh） ──────────────────────────────
export const fxDirblurFsh = `
    #ifdef GL_ES
    //precision mediump float;
    precision highp float;
    #endif
    uniform sampler2D uSrc;
    uniform vec2 uDelta;
    uniform vec4 uBlurDir; //dir(x, y), stride(z, w)

    varying vec2 texCoord;
    varying vec2 screenCoord;

    void main(void) {
        vec4 col = texture2D(uSrc, texCoord);
        col = col + texture2D(uSrc, texCoord + uBlurDir.xy * uDelta);
        col = col + texture2D(uSrc, texCoord - uBlurDir.xy * uDelta);
        col = col + texture2D(uSrc, texCoord + (uBlurDir.xy + uBlurDir.zw) * uDelta);
        col = col + texture2D(uSrc, texCoord - (uBlurDir.xy + uBlurDir.zw) * uDelta);
        gl_FragColor = col / 7.5;
    }
    `;

// ─── 效果公共片元着色器模板（fx_common_fsh） ──────────────────────────────
export const fxCommonFsh = `
    #ifdef GL_ES
    //precision mediump float;
    precision highp float;
    #endif
    uniform sampler2D uSrc;
    uniform vec2 uDelta;

    varying vec2 texCoord;
    varying vec2 screenCoord;

    void main(void) {
        gl_FragColor = texture2D(uSrc, texCoord);
    }
    `;

// ─── 后期合成顶点着色器（pp_final_vsh） ───────────────────────────────────
export const ppFinalVsh = `
    uniform vec3 uResolution;
    attribute vec2 aPosition;
    varying vec2 texCoord;
    varying vec2 screenCoord;
    void main(void) {
        gl_Position = vec4(aPosition, 0.0, 1.0);
        texCoord = aPosition.xy * 0.5 + vec2(0.5, 0.5);
        screenCoord = aPosition.xy * vec2(uResolution.z, 1.0);
    }
    `;

// 后期合成 (post-processing) 片元着色器（pp_final_fsh 完整参考版）。
// 运行时实际使用下方 ppFinalFsh（拼接 sakuraBackLight 透明度尾部）。
export const ppFinalFshFull = `
    #ifdef GL_ES
    //precision mediump float;
    precision highp float;
    #endif
    uniform sampler2D uSrc;
    uniform sampler2D uBloom;
    uniform vec2 uDelta;
    varying vec2 texCoord;
    varying vec2 screenCoord;
    void main(void) {
        vec4 srccol = texture2D(uSrc, texCoord) * 2.0;
        vec4 bloomcol = texture2D(uBloom, texCoord);
        vec4 col;
        col = srccol + bloomcol * (vec4(1.0) + srccol);
        col *= smoothstep(1.0, 0.0, pow(length((texCoord - vec2(0.5)) * 2.0), 1.2) * 0.5);
        col = pow(col, vec4(0.45454545454545)); //(1.0 / 2.2)

        gl_FragColor = vec4(col.rgb, 0.01);
        gl_FragColor.a = 0.01;
    }
    `;

// 后期合成 (post-processing) 片段着色器。
// 由 createEffectLib() 在运行时拼接 sakuraBackLight 透明度尾部使用。
export const ppFinalFsh =
    '#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D uSrc;    uniform sampler2D uBloom;    uniform vec2 uDelta;    varying vec2 texCoord;    varying vec2 screenCoord;    void main(void) {        vec4 srccol = texture2D(uSrc, texCoord) * 2.0;        vec4 bloomcol = texture2D(uBloom, texCoord);        vec4 col;        col = srccol + bloomcol * (vec4(1.0) + srccol);        col *= smoothstep(1.0, 0.0, pow(length((texCoord - vec2(0.5)) * 2.0), 1.2) * 0.5);        col = pow(col, vec4(0.45454545454545));         ';
