// 流体效果全局配置对象
window.FluidEffectConfig = {
    // 基础参数
    enabled: true,
    resolution: 512,

    // 流体效果参数
    blurAmount: 5,
    displacementScale: 400,
    turbulenceFrequency: 0.005,
    turbulenceOctaves: 1,

    // 全屏流体效果参数
    fullscreenEnabled: true, // 启用全屏流体效果时，关闭播放器组件的流体效果
    canvasDisplacementAmplitude: 20, // canvas位移幅度（像素）

    // 初始化函数
    init: function () {
        return this;
    },

    // 应用配置到流体效果
    apply: function () {
        // 添加调试日志
        debugLogger.info('应用流体效果配置', {
            enabled: this.enabled,
            fullscreenEnabled: this.fullscreenEnabled,
            resolution: this.resolution
        });
        
        // 处理全屏流体效果
        if (this.fullscreenEnabled) {
            // 如果启用了全屏流体效果，确保播放器流体效果被禁用
            this.enabled = false; // 禁用播放器流体效果
            if (typeof destroyFluidEffect === 'function') {
                destroyFluidEffect();
            }

            // 初始化全屏流体效果（initFullscreenFluidEffect内部会暂停背景切换）
            if (typeof initFullscreenFluidEffect === 'function') {
                initFullscreenFluidEffect();
            }
        } else {
            // 如果禁用了全屏流体效果，销毁全屏流体效果
            if (typeof destroyFullscreenFluidEffect === 'function') {
                destroyFullscreenFluidEffect();
            }

            // 恢复背景切换定时器
            if (typeof timerManager !== 'undefined' && timerManager.resume) {
                timerManager.resume('backgroundChange');
            }

            // 根据启用状态初始化或销毁播放器流体效果
            if (this.enabled) {
                if (typeof initFluidEffect === 'function') {
                    initFluidEffect();
                }
            } else {
                if (typeof destroyFluidEffect === 'function') {
                    destroyFluidEffect();
                }
            }
        }

        // 如果播放器流体效果已存在，更新其选项
        if (fluidEffect && fluidEffect.updateOptions) {
            fluidEffect.updateOptions({
                resolution: this.resolution,
                blurAmount: this.blurAmount,
                displacementScale: this.displacementScale,
                turbulenceFrequency: this.turbulenceFrequency,
                turbulenceOctaves: this.turbulenceOctaves
            });
        }

        // 如果全屏流体效果已存在，更新其选项
        if (fullscreenFluidEffect) {
            fullscreenFluidEffect.updateOptions({
                resolution: this.resolution,
                blurAmount: this.blurAmount,
                displacementScale: this.displacementScale,
                turbulenceFrequency: this.turbulenceFrequency,
                turbulenceOctaves: this.turbulenceOctaves
            });
        }
        return this;
    },

    // 启用流体效果
    enable: function () {
        this.enabled = true;
        // 添加调试日志
        debugLogger.info('启用流体效果', {
            fullscreenEnabled: this.fullscreenEnabled
        });
        
        // 如果启用了全屏流体效果，则跳过播放器流体效果初始化
        if (!this.fullscreenEnabled) {
            // 直接初始化流体效果，避免递归调用
            if (typeof initFluidEffect === 'function') {
                initFluidEffect();
            }
        }
        return this;
    },

    // 禁用流体效果
    disable: function () {
        this.enabled = false;
        // 添加调试日志
        debugLogger.info('禁用流体效果', {
            fullscreenEnabled: this.fullscreenEnabled
        });
        
        // 如果启用了全屏流体效果，则跳过播放器流体效果销毁
        if (!this.fullscreenEnabled) {
            // 直接销毁流体效果，避免递归调用
            if (typeof destroyFluidEffect === 'function') {
                destroyFluidEffect();
            }
        }
        return this;
    },

    // 切换启用状态
    toggle: function () {
        // 添加调试日志
        debugLogger.info('切换流体效果状态', {
            currentEnabled: this.enabled,
            fullscreenEnabled: this.fullscreenEnabled
        });
        
        // 如果启用了全屏流体效果，不允许切换播放器流体效果
        if (this.fullscreenEnabled) {
            debugLogger.warn('全屏流体效果已启用，不允许切换播放器流体效果');
            return this.enabled;
        }

        this.enabled = !this.enabled;
        if (this.enabled) {
            if (typeof initFluidEffect === 'function') {
                initFluidEffect();
            }
        } else {
            if (typeof destroyFluidEffect === 'function') {
                destroyFluidEffect();
            }
        }
        
        // 记录切换结果
        debugLogger.info('流体效果状态已切换', {
            newEnabled: this.enabled
        });
        
        return this.enabled;
    },

    // 启用全屏流体效果
    enableFullscreen: function () {
        this.fullscreenEnabled = true;
        // 添加调试日志
        debugLogger.info('启用全屏流体效果');
        
        // 禁用播放器流体效果
        document.querySelector('.fluid-effect-wrapper')?.remove();
        // 销毁播放器流体效果
        if (typeof destroyFluidEffect === 'function') {
            destroyFluidEffect();
        }
        // 初始化全屏流体效果
        if (typeof initFullscreenFluidEffect === 'function') {
            initFullscreenFluidEffect();
        }
        return this;
    },

    // 禁用全屏流体效果
    disableFullscreen: function () {
        this.fullscreenEnabled = false;
        // 添加调试日志
        debugLogger.info('禁用全屏流体效果', {
            playerEffectEnabled: this.enabled
        });
        
        // 销毁全屏流体效果
        if (typeof destroyFullscreenFluidEffect === 'function') {
            destroyFullscreenFluidEffect();
        }
        // 根据启用状态初始化播放器流体效果
        if (this.enabled && typeof initFluidEffect === 'function') {
            initFluidEffect();
        }
        return this;
    },

    // 切换全屏流体效果状态
    toggleFullscreen: function () {
        // 添加调试日志
        debugLogger.info('切换全屏流体效果状态', {
            currentFullscreenEnabled: this.fullscreenEnabled,
            playerEffectEnabled: this.enabled
        });
        
        this.fullscreenEnabled = !this.fullscreenEnabled;
        if (this.fullscreenEnabled) {
            // 启用全屏流体效果
            document.querySelector('.fluid-effect-wrapper')?.remove();
            if (typeof destroyFluidEffect === 'function') {
                destroyFluidEffect();
            }
            if (typeof initFullscreenFluidEffect === 'function') {
                initFullscreenFluidEffect();
            }
        } else {
            // 禁用全屏流体效果
            if (typeof destroyFullscreenFluidEffect === 'function') {
                destroyFullscreenFluidEffect();
            }
            if (this.enabled && typeof initFluidEffect === 'function') {
                initFluidEffect();
            }
        }
        
        // 记录切换结果
        debugLogger.info('全屏流体效果状态已切换', {
            newFullscreenEnabled: this.fullscreenEnabled
        });
        
        return this.fullscreenEnabled;
    },

    // 设置参数
    set: function (key, value) {
        // 添加调试日志
        debugLogger.info('设置流体效果参数', {
            key: key,
            value: value,
            oldValue: this[key]
        });
        
        if (key in this && typeof this[key] !== 'function') {
            this[key] = value;

            // 特殊处理fullscreenEnabled参数
            if (key === 'fullscreenEnabled') {
                if (value) {
                    // 启用全屏流体效果
                    this.enableFullscreen();
                } else {
                    // 禁用全屏流体效果
                    this.disableFullscreen();
                }
                return this;
            }

            if (key === 'enabled') {
                if (value) {
                    this.enable();
                } else {
                    this.disable();
                }
            }

            // 如果流体效果已启用，立即应用更改
            if (this.enabled && fluidEffect && fluidEffect.updateOptions) {
                if (key === 'resolution') {
                    fluidEffect.updateOptions({ resolution: value });
                    // 重新设置图像源
                    if (player_control_thumbnail && player_control_thumbnail.complete) {
                        fluidEffect.setSourceFromImage(player_control_thumbnail);
                    }
                } else if (key === 'blurAmount') {
                    fluidEffect.updateOptions({ blurAmount: value });
                } else if (key === 'displacementScale') {
                    fluidEffect.updateOptions({ displacementScale: value });
                } else if (key === 'turbulenceFrequency') {
                    fluidEffect.updateOptions({ turbulenceFrequency: value });
                } else if (key === 'turbulenceOctaves') {
                    fluidEffect.updateOptions({ turbulenceOctaves: value });
                } else if (key === 'canvasDisplacementAmplitude') {
                    fluidEffect.updateOptions({ canvasDisplacementAmplitude: value });
                }
            }

            // 如果全屏流体效果已启用，也应用参数更改到全屏流体效果
            if (this.fullscreenEnabled && fullscreenFluidEffect) {
                if (key === 'resolution' && fullscreenFluidEffect.updateOptions) {
                    fullscreenFluidEffect.updateOptions({ resolution: value });
                } else if (key === 'blurAmount' && fullscreenFluidEffect.updateOptions) {
                    fullscreenFluidEffect.updateOptions({ blurAmount: value });
                } else if (key === 'displacementScale' && fullscreenFluidEffect.updateOptions) {
                    fullscreenFluidEffect.updateOptions({ displacementScale: value });
                } else if (key === 'turbulenceFrequency' && fullscreenFluidEffect.updateOptions) {
                    fullscreenFluidEffect.updateOptions({ turbulenceFrequency: value });
                } else if (key === 'turbulenceOctaves' && fullscreenFluidEffect.updateOptions) {
                    fullscreenFluidEffect.updateOptions({ turbulenceOctaves: value });
                } else if (key === 'canvasDisplacementAmplitude' && fullscreenFluidEffect.updateOptions) {
                    fullscreenFluidEffect.updateOptions({ canvasDisplacementAmplitude: value });
                }
            }

            return true;
        }
        return false;
    }
};

