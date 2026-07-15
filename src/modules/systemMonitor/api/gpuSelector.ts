import type { GpuInfo } from '../types';

/**
 * Pick the GPU that the user actually cares about from
 * `data.gpu[]`.
 *
 * Why this is non-trivial: on laptops with both an
 * iGPU/APU and a discrete GPU, LibreHardwareMonitor
 * reports the iGPU first and its temperature sensor is
 * often missing (returns 0). Rendering `data.gpu[0]`
 * would then show "0°C" and `0%` utilization for the
 * wrong card, making it look like the dGPU is dead.
 *
 * Selection priority (highest first):
 *   1. Discrete GPU — vendor / model name matches a
 *      known dGPU pattern (NVIDIA, GeForce, Quadro,
 *      Tesla, Radeon RX / Pro / VII, Arc). Must be a
 *      POSITIVE match on the discrete side, not a
 *      negative match on the iGPU side — otherwise
 *      unknown / WDDM-fallback adapters would falsely
 *      qualify as "discrete".
 *   2. Any GPU whose `temperature` reads > 0 — sensor
 *      actually works.
 *   3. Any GPU whose `utilization` reads > 0 — actively
 *      used right now.
 *   4. Whatever is at `gpu[0]` — current behavior, so
 *      a host with exactly one GPU keeps working.
 *
 * Returns `undefined` only when `gpus` is empty.
 */
export function pickPrimaryGpu(gpus: readonly GpuInfo[]): GpuInfo | undefined {
    if (gpus.length === 0) return undefined;
    if (gpus.length === 1) return gpus[0];

    // Pass 1: real discrete card.
    for (const gpu of gpus) {
        if (isDiscreteGpu(gpu)) return gpu;
    }

    // Pass 2: any GPU with a live temperature sensor.
    for (const gpu of gpus) {
        if (gpu.temperature > 0) return gpu;
    }

    // Pass 3: any GPU with non-zero utilization.
    for (const gpu of gpus) {
        if (gpu.utilization > 0) return gpu;
    }

    // Pass 4: keep legacy behavior.
    return gpus[0];
}

/**
 * Heuristic: does this `GpuInfo` look like an iGPU /
 * APU integrated graphics adapter?
 *
 * Vendor-independent — the goal is to spot the LHM
 * "first entry on a hybrid system" pattern, which is
 * almost always the iGPU. We match on `model` strings
 * that vendors actually use:
 *
 *   - AMD APU:      "Radeon(TM) Graphics", "Radeon Graphics",
 *                   "Vega ...", "Radeon ...M" (mobile suffix)
 *   - Intel:        "Iris", "Iris Xe", "Iris Plus",
 *                   "UHD Graphics", "HD Graphics",
 *                   "Intel Graphics"
 *   - Qualcomm:     "Adreno" (rare on desktop)
 *   - Apple:        "Apple GPU" (irrelevant on Win32NT
 *                   but matched for safety)
 *
 * The string match is case-insensitive. We deliberately
 * do NOT match "Radeon" alone because dGPUs also use
 * that brand ("Radeon RX 7900 XTX"). The "(TM) Graphics"
 * and "M" mobile suffixes are the iGPU giveaways.
 */
export function isIntegratedGpu(gpu: Pick<GpuInfo, 'model' | 'vendor'>): boolean {
    const m = gpu.model.toLowerCase();

    // Strongest signals first.
    if (m.includes('radeon(tm) graphics')) return true;
    if (m.includes('radeon graphics')) return true;
    if (m.includes('iris')) return true;
    if (m.includes('uhd graphics')) return true;
    if (m.includes('hd graphics')) return true;
    if (m.includes('intel graphics')) return true;
    if (m.includes('adreno')) return true;
    if (m.includes('apple gpu')) return true;

    // AMD mobile APU pattern. Matches strings that end
    // in `<digits>M` (e.g. "Radeon 780M", "Radeon 890M")
    // or contain `<digits> M` (e.g. "Radeon RX Vega 10 M").
    // The leading "Radeon" alone isn't enough because
    // dGPUs also use that brand, so we anchor on the
    // mobile-suffix pattern instead.
    if (/\bradeon\b.*\b\d{2,4}\s*m\b/i.test(m)) return true;

    // Microsoft Basic Render Driver — the WDDM
    // fallback that has no sensors at all. Treat as
    // iGPU so the real card gets picked.
    if (m.includes('microsoft basic render')) return true;

    return false;
}

/**
 * Heuristic: does this `GpuInfo` look like a real
 * discrete GPU?
 *
 * Required for Pass 1 of `pickPrimaryGpu`: we only
 * trust a "discrete" label when we have a POSITIVE
 * brand signal. Unknown vendors / WDDM fallbacks
 * are not "discrete" until proven otherwise.
 *
 * Patterns:
 *   - NVIDIA:        "NVIDIA", "GeForce", "Quadro", "Tesla",
 *                    "TITAN" (any case)
 *   - AMD dGPU:      "Radeon RX" or "Radeon Pro" or
 *                    "Radeon VII" (the desktop variant).
 *                    NOT the bare "Radeon ...M" iGPU
 *                    series — those are caught by
 *                    `isIntegratedGpu` first.
 *   - Intel Arc:     bare "Arc" (dGPU line). Does not
 *                    match "Arc" inside an iGPU model
 *                    because Intel's iGPU naming is
 *                    "Iris Xe" / "UHD" / "HD" / etc.
 */
export function isDiscreteGpu(gpu: Pick<GpuInfo, 'model' | 'vendor'>): boolean {
    const v = gpu.vendor.toLowerCase();
    const m = gpu.model.toLowerCase();

    // Vendor-name first (handles rebranded cards like
    // "Dell NVIDIA GeForce RTX ...").
    if (v.includes('nvidia')) return true;

    // Model patterns. Order matters: AMD dGPU names
    // that include the word "Radeon" need to be checked
    // before the iGPU pattern (Radeon ...M) can fire.
    if (m.includes('geforce')) return true;
    if (m.includes('quadro')) return true;
    if (m.includes('tesla')) return true;
    if (/\btitan\b/.test(m)) return true;
    if (m.includes('radeon rx')) return true;
    if (m.includes('radeon pro')) return true;
    if (m.includes('radeon vii')) return true;
    if (m.includes('arc')) return true;

    return false;
}
