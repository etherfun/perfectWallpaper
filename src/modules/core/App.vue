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
<!--
  App.vue — 根组件

  template is a Vue 3 multi-root fragment (no wrapper <div>) because
  src/main.ts calls `app.mount('#app-root')` — Vue replaces the inner
  content of the existing #app-root element. If we wrapped the template
  in another <div id="app-root">, Vue would create a NESTED second
  #app-root inside the original one, producing a doubled mount point.

  The SFC components below each render directly into the existing
  #app-root element as flat children.
-->
<template>
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
</template>

<script setup lang="ts">
import Background from '../slide/Background.vue';
import Clock from '../clock/Clock.vue';
import Countdown from '../countdown/Countdown.vue';
import Date from '../date/Date.vue';
import DebugModal from '../debug/DebugModal.vue';
import DockBar from '../dockbar/DockBar.vue';
import FluidEffect from '../fluid/FluidEffect.vue';
import FullscreenLyrics from '../fullscreenLyrics/FullscreenLyrics.vue';
import Hitokoto from '../hitokoto/Hitokoto.vue';
import PWCircle from '../audio-visualizer/PWCircle.vue';
import PWLine from '../audio-visualizer/PWLine.vue';
import PWParticles from '../audio-visualizer/PWParticles.vue';
import PictureInfo from '../slide/PictureInfo.vue';
import PlayerControl from '../player_control/PlayerControl.vue';
import RgbEffect from '../rgb-effect/RgbEffect.vue';
import Sakura from '../sakura/Sakura.vue';
import SystemMonitor from '../systemMonitor/SystemMonitor.vue';
import Version from '../version/Version.vue';
import Weather from '../weather/Weather.vue';
</script>
