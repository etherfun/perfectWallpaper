/**
 * Pinia store: runtime
 *
 * 暴露原 `config.runtime.*` 字段。
 * Phase 1 仅声明 hitokoto 相关字段；后续 Phase 按需扩展。
 */

import { defineStore } from 'pinia';

import { type RuntimeStoreState } from './types';

export const useRuntimeStore = defineStore('runtime', {
    state: (): RuntimeStoreState => ({
        hitokoto: {
            hitokoto_text: '未获取',
            from_text: '未获取',
            from_who_text: '未获取',
        },
    }),
    actions: {
        setHitokoto(text: string, from: string, fromWho: string): void {
            this.hitokoto.hitokoto_text = text;
            this.hitokoto.from_text = from;
            this.hitokoto.from_who_text = fromWho;
        },
    },
});