// 简化的控制函数（兼容旧代码）
function toggleFluidEffect(enable) {
    if (enable === undefined) {
        enable = !window.FluidEffectConfig.enabled;
    }

    // 直接操作，避免递归调用
    if (enable) {
        window.FluidEffectConfig.enabled = true;
        if (typeof initFluidEffect === 'function') {
            initFluidEffect();
        }
    } else {
        window.FluidEffectConfig.enabled = false;
        if (typeof destroyFluidEffect === 'function') {
            destroyFluidEffect();
        }
    }

    return enable;
}

function updateFluidResolution(resolution) {
    if (window.FluidEffectConfig) {
        window.FluidEffectConfig.set('resolution', resolution);
    }
}

// 自动初始化
(function () {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            window.FluidEffectConfig.init();
        });
    } else {
        window.FluidEffectConfig.init();
    }
})();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.FluidEffectConfig;
}

// 全屏流体效果相关函数
function initFullscreenFluidEffect() {
    if (!window.FluidEffectConfig) {
        return;
    }

    // 检查是否启用了全屏流体效果
    if (!window.FluidEffectConfig.fullscreenEnabled) {
        if (fullscreenFluidEffect) {
            fullscreenFluidEffect.destroy();
            fullscreenFluidEffect = null;
        }
        return;
    }

    // 检查是否有播放内容（如果 hasPlaybackContent 函数存在）
    if (typeof hasPlaybackContent === 'function' && !hasPlaybackContent()) {
        debugLogger.info('没有播放内容，跳过全屏流体效果初始化');
        return;
    }

    // 检查媒体是否处于暂停状态
    let isPaused = false;
    if (typeof player_now !== 'undefined' && window.wallpaperMediaIntegration) {
        isPaused = player_now === window.wallpaperMediaIntegration.PLAYBACK_PAUSED;
        debugLogger.info('全屏流体效果初始化 - 播放状态检查', {
            player_now: player_now,
            isPaused: isPaused,
            PLAYBACK_PAUSED: window.wallpaperMediaIntegration.PLAYBACK_PAUSED
        });
    }

    if (fullscreenFluidEffect) {
        fullscreenFluidEffect.destroy();
        fullscreenFluidEffect = null;
    }

    window.fullscreenFluidEnabled = true;

    addPictureInfoHideStyle();

    var container = document.body;

    if (typeof FluidEffect2 === 'undefined') {
        return;
    }

    try {
        fullscreenFluidEffect = new FluidEffect2(container, {
            resolution: window.FluidEffectConfig.resolution,
            blurAmount: window.FluidEffectConfig.blurAmount,
            displacementScale: window.FluidEffectConfig.displacementScale,
            turbulenceFrequency: window.FluidEffectConfig.turbulenceFrequency,
            turbulenceOctaves: window.FluidEffectConfig.turbulenceOctaves,
            canvasDisplacementAmplitude: window.FluidEffectConfig.canvasDisplacementAmplitude
        });

        // 启动动画
        fullscreenFluidEffect.start();

        // 如果媒体处于暂停状态，立即暂停流体效果
        if (isPaused && fullscreenFluidEffect && fullscreenFluidEffect.setPlayState) {
            debugLogger.info('全屏流体效果：媒体处于暂停状态，暂停流体效果动画');
            fullscreenFluidEffect.setPlayState(false);
        }

        // 检查是否已经有封面图，如果有就立即使用
        if (typeof player_control_thumbnail !== 'undefined' && player_control_thumbnail && player_control_thumbnail.src && player_control_thumbnail.src !== '') {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                if (fullscreenFluidEffect) {
                    fullscreenFluidEffect.setSourceFromImage(img);
                    // 设置全屏背景图片到流体效果容器
                    const fluidWrapper = document.querySelector('.fluid-effect-wrapper');
                    if (fluidWrapper) {
                        fluidWrapper.style.backgroundImage = "url('" + player_control_thumbnail.src + "')";
                        fluidWrapper.style.backgroundSize = "cover";
                        fluidWrapper.style.backgroundPosition = "center";
                        fluidWrapper.style.backgroundRepeat = "no-repeat";
                    }
                }
            };
            img.src = player_control_thumbnail.src;
        } else {
            // 如果没有封面图，清除背景图片
            const fluidWrapper = document.querySelector('.fluid-effect-wrapper');
            if (fluidWrapper) {
                fluidWrapper.style.backgroundImage = "none";
            }
        }
    } catch (error) {
        debugLogger.error('Failed to initialize fullscreen fluid effect:', {msg: error});
        return;
    }
}

