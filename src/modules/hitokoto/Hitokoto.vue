<!--
  Hitokoto.vue — 一言组件
  替换原 src/hitokoto.ts
  原模块行为：
    - fetch('https://v1.hitokoto.cn/?{hit_a..hit_l}') 获取一言
    - 按 hitokoto_format_test 选择模板（1 = "——作者《出处》" / 2 = 仅内容）
    - 每 hitokoto_update 分钟更新（默认 6 分钟）
    - 默认值 "未获取"
-->
<template>
    <div id="hitokoto">
        <div class="text" v-html="rendered" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useUpdateInterval } from '@/modules/core/useUpdateInterval';
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { escapeHtml } from '@/utils/string';

const config = useConfigStore();
const runtime = useRuntimeStore();

interface HitokotoResponse {
    hitokoto: string;
    from: string;
    from_who: string | null;
}

const TEMPLATES: Record<number, string> = {
    1: "<div class='text1'>{一言}</div><div class='text2'>——{作者}{出处}</div>",
    2: '{一言}',
};

const UNKNOWN_AUTHORS = ['未知', '佚名'];

async function fetchHitokoto(): Promise<void> {
    const params = (
        ['hit_a', 'hit_b', 'hit_c', 'hit_d', 'hit_e', 'hit_f', 'hit_g', 'hit_h', 'hit_i', 'hit_j', 'hit_k', 'hit_l'] as const
    )
        .map(k => config[k])
        .filter(Boolean)
        .join('');
    try {
        const res = await fetch(`https://v1.hitokoto.cn/?${params}`);
        if (!res.ok) {
            throw new Error(`hitokoto HTTP ${res.status}`);
        }
        const data = (await res.json()) as HitokotoResponse;
        runtime.setHitokoto(data.hitokoto, data.from, data.from_who ?? '');
    } catch (err) {
        console.error('Failed to fetch hitokoto:', err);
    }
}

const rendered = computed(() => {
    const { hitokoto_text, from_who_text, from_text } = runtime.hitokoto;
    const author = UNKNOWN_AUTHORS.includes(from_who_text) ? '' : from_who_text;
    const source = from_text === from_who_text ? '' : `《${from_text}》`;
    const template = TEMPLATES[config.hitokoto_format_test];
    if (!template) {
        return '';
    }
    return template
        .replace('{一言}', escapeHtml(hitokoto_text))
        .replace('{作者}', escapeHtml(author))
        .replace('{出处}', escapeHtml(source));
});

// hitokoto_update 单位为分钟（默认 6），由 WE 属性 hitokoto_updata 更新。
// 原模块使用 setInterval(updateTime, hitokoto_update * 60 * 1000)。
const intervalMs = computed(() => Math.max(1, config.hitokoto_update || 6) * 60 * 1000);

const { stop, restart } = useUpdateInterval(intervalMs, fetchHitokoto, {
    immediate: false,
});

watch(
    () => config.hitokoto_show,
    (show) => {
        if (show) {
            void fetchHitokoto();
            restart();
        } else {
            stop();
        }
    },
    { immediate: true }
);

// 刷新间隔变化时重启定时器（restart 读取最新 intervalMs）
watch(
    () => config.hitokoto_update,
    () => {
        if (config.hitokoto_show) {
            restart();
        }
    }
);
</script>
