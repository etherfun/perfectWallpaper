<!--
  Date.vue — 日期显示组件
  替换原 src/date.ts
  原模块行为：
    - 根据 date_format.{year,month,day,week}_format 组合日期字符串
    - date_format.order 决定 年月日 / 月日年 / 日月年 顺序
    - date_format.separator 决定分隔符（无 / / - . 年月日 空格）
    - 每 10 分钟刷新一次（autodata）
    - date_color_rhythm 为 true 时按 RAF 循环调整容器 hsl 颜色
-->
<template>
    <div ref="container" id="oDate" :style="{ color: containerColor }">
        <div class="text">{{ dateText }}</div>
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
useColorRhythm(
    () => config.date_color_rhythm,
    color => {
        containerColor.value = color;
    }
);

const w_zh = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const w_en = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];
const m_zh = [
    '一月',
    '二月',
    '三月',
    '四月',
    '五月',
    '六月',
    '七月',
    '八月',
    '九月',
    '十月',
    '十一月',
    '十二月',
];
const m_en = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const now = ref(new Date());

function getYear(t: Date): string {
    switch (config.date_format.year_format) {
        case 1:
            return String(t.getFullYear());
        case 2:
            return t.getFullYear().toString().slice(-2);
        case 0:
        default:
            return '';
    }
}

function getMonth(t: Date): string {
    const month = t.getMonth();
    switch (config.date_format.month_format) {
        case 1:
            return String(month + 1);
        case 2:
            return m_en[month] ?? '';
        case 3:
            return m_zh[month] ?? '';
        case 0:
        default:
            return '';
    }
}

function getDay(t: Date): string {
    const day = t.getDate();
    switch (config.date_format.day_format) {
        case 1:
            return String(day);
        case 2:
            return day < 10 ? `0${day}` : String(day);
        case 0:
        default:
            return '';
    }
}

function getWeek(t: Date): string {
    switch (config.date_format.week_format) {
        case 1:
            return w_zh[t.getDay()] ?? '';
        case 2:
            return w_en[t.getDay()] ?? '';
        case 0:
        default:
            return '';
    }
}

function buildDateString(year: string, month: string, day: string, week: string): string {
    const parts: string[] = [];
    const types: string[] = [];
    const order = config.date_format.order;
    if (order === 1) {
        if (year) {
            parts.push(year);
            types.push('year');
        }
        if (month) {
            parts.push(month);
            types.push('month');
        }
        if (day) {
            parts.push(day);
            types.push('day');
        }
    } else if (order === 2) {
        if (month) {
            parts.push(month);
            types.push('month');
        }
        if (day) {
            parts.push(day);
            types.push('day');
        }
        if (year) {
            parts.push(year);
            types.push('year');
        }
    } else if (order === 3) {
        if (day) {
            parts.push(day);
            types.push('day');
        }
        if (month) {
            parts.push(month);
            types.push('month');
        }
        if (year) {
            parts.push(year);
            types.push('year');
        }
    }
    const sep = config.date_format.separator;
    let result = '';
    if (sep === 5) {
        // 中文分隔符（年月日）
        const map: Record<string, string> = { year: '年', month: '月', day: '日' };
        for (let i = 0; i < parts.length; i++) {
            result += parts[i];
            const t = types[i];
            if (t && map[t]) {
                result += map[t];
            }
        }
    } else {
        const simple: Record<number, string> = {
            1: '',
            2: '/',
            3: '-',
            4: '.',
            6: ' ',
        };
        const s = simple[sep] ?? '';
        for (let i = 0; i < parts.length; i++) {
            if (i > 0) {
                result += s;
            }
            result += parts[i];
        }
    }
    if (week) {
        if (result) {
            result += ' ';
        }
        result += week;
    }
    return result;
}

const dateText = computed(() => {
    const t = now.value;
    return buildDateString(getYear(t), getMonth(t), getDay(t), getWeek(t));
});

useUpdateInterval(600_000, () => {
    now.value = new Date();
});
</script>