function destroyFullscreenFluidEffect() {
    if (fullscreenFluidEffect) {
        fullscreenFluidEffect.destroy();
        fullscreenFluidEffect = null;

        timerManager.resume('backgroundChange');
    }

    window.fullscreenFluidEnabled = false;

    removePictureInfoHideStyle();
    
    // 清除全屏背景图片
    const fluidWrapper = document.querySelector('.fluid-effect-wrapper');
    if (fluidWrapper) {
        fluidWrapper.style.backgroundImage = "none";
    }
}

// 更新全屏流体效果的源图像
function updateFullscreenFluidSource() {
    if (!window.FluidEffectConfig) {
        debugLogger.warn('FluidEffectConfig not found. Make sure fluid_control.js is loaded.');
        return;
    }

    // 检查是否启用了全屏流体效果
    if (!window.FluidEffectConfig.fullscreenEnabled) {
        return;
    }

    // 检查是否有全屏流体效果实例
    if (!fullscreenFluidEffect) {
        initFullscreenFluidEffect();
        return;
    }

    // 检查是否有封面图
    if (typeof player_control_thumbnail === 'undefined' || !player_control_thumbnail || !player_control_thumbnail.src || player_control_thumbnail.src === '') {
        return;
    }

    // 创建新的图像对象
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        if (fullscreenFluidEffect && fullscreenFluidEffect.setSourceFromImage) {
            fullscreenFluidEffect.setSourceFromImage(img);
            // 更新全屏背景图片到流体效果容器
            const fluidWrapper = document.querySelector('.fluid-effect-wrapper');
            if (fluidWrapper) {
                fluidWrapper.style.backgroundImage = "url('" + player_control_thumbnail.src + "')";
                fluidWrapper.style.backgroundSize = "cover";
                fluidWrapper.style.backgroundPosition = "center";
                fluidWrapper.style.backgroundRepeat = "no-repeat";
            }
        }
    };
    img.src = player_control_thumbnail.src;
}

