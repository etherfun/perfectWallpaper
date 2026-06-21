<!--
  App.vue — 根组件
  Phase 1：仅挂载 4 个叶子组件（Clock/Date/Countdown/Hitokoto）。
  其他组件（背景 / 樱花 / 天气 / 系统监控 / 播放器 / Dock栏 / 弹窗 / 全屏歌词）
  将在 Phase 2-5 陆续挂载。
-->
<template>
    <div id="app-root">
        <!-- 保持 index.html 原生结构：4 个容器节点由原生模板提供，组件渲染覆盖其内容 -->
        <Clock />
        <Date />
        <Countdown />
        <Hitokoto />
    </div>
</template>

<script setup lang="ts">
import Clock from './Clock.vue';
import Date from './Date.vue';
import Countdown from './Countdown.vue';
import Hitokoto from './Hitokoto.vue';
</script>
