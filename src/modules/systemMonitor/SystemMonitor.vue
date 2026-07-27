<!--
  SystemMonitor.vue — 系统监控组件 (Phase 2)
  替换原 src/systemMonitor/* 模块。

  与原 src/systemMonitor/*（命令式模块）的契约：
    - 必须存在 <div id="system-monitor"> 容器以及
      .sysmon-row[data-metric=cpu/gpu/memory/network] 子结构，
      否则 SystemMonitor.queryDomElements() 返回 null，
      SystemMonitor 无法初始化。
    - 本组件渲染容器结构，命令式模块更新其中的文本/可视化内容。
-->
<template>
    <div id="system-monitor">
        <div class="background">
            <div class="sysmon-row sysmon-cpu" data-metric="cpu">
                <div class="sysmon-text">
                    <span class="sysmon-label">CPU</span>
                    <span class="sysmon-value">0%</span>
                    <span class="sysmon-extra"></span>
                </div>
                <div class="sysmon-viz"></div>
            </div>
            <div class="sysmon-row sysmon-gpu" data-metric="gpu">
                <div class="sysmon-text">
                    <span class="sysmon-label">GPU</span>
                    <span class="sysmon-value">0%</span>
                    <span class="sysmon-extra"></span>
                </div>
                <div class="sysmon-viz"></div>
            </div>
            <div class="sysmon-row sysmon-memory" data-metric="memory">
                <div class="sysmon-text">
                    <span class="sysmon-label" data-i18n="sysmon_label_memory"></span>
                    <span class="sysmon-value">0%</span>
                    <span class="sysmon-extra"></span>
                </div>
                <div class="sysmon-viz"></div>
            </div>
            <div class="sysmon-row sysmon-network" data-metric="network">
                <div class="sysmon-text">
                    <span class="sysmon-label" data-i18n="sysmon_label_network"></span>
                    <span class="sysmon-net sysmon-net-down">↓ 0 B/s</span>
                    <span class="sysmon-net sysmon-net-up">↑ 0 B/s</span>
                </div>
                <div class="sysmon-viz"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useConfigStore } from '@/stores/config';
import { getSystemMonitor, initSystemMonitor } from '@/modules/systemMonitor';

const config = useConfigStore();

onMounted(() => {
    const monitor = initSystemMonitor();
    monitor.ensureInitialized();

    // 同步 Pinia store 当前配置到 SystemMonitor
    if (config.sysmon_enabled !== undefined && config.server_mode === true) {
        monitor.setEnabled(config.sysmon_enabled);
    }
});
</script>
