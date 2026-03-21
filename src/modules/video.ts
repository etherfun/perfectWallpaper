// 视频和音频控制模块

import { appConfig } from '../utils/config';

// 获取DOM元素
const myvideo = document.getElementById("myvideo") as HTMLVideoElement;
const myAudio = document.getElementById("myAudio") as HTMLAudioElement;

/**
 * 切换视频模式
 */
export function ChangeVideoModel(): void {
    if (appConfig.getCusvideoRoute() != "") {
        myvideo.src = appConfig.getCusvideoRoute();
        myvideo.play();
    } else {
        myvideo.src = appConfig.getVideoRoute();
        myvideo.play();
    }
}

/**
 * 切换音频模式
 */
export function ChangeAudioModel(): void {
    if (appConfig.getCusaudioRoute() != "") {
        myAudio.src = appConfig.getCusaudioRoute();
        myAudio.play();
    } else {
        myAudio.src = "";
        myAudio.play();
    }
}

/**
 * 暂停视频
 */
export function pauseVideo(): void {
    if (myvideo) {
        myvideo.pause();
        appConfig.setPaused(true);
    }
}

/**
 * 播放视频
 */
export function playVideo(): void {
    if (myvideo) {
        myvideo.play();
        appConfig.setPaused(false);
    }
}

/**
 * 切换视频播放状态
 */
export function toggleVideoPlayback(): void {
    if (myvideo) {
        if (myvideo.paused) {
            playVideo();
        } else {
            pauseVideo();
        }
    }
}

/**
 * 设置视频播放速度
 */
export function setVideoPlaybackRate(rate: number): void {
    if (myvideo) {
        myvideo.playbackRate = Math.max(0.1, Math.min(16, rate));
    }
}

/**
 * 跳转到指定时间
 */
export function seekVideo(time: number): void {
    if (myvideo) {
        myvideo.currentTime = Math.max(0, Math.min(myvideo.duration, time));
    }
}

/**
 * 获取当前视频时间
 */
export function getCurrentVideoTime(): number {
    return myvideo ? myvideo.currentTime : 0;
}

/**
 * 获取视频总时长
 */
export function getVideoDuration(): number {
    return myvideo ? myvideo.duration : 0;
}

/**
 * 检查视频是否正在播放
 */
export function isVideoPlaying(): boolean {
    return myvideo ? !myvideo.paused && !myvideo.ended : false;
}

/**
 * 重新加载视频
 */
export function reloadVideo(): void {
    if (myvideo) {
        myvideo.load();
    }
}

/**
 * 切换视频静音
 */
export function toggleVideoMute(): void {
    if (myvideo) {
        myvideo.muted = !myvideo.muted;
    }
}

/**
 * 设置视频循环
 */
export function setVideoLoop(loop: boolean): void {
    if (myvideo) {
        myvideo.loop = loop;
    }
}