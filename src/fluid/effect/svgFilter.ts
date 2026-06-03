/**
 * SVG feTurbulence + feDisplacementMap 滤镜的构造与挂载
 *
 * 把 feTurbulence/feDisplacementMap 滤镜节点封装为一个独立模块，
 * 渲染器 `init` 时调用一次创建并挂到 `<body>`。
 */

import type { FluidEffectOptions } from '../types';
import { DEFAULT_FLUID_EFFECT_OPTIONS } from '../types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const FILTER_ID = 'fluid-filter-2';

export interface SvgFilterBundle {
    svg: SVGElement;
    filter: SVGFilterElement;
    feTurbulence: SVGFETurbulenceElement;
    feDisplacementMap: SVGFEDisplacementMapElement;
}

function resolveOptions(options: Partial<FluidEffectOptions>): Required<FluidEffectOptions> {
    return {
        resolution: options.resolution ?? DEFAULT_FLUID_EFFECT_OPTIONS.resolution,
        blurAmount: options.blurAmount ?? DEFAULT_FLUID_EFFECT_OPTIONS.blurAmount,
        displacementScale:
            options.displacementScale ?? DEFAULT_FLUID_EFFECT_OPTIONS.displacementScale,
        turbulenceSeed:
            options.turbulenceSeed ?? Math.floor(Math.random() * 1000),
        turbulenceFrequency:
            options.turbulenceFrequency ?? DEFAULT_FLUID_EFFECT_OPTIONS.turbulenceFrequency,
        turbulenceOctaves:
            options.turbulenceOctaves ?? DEFAULT_FLUID_EFFECT_OPTIONS.turbulenceOctaves,
        canvasDisplacementAmplitude:
            options.canvasDisplacementAmplitude ??
            DEFAULT_FLUID_EFFECT_OPTIONS.canvasDisplacementAmplitude,
        fullscreen: options.fullscreen ?? DEFAULT_FLUID_EFFECT_OPTIONS.fullscreen,
    };
}

/**
 * 创建并挂载流体变形 SVG 滤镜到 `<body>` 末尾。
 * 返回的 `feTurbulence` / `feDisplacementMap` 节点可在后续被 `setAttribute` 调整。
 */
export function mountSvgFilter(options: Partial<FluidEffectOptions>): SvgFilterBundle {
    const resolved = resolveOptions(options);

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';

    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', FILTER_ID);
    filter.setAttribute('x', '-10%');
    filter.setAttribute('y', '-10%');
    filter.setAttribute('width', '120%');
    filter.setAttribute('height', '120%');
    filter.setAttribute('filterUnits', 'objectBoundingBox');
    filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    const feTurbulence = document.createElementNS(SVG_NS, 'feTurbulence');
    feTurbulence.setAttribute('type', 'fractalNoise');
    feTurbulence.setAttribute('baseFrequency', resolved.turbulenceFrequency.toString());
    feTurbulence.setAttribute('numOctaves', resolved.turbulenceOctaves.toString());
    feTurbulence.setAttribute('seed', resolved.turbulenceSeed.toString());

    const feDisplacementMap = document.createElementNS(SVG_NS, 'feDisplacementMap');
    feDisplacementMap.setAttribute('in', 'SourceGraphic');
    feDisplacementMap.setAttribute('scale', resolved.displacementScale.toString());

    filter.appendChild(feTurbulence);
    filter.appendChild(feDisplacementMap);
    svg.appendChild(filter);

    document.body.appendChild(svg);

    return { svg, filter, feTurbulence, feDisplacementMap };
}

/** 卸载挂载到 `<body>` 的 SVG 滤镜节点 */
export function unmountSvgFilter(svg: SVGElement | null): void {
    if (svg?.parentNode) {
        svg.parentNode.removeChild(svg);
    }
}
