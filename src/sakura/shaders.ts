/**
 * 樱花效果 GLSL 片段着色器
 */

// 后期合成 (post-processing) 片段着色器。
// 由 createEffectLib() 在运行时拼接 sakuraBackLight 透明度尾部使用。
export const ppFinalFsh =
    '#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D uSrc;    uniform sampler2D uBloom;    uniform vec2 uDelta;    varying vec2 texCoord;    varying vec2 screenCoord;    void main(void) {        vec4 srccol = texture2D(uSrc, texCoord) * 2.0;        vec4 bloomcol = texture2D(uBloom, texCoord);        vec4 col;        col = srccol + bloomcol * (vec4(1.0) + srccol);        col *= smoothstep(1.0, 0.0, pow(length((texCoord - vec2(0.5)) * 2.0), 1.2) * 0.5);        col = pow(col, vec4(0.45454545454545));         ';
