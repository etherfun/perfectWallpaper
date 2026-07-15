/**
 * DOM construction for the fullscreen lyrics overlay
 */

import { SCROLL_CONTAINER_HEIGHT } from '../constants';

/** All DOM handles the lyrics overlay owns */
export interface FullscreenLyricsDom {
    container: HTMLElement;
    scrollContainer: HTMLElement;
    lyricsContainer: HTMLElement;
    closeButton: HTMLElement;
    clockElement: HTMLElement;
}

/** Static CSS injected into the overlay container */
const LYRICS_CSS = `
            #fullscreen-lyrics .lyric-line {
                text-align: center;
                padding: 8px 0;
                transition: all 0.3s ease;
                cursor: default;
            }
            #fullscreen-lyrics .lyric-line.active {
                transform: scale(1.1);
            }
            #fullscreen-lyrics .lyric-line .original {
                font-size: 28px;
                font-weight: bold;
                color: white;
                text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
                margin-bottom: 4px;
            }
            #fullscreen-lyrics .lyric-line .translation {
                font-size: 16px;
                color: rgba(255,255,255,0.8);
                text-shadow: 1px 1px 4px rgba(0,0,0,0.6);
            }
            #fullscreen-lyrics .lyric-line .roman {
                font-size: 14px;
                color: rgba(255,255,255,0.6);
                text-shadow: 1px 1px 4px rgba(0,0,0,0.4);
            }
            #fullscreen-lyrics .word {
                display: inline-block;
                transition: all 0.15s ease;
            }
            #fullscreen-lyrics .word.active {
                color: #4ecdc4;
                transform: scale(1.2);
            }
        `;

/**
 * Build the fullscreen lyrics overlay DOM tree and attach it to <body>.
 * The overlay is hidden by default (`display: none`).
 */
export function createFullscreenLyricsDom(onClose: () => void): FullscreenLyricsDom {
    const container = document.createElement('div');
    container.id = 'fullscreen-lyrics';
    container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            display: none;
            background: transparent;
            pointer-events: none;
        `;

    const scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = `
            position: absolute;
            bottom: 60px;
            left: 0;
            right: 0;
            height: ${SCROLL_CONTAINER_HEIGHT}px;
            overflow: hidden;
        `;
    container.appendChild(scrollContainer);

    const lyricsContainer = document.createElement('div');
    lyricsContainer.id = 'lyrics-container';
    lyricsContainer.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 0.5s ease-out;
        `;
    scrollContainer.appendChild(lyricsContainer);

    const closeButton = document.createElement('button');
    closeButton.id = 'lyrics-close';
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            font-size: 20px;
            cursor: pointer;
            display: none;
            z-index: 10000;
            pointer-events: auto;
        `;
    closeButton.onclick = onClose;
    container.appendChild(closeButton);

    const clockElement = document.createElement('div');
    clockElement.id = 'lyrics-clock';
    clockElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            font-size: 24px;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            display: none;
            z-index: 10000;
        `;
    container.appendChild(clockElement);

    const style = document.createElement('style');
    style.textContent = LYRICS_CSS;
    container.appendChild(style);

    document.body.appendChild(container);

    return { container, scrollContainer, lyricsContainer, closeButton, clockElement };
}

/**
 * Remove the overlay DOM and detach the parent from <body>.
 * Safe to call even if the container is already gone.
 */
export function destroyFullscreenLyricsDom(dom: FullscreenLyricsDom): void {
    dom.container.remove();
}
