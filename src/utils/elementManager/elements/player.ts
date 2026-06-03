/**
 * 音乐播放器相关 DOM 元素
 */
export const playerElements = {
    player: {
        control: document.getElementById('player_control'),
        title: document.getElementById('player_title'),
        artist: document.getElementById('player_artist'),
        album: document.getElementById('player_album'),
        progress: document.getElementById('player_progress'),
        progressBar: document.getElementById('player_progress_bar'),
        currentTime: document.getElementById('player_current_time'),
        totalTime: document.getElementById('player_total_time'),
        playButton: document.getElementById('player_play_button'),
        pauseButton: document.getElementById('player_pause_button'),
        nextButton: document.getElementById('player_next_button'),
        prevButton: document.getElementById('player_prev_button'),
        thumbnail: document.getElementById('player_thumbnail'),
    },
    playerControl: {
        container: document.querySelector('#player_control') as HTMLElement,
        background: document.querySelector('#player_control .background') as HTMLElement,
        thumbnail: document.querySelector('#player_control .thumbnail') as HTMLImageElement,
        thumbnailWrap: document.querySelector('#player_control .thumbnail-wrap') as HTMLElement,
        info: document.querySelector('#player_control .info') as HTMLElement,
        title: document.querySelector('#player_control .title') as HTMLElement,
        artist: document.querySelector('#player_control .artist') as HTMLElement,
        albumTitle: document.querySelector('#player_control .albumTitle') as HTMLElement,
        timeline: document.querySelector('#player_control .progress-bar') as HTMLElement,
        aubar: document.querySelector('#player_control .aubar') as HTMLCanvasElement,
    },
} as const;
