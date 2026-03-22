// 视频和音频控制模块

import { elements } from '@/utils/elementManager';
import { config } from '../utils/config';

// 获取DOM元素
const myvideo = elements.myvideo;
const myAudio = elements.myAudio;

/**
 * 切换视频模式
 */
export function ChangeVideoModel(): void {
    if (config.cusvideoRoute != "") {
        myvideo.src = config.cusvideoRoute;
        myvideo.play();
    } else {
        myvideo.src = config.videoRoute;
        myvideo.play();
    }
}

/**
 * 切换音频模式
 */
export function ChangeAudioModel(): void {
    if (config.cusaudioRoute != "") {
        myAudio.src = config.cusaudioRoute;
        myAudio.play();
    } else {
        myAudio.src = "";
        myAudio.play();
    }
}