// 添加隐藏picture_info元素的CSS类
function addPictureInfoHideStyle() {
    var pictureInfo = document.getElementById('picture_info');
    if (pictureInfo) {
        pictureInfo.classList.add('fluid-hidden');
    }
    window.pictureInfoHideStyleAdded = true;
}

// 移除隐藏picture_info元素的CSS类
function removePictureInfoHideStyle() {
    var pictureInfo = document.getElementById('picture_info');
    if (pictureInfo) {
        pictureInfo.classList.remove('fluid-hidden');
    }
    window.pictureInfoHideStyleAdded = false;
}

// 初始化时检查是否需要隐藏picture_info
function initPictureInfoControl() {
    // 初始化时检查是否需要隐藏picture_info
    if (window.fullscreenFluidEnabled) {
        addPictureInfoHideStyle();
    }
}

// 流体效果相关函数
function initFluidEffect() {
    // 确保配置对象存在
    if (!window.FluidEffectConfig) {
        debugLogger.warn('FluidEffectConfig not found. Make sure fluid_control.js is loaded.');
        return;
    }

    // 检查是否启用了全屏流体效果，如果启用则跳过播放器流体效果初始化
    if (window.FluidEffectConfig.fullscreenEnabled) {
        debugLogger.info('全屏流体效果已启用，跳过播放器流体效果初始化');
        return;
    }

    // 检查是否有播放内容，如果没有则不初始化流体效果
    // 首先检查 hasPlaybackContent 函数是否存在
    if (typeof hasPlaybackContent !== 'function') {
        debugLogger.warn('hasPlaybackContent 函数未定义，无法检查播放内容');
        return;
    }
    
    if (!hasPlaybackContent()) {
        debugLogger.info('没有播放内容，跳过流体效果初始化');
        return;
    }

    // 如果已有流体效果实例，先销毁
    if (fluidEffect) {
        fluidEffect.destroy();
        fluidEffect = null;
    }

    // 使用新的流体效果类 (FluidEffect2)
    if (typeof FluidEffect2 === 'undefined') {
        debugLogger.warn('FluidEffect2 class not found. Make sure fluid_effect2.js is loaded.');
        return;
    }
    
    try {
        fluidEffect = new FluidEffect2(player_control_background, {
            resolution: window.FluidEffectConfig.resolution,
            blurAmount: window.FluidEffectConfig.blurAmount,
            displacementScale: window.FluidEffectConfig.displacementScale,
            turbulenceFrequency: window.FluidEffectConfig.turbulenceFrequency,
            turbulenceOctaves: window.FluidEffectConfig.turbulenceOctaves,
            canvasDisplacementAmplitude: window.FluidEffectConfig.canvasDisplacementAmplitude
        });
        debugLogger.info('Fluid effect initialized (FluidEffect2)');
    } catch (error) {
        debugLogger.error('Failed to initialize fluid effect:', error);
        return;
    }

        // 设置封面图像作为流体源
        if (player_control_thumbnail && player_control_thumbnail.complete && fluidEffect.setSourceFromImage) {
            fluidEffect.setSourceFromImage(player_control_thumbnail);
            document.querySelector(".fluid-effect-wrapper").style.backgroundImage = "url('" + player_control_thumbnail.src + "')";
        }

        // 开始流体模拟
        if (fluidEffect.start) {
            fluidEffect.start();
        }
        
        // 根据当前播放状态设置流体效果的播放状态
        if (player_now === window.wallpaperMediaIntegration.PLAYBACK_PAUSED) {
            // 如果当前是暂停状态，暂停流体效果
            if (fluidEffect && fluidEffect.setPlayState) {
                fluidEffect.setPlayState(false);
                debugLogger.info('流体效果初始化完成，当前为暂停状态，已暂停流体效果');
            }
        } else if (player_now === window.wallpaperMediaIntegration.PLAYBACK_PLAYING) {
            // 如果当前是播放状态，确保流体效果运行
            if (fluidEffect && fluidEffect.setPlayState) {
                fluidEffect.setPlayState(true);
                debugLogger.info('流体效果初始化完成，当前为播放状态，流体效果运行中');
            }
        } else {
            // 停止状态或其他状态
            debugLogger.info('流体效果初始化完成，当前为停止状态');
        }
        
        // 调整背景样式
        player_control_background.style.background = 'none';
        player_control_background.style.overflow = 'hidden';
        
        debugLogger.info('Fluid effect initialized successfully');
}

function destroyFluidEffect() {
    // 检查是否启用了全屏流体效果，如果启用则跳过播放器流体效果销毁
    if (window.FluidEffectConfig && window.FluidEffectConfig.fullscreenEnabled) {
        debugLogger.info('全屏流体效果已启用，跳过播放器流体效果销毁');
        return;
    }

    if (fluidEffect) {
        fluidEffect.destroy();
        fluidEffect = null;
        
        // 恢复背景样式
        if (player_control_background) {
            player_control_background.style.background = '';
        }
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPictureInfoControl);
} else {
    initPictureInfoControl();
}
