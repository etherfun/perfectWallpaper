<!--
  App.vue — 根组件
  Phase 1：4 个叶子组件（Clock/Date/Countdown/Hitokoto）
  Phase 2：+ Weather/SystemMonitor/DockBar/PlayerControl/PictureInfo（薄壳）
  Phase 3-5：背景 / 樱花 / Canvas / WebGL
  Phase 4：弹窗与全屏

  Vue 设计原则（plan.md 用户决策）：
    - Vue 包装薄壳，原生命令式代码维持（Phase 1-2）
    - Phase 3+ 深挖后逐步替换旧 .ts
-->
<template>
    <div id="app-root">
        <Clock />
        <Date />
        <Countdown />
        <Hitokoto />
        <Weather />
        <SystemMonitor />
        <DockBar />
        <PlayerControl />
        <PictureInfo />
    </div>
</template>

<script setup lang="ts">
import Clock from './Clock.vue';
import Date from './Date.vue';
import Countdown from './Countdown.vue';
import Hitokoto from './Hitokoto.vue';
import Weather from './Weather.vue';
import SystemMonitor from './SystemMonitor.vue';
import DockBar from './DockBar.vue';
import PlayerControl from './PlayerControl.vue';
import PictureInfo from './PictureInfo.vue';
</script>
