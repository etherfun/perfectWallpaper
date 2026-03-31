// 视频和音频控制模块

import { elements } from '@/utils/elementManager';
import { config } from './utils/config';

const myvideo = elements.myvideo;
const myAudio = elements.myAudio;

/**
 * 切换视频模式
 */
export function ChangeVideoModel(): void {
    if (config.cusvideo_route != "") {
        myvideo.src = config.cusvideo_route;
        myvideo.play();
    } else {
        myvideo.src = "";
    }
}

/**
 * 切换音频模式
 */
export function ChangeAudioModel(): void {
    if (config.cusaudio_route != "") {
        myAudio.src = config.cusaudio_route;
        myAudio.play();
    } else {
        myAudio.src = "";
    }
}
