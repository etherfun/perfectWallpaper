<!--
  Countdown.vue — 倒计时组件
  替换原 src/countdown.ts
  原模块行为：
    - 根据 countdown_year/month/day 构造目标 Date
    - 每秒更新 text 显示 "D:H:M:S" 格式（D 是天数，H/M 是 (剩余小时/分钟) - 1）
    - 首尾各加 countdown_txt / countdown_txt1
-->
<template>
    <div id="countdown">
        <div class="text">{{ countdownText }}</div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { useUpdateInterval } from '@/modules/core/useUpdateInterval';
import { useConfigStore } from '@/stores/config';
import { add0 } from '@/utils/tool';

const config = useConfigStore();
const now = ref(new Date());

const countdownText = computed(() => {
    const examDate = new Date(config.countdown_year, config.countdown_month - 1, config.countdown_day);
    const distance = examDate.getTime() - now.value.getTime();
    const days = Math.ceil(distance / (1000 * 60 * 60 * 24));
    const hours = Math.ceil((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.ceil((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.ceil((distance % (1000 * 60)) / 1000);
    return (
        config.countdown_txt +
        String(days - 1) +
        ':' +
        add0(hours - 1) +
        ':' +
        add0(minutes - 1) +
        ':' +
        add0(seconds) +
        config.countdown_txt1
    );
});

useUpdateInterval(1000, () => {
    now.value = new Date();
});
</script>
