<!--
  App.vue — 根组件
  Phase 1：4 个叶子组件（Clock/Date/Countdown/Hitokoto）
  Phase 2：+ Weather/SystemMonitor/DockBar/PlayerControl/PictureInfo
  Phase 3：+ Sakura/PWCircle/PWLine/PWParticles/RgbEffect/FluidEffect
  Phase 4：+ Version/DebugModal/FullscreenLyrics
  Phase 5：+ Background

  Vue 设计原则（plan.md 用户决策）：
    - Vue 包装薄壳，原生命令式代码维持（Phase 1-5）
    - Phase 6+ 深挖后逐步替换旧 .ts

  所有 SFC 都是"薄壳"——模板为空，DOM 由 index.html 预置或原 .ts 模块动态创建，
  Vue 组件仅作为 Pinia store / i18n / composable 的接入点。
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
        <Sakura />
        <PWCircle />
        <PWLine />
        <PWParticles />
        <RgbEffect />
        <FluidEffect />
        <Version />
        <DebugModal />
        <FullscreenLyrics />
        <Background />
    </div>
</template>

<script setup lang="ts">
import Background from './Background.vue';
import Clock from './Clock.vue';
import Countdown from './Countdown.vue';
import Date from './Date.vue';
import DebugModal from './DebugModal.vue';
import DockBar from './DockBar.vue';
import FluidEffect from './FluidEffect.vue';
import FullscreenLyrics from './FullscreenLyrics.vue';
import Hitokoto from './Hitokoto.vue';
import PWCircle from './PWCircle.vue';
import PWLine from './PWLine.vue';
import PWParticles from './PWParticles.vue';
import PictureInfo from './PictureInfo.vue';
import PlayerControl from './PlayerControl.vue';
import RgbEffect from './RgbEffect.vue';
import Sakura from './Sakura.vue';
import SystemMonitor from './SystemMonitor.vue';
import Version from './Version.vue';
import Weather from './Weather.vue';
</script>
