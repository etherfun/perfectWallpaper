<!--
  Background.vue — 背景切换组件 (Phase 5)
  替换原 src/slide/* (5 文件) + src/video.ts。

  原模块：
    - slide.changeBackground() 按 wallpapermode 切换
    - 9 种 wallpapermode 各自数据源 (Bing/NASA/Picsum/次元/Windows 聚焦...)
    - video.ts 控制 <video> / <audio> 元素

  Phase 5 薄壳：保留全部原模块，由 propertyHandler (backgroundPropertyHandler)
  在 wallpapermode 变化时调用 changeBackground()。
-->
<template>
    <!-- 背景容器 — #myAudio / #myvideo 保留在 index.html（JS 基础设施） -->
    <div id="background-container">
        <div id="background-blur-layer1" class="background-blur-layer"></div>
        <div id="background-blur-layer2" class="background-blur-layer"></div>
        <div
            id="background-layer1"
            class="background-layer"
            style="background-image: url('./src/source/imgs/1.jpg');"
        ></div>
        <div id="background-layer2" class="background-layer"></div>
    </div>
</template>

<script setup lang="ts">
</script>
