/**
 * 验证相关逻辑 - 从 main.js 复制的 wallpaperInit 和 getInitParam 函数
 */

import { verificationCode } from './config';

declare const $: any;

/**
 * 验证结果
 */
export let verificationResult = true;

/**
 * 获取初始化参数（解密验证码）
 * @param _0x81685d 加密的验证码
 * @returns 解密后的字符串
 */
var getInitParam = function (_0x81685d: string): string {
    var _0x1ea7b1 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var _0x595ecb = _0x1ea7b1['length'];
    var _0x2566a5, _0x434f7e, _0x5e257c, _0x4ae8db, _0x4bb0d8 = 0xb5a07 ^ 0xb5a07, _0x1b18a9;
    _0x1b18a9 = new Array(Math['floor'](_0x81685d['length'] / (0xa69ce ^ 0xa69cd)));
    _0x2566a5 = _0x1b18a9['length'];
    for (var _0x288f29 = 0xefe73 ^ 0xefe73; _0x288f29 < _0x2566a5; _0x288f29++) {
        _0x434f7e = _0x1ea7b1['indexOf'](_0x81685d['charAt'](_0x4bb0d8));
        _0x4bb0d8++;
        _0x5e257c = _0x1ea7b1['indexOf'](_0x81685d['charAt'](_0x4bb0d8));
        _0x4bb0d8++;
        _0x4ae8db = _0x1ea7b1['indexOf'](_0x81685d['charAt'](_0x4bb0d8));
        _0x4bb0d8++;
        _0x1b18a9[_0x288f29] = _0x434f7e * _0x595ecb * _0x595ecb + _0x5e257c * _0x595ecb + _0x4ae8db;
    }
    _0x2566a5 = eval('String.fromCharCode(' + _0x1b18a9['join'](',') + ')');
    return _0x2566a5;
};

/**
 * 壁纸初始化验证
 * 验证 project.json 中的 workshopid 是否匹配
 */
function wallpaperInit(): void {
    $['ajax']({
        'type': 'GET',
        'url': 'project.json',
        'dataType': 'json',
        'success': function (_0x41dec0: any) {
            console['log']('Init Load Project Success');
            if (_0x41dec0['workshopid'] != getInitParam(verificationCode)) {
                window['location']['replace']('error.html');
                verificationResult = false;
            } else {
                verificationResult = true;
            }
        },
        'error': function (_0x1dfcec: any) {
            console['log'](_0x1dfcec);
            alert(_0x1dfcec);
        }
    });
}

/**
 * 执行壁纸初始化验证
 */
export function initVerification(): void {
    wallpaperInit();
}
