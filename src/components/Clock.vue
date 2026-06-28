<!--
  Clock.vue — 时钟显示组件
  替换原 src/time.ts
  原模块行为：
    - 每秒读取 new Date() 更新 .min / .sec / .st 三个 DOM 节点
    - tStyle 为 true 时显示 12 小时制（带 AM/PM）；否则 24 小时制
    - time_color_rhythm 为 true 时按 RAF 循环调整容器 hsl 颜色
    - 午夜 0:0:0 时调用 getdate() 刷新日期（依赖 date.ts 模块）
-->
<template>
    <div ref="container" id="clock" :style="{ color: containerColor }">
        <div class="clock-block">
            <div class="min">{{ timeLabel }}</div>
            <div class="time-indicators" :style="indicatorsStyle">
                <div class="st" :style="{ display: showMeridiem ? 'flex' : 'none' }">
                    {{ meridiem }}
                </div>
                <div class="sec">{{ formattedSec }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { useColorRhythm } from '@/composables/useColorRhythm';
import { useUpdateInterval } from '@/composables/useUpdateInterval';
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();

const container = ref<HTMLElement | null>(null);
const containerColor = ref('');

/**
 * useColorRhythm 自动 watch config.time_color_rhythm，
 * enabled 时启动 RAF 循环应用 hsl 颜色，disabled 时清空。
 */
useColorRhythm(
    () => config.time_color_rhythm,
    color => {
        containerColor.value = color;
    }
);

const now = ref(new Date());
const use24h = computed(() => Boolean(config.time_style ?? true));

const formattedSec = computed(() => String(now.value.getSeconds()).padStart(2, '0'));

const timeLabel = computed(() => {
    const h = now.value.getHours();
    const m = now.value.getMinutes();
    const displayH = use24h.value ? h : h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(displayH).padStart(2, '0')} : ${String(m).padStart(2, '0')}`;
});

const showMeridiem = computed(() => !use24h.value);
const meridiem = computed(() => (now.value.getHours() < 12 ? 'AM' : 'PM'));

/**
 * 24h 模式下 AM/PM 标签隐藏，秒数容器应下沉到底部与 .min 的底部对齐。
 * 12h 模式下保持基线对齐（AM/PM + 秒数并列在 .min 文本基线）。
 */
const indicatorsStyle = computed(() => {
    if (use24h.value) {
        return { 'align-self': 'end' as const };
    }
    return {};
});

useUpdateInterval(1000, () => {
    now.value = new Date();
});
</script>
