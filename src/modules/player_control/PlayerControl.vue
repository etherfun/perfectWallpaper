<!--
  PlayerControl.vue — 媒体播放控制组件

  Phase 2 占位：等 Phase 6 重写为完整 Vue 组件。
  Phase 8+：Vue 完全接管，dist/index.html 不再含 legacy <div id="player_control"> 块。
            但 src/player_control/*（命令式模块）仍依赖 querySelector('#player_control')
            来获取 DOM 引用，因此本组件渲染完整容器结构。

  与 src/player_control/* 的契约：
    - 必须存在 <div id="player_control">，否则 elementManager.playerControl.* 全部为 null
    - 必须存在 .background / .thumbnail-wrap / .thumbnail / .info-container / .info
      / .title / .artist / .albumTitle / .timeline / .progress-bar / .aubar-wrapper
      / .aubar(canvas) / .aubar-controls / .prev / .play-pause / .next
      否则命令式渲染模块拿不到引用，媒体集成（wallpaperMediaPropertiesListener /
      wallpaperMediaPlaybackListener）无效
-->
<template>
    <div id="player_control">
        <div class="background">
            <div class="thumbnail-wrap">
                <img class="thumbnail" />
                <div class="pause-overlay">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                    </svg>
                </div>
            </div>
            <div class="info-container">
                <div class="info">
                    <div class="title">
                        <span class="right"></span>
                        <img
                            class="titleicon"
                            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB0PSIxNzIxNTQwMzA2MzU0IiBjbGFzcz0iaWNvbiIgdmVyc2lvbj0iMS4xIiBwLWlkPSIxNDA1Ij4KIDxnPgogIDx0aXRsZT5MYXllciAxPC90aXRsZT4KICA8cGF0aCBzdHJva2U9Im51bGwiIGQ9Im00OTkuMDk0MDIsNTkuMjUxODVsMC40OTk3Nyw0Ljg1NTRsMC4xODE3Myw0LjkwMTQzbDAsMjkyLjEwNjYzYTkwLjg2Njg4LDkyLjA0NTU3IDAgMSAxIC00NS40MTA3MiwtNzkuNzExNDdsLTAuMDIyNzIsLTEyMy44NzAzM2wtMjcyLjYwMDY0LDM5LjQ0MTUzbDAsMjEwLjE2MzA1YTkwLjg2Njg4LDkyLjA0NTU3IDAgMCAxIC04Ni4zMjM1NCw5MS45MzA1MmwtNC41NDMzNCwwLjExNTA2YTkwLjg2Njg4LDkyLjA0NTU3IDAgMSAxIDQ1LjQ1NjE2LC0xNzEuNzU3MDRsLTAuMDIyNzIsLTIyNS41MzQ2N2E2OC4xNTAxNiw2OS4wMzQxOCAwIDAgMSA1NC41MjAxMywtNjcuNjUzNWwzLjk5ODE0LC0wLjY5MDM0bDIyNy4xNjcyLC0zMi44ODMyOGE2OC4xNTAxNiw2OS4wMzQxOCAwIDAgMSA3Ny4xMDA1NSw1OC41ODcwMXptLTQwOC4yMTk0NiwzMDEuODYzNDZhNDUuNDMzNDQsNDYuMDIyNzkgMCAxIDAgMCw5Mi4wNDU1N2E0NS40MzM0NCw0Ni4wMjI3OSAwIDAgMCAwLC05Mi4wNDU1N3ptMzE4LjAzNDA4LC00Ni4wMjI3OWE0NS40MzM0NCw0Ni4wMjI3OSAwIDEgMCAwLDkyLjA0NTU3YTQ1LjQzMzQ0LDQ2LjAyMjc5IDAgMCAwIDAsLTkyLjA0NTU3em0yMi4xNDg4LC0yNjkuMDk1MjNsLTIuNjM1MTQsMC4yMzAxMWwtMjI3LjE2NzIsMzIuODgzMjhhMjIuNzE2NzIsMjMuMDExMzkgMCAwIDAgLTE5LjM3NzM2LDIwLjE1Nzk4bC0wLjEzNjMsMi42MjMzbDAsNDguNjAwMDZsMjcyLjYwMDY0LC0zOS40NDE1M2wwLC00Mi4wNDE4MmEyMi43MTY3MiwyMy4wMTEzOSAwIDAgMCAtMjMuMjg0NjQsLTIzLjAxMTM5eiIgZmlsbD0iIzAwMDAwMCIgcC1pZD0iMTQwNiIgaWQ9InN2Z18xIi8+CiAgPGxpbmUgZmlsbD0ibm9uZSIgeDE9IjM3IiB5MT0iODciIHgyPSI3NSIgeTI9IjE2MiIgaWQ9InN2Z18yIi8+CiA8L2c+Cgo8L3N2Zz4="
                        />
                        <span class="left">loading...</span>
                    </div>
                    <div class="artist">
                        <span class="right"></span>
                        <img
                            class="artisticon"
                            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NDAgNTEyJz48IS0tIEZvbnQgQXdlc29tZSBQcm8gNi4wLjAtYWxwaGEyIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIC0tPjxwYXRoIGQ9J00zODkuNDE4IDM0Ny42NjRDMzU4LjgzNCAzMjAuNTc4IDMxOC43MzIgMzA0IDI3NC42NjQgMzA0SDE3My4zMzZDNzcuNjA5IDMwNCAwIDM4MS42MDIgMCA0NzcuMzMyQzAgNDk2LjQ3NyAxNS41MjMgNTEyIDM0LjY2NCA1MTJIMzU1LjE5M0MzMzMuNCA0OTMuNDMyIDMyMCA0NjguMjcgMzIwIDQ0MEMzMjAgMzk5LjA0NSAzNDguMDQxIDM2NC43MDkgMzg5LjQxOCAzNDcuNjY0Wk0yMjQgMjU2QzI5NC42OTUgMjU2IDM1MiAxOTguNjkxIDM1MiAxMjhTMjk0LjY5NSAwIDIyNCAwQzE1My4zMTIgMCA5NiA1Ny4zMDkgOTYgMTI4UzE1My4zMTIgMjU2IDIyNCAyNTZaTTYwMS43MjUgMTYwLjYzMUw1MDUuNzI1IDE3OS44MzJDNDkwLjc2OCAxODIuODI0IDQ4MCAxOTUuOTU3IDQ4MCAyMTEuMjExVjM3Mi40MDhDNDY5Ljk0NSAzNjkuNzI3IDQ1OS4yODEgMzY4IDQ0OCAzNjhDMzk0Ljk4IDM2OCAzNTIgNDAwLjIzNCAzNTIgNDQwQzM1MiA0NzkuNzY0IDM5NC45OCA1MTIgNDQ4IDUxMlM1NDQgNDc5Ljc2NCA1NDQgNDQwVjMwMC4xNzZMNjE0LjI3NSAyODYuMTIxQzYyOS4yMzIgMjgzLjEzMSA2NDAgMjY5Ljk5NiA2NDAgMjU0Ljc0MlYxOTIuMDFDNjQwIDE3MS44MTYgNjIxLjUyNSAxNTYuNjcyIDYwMS43MjUgMTYwLjYzMVonLz48L3N2Zz4="
                        />
                        <span class="left"></span>
                    </div>
                    <div class="albumTitle">
                        <span class="right"></span>
                        <img
                            class="albumTitleicon"
                            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA1MTIgNTEyJz48IS0tIEZvbnQgQXdlc29tZSBQcm8gNi4wLjAtYWxwaGEyIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIC0tPjxwYXRoIGQ9J00yNTYgMTZDMTIzLjQ2MSAxNiAxNiAxMjMuNDE5IDE2IDI1NlMxMjMuNDYxIDQ5NiAyNTYgNDk2UzQ5NiAzODguNTgxIDQ5NiAyNTZTMzg4LjUzOSAxNiAyNTYgMTZaTTgwLjcxNSAyNTZINzkuNjI3QzcwLjU0OSAyNTYgNjMuMjI5IDI0Ny45OSA2NC4wNjUgMjM4LjY1OEM3Mi4zNjQgMTQ2LjAxNyAxNDYuNDkgNzIuMDYgMjM5LjI3NCA2NC4wNTVDMjQ4LjI5MSAyMy4yNzggMjU2IDcwLjc5MSAyNTYgODAuMTMyVjgwLjEzMkMyNTYgODguNDgyIDI0OS43ODYgOTUuMzYzIDI0MS43MjcgOTYuMDc3QzE2NC43NDUgMTAyLjg5OCAxMDMuMTQ4IDE2NC4zNDcgOTYuMTUzIDI0MS4zNTRDOTUuNDAxIDI0OS42MzQgODguNzcxIDI1NiA4MC43MTUgMjU2Wk0yNTYgMzUyQzIwMi45NzYgMzUyIDE2MCAzMDkgMTYwIDI1NlMyMDIuOTc2IDE2MCAyNTYgMTYwUzM1MiAyMDMgMzUyIDI1NlMzMDkuMDI0IDM1MiAyNTYgMzUyWk0yNTYgMjI0QzIzOC4zMDMgMjI0IDIyNCAyMzguMjUgMjI0IDI1NlMyMzguMzAzIDI4OCAyNTYgMjg4QzI3My42OTcgMjg4IDI4OCAyNzMuNzUgMjg4IDI1NlMyNzMuNjk3IDIyNCAyNTYgMjI0WicvPjwvc3ZnPg=="
                        />
                        <span class="left"></span>
                    </div>
                    <div class="timeline">
                        <div class="progress-bar"></div>
                    </div>
                </div>
                <div class="aubar-wrapper">
                    <canvas class="aubar" width="0" height="0"></canvas>
                    <div class="aubar-controls">
                        <button class="control-btn prev" title="Previous">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                            </svg>
                        </button>
                        <button class="control-btn play-pause" title="Play/Pause">
                            <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" />
                                <rect x="14" y="4" width="4" height="16" />
                            </svg>
                        </button>
                        <button class="control-btn next" title="Next">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * 监听器注册由 src/player_control/bootstrap.ts 在 bundle.ts 阶段同步完成，
 * Vue mount 不需要再处理注册。但 elementManager 的 DOM 引用在 module-load
 * 时 querySelector 已执行（此时 #player_control 还不存在），所以是 null。
 *
 * 因此本组件唯一职责：渲染 <div id="player_control"> 容器。
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
void config;
</script>