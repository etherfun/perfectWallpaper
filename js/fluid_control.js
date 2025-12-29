// 流体效果参数配置
// 提供简单的参数暴露，供用户自行配置

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
    animationSpeed: 0.005,
    
    // 旋转动画参数
    rotationEnabled: true,
    rotationDirections: [1, -1, 1, -1],
    rotationDelays: [0, 0.5, 1.0, 1.5],
    
    // 音频响应参数
    audioResponsive: false,
    minDisplacementScale: 200,
    maxDisplacementScale: 600,
    
    // 全屏流体效果参数
    fullscreenEnabled: true, // 启用全屏流体效果时，关闭播放器组件的流体效果
    
    // 初始化函数
    init: function() {
        console.log('流体效果配置已加载');
        console.log('可用参数:', Object.keys(this).filter(key => typeof this[key] !== 'function'));
        
        // 不再自动初始化流体效果，等待有播放内容时再初始化
        // 流体效果将在检测到播放内容时通过其他函数初始化
        console.log('流体效果配置已就绪，等待播放内容...');
        
        return this;
    },
    
    // 应用配置到流体效果
    apply: function() {
        // 处理全屏流体效果
        if (this.fullscreenEnabled) {
            // 如果启用了全屏流体效果，确保播放器流体效果被禁用
            this.enabled = false; // 禁用播放器流体效果
            if (typeof destroyFluidEffect === 'function') {
                destroyFluidEffect();
            }
            
            // 初始化全屏流体效果
            if (typeof initFullscreenFluidEffect === 'function') {
                initFullscreenFluidEffect();
            }
        } else {
            // 如果禁用了全屏流体效果，销毁全屏流体效果
            if (typeof destroyFullscreenFluidEffect === 'function') {
                destroyFullscreenFluidEffect();
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
                turbulenceOctaves: this.turbulenceOctaves,
                animationSpeed: this.animationSpeed,
                rotationEnabled: this.rotationEnabled,
                rotationDirections: this.rotationDirections,
                rotationDelays: this.rotationDelays,
                audioResponsive: this.audioResponsive,
                minDisplacementScale: this.minDisplacementScale,
                maxDisplacementScale: this.maxDisplacementScale
            });
        }
        
        // 如果全屏流体效果已存在，更新其选项
        if (fullscreenFluidEffect) {
            fullscreenFluidEffect.updateOptions({
                resolution: this.resolution,
                blurAmount: this.blurAmount,
                displacementScale: this.displacementScale,
                turbulenceFrequency: this.turbulenceFrequency,
                turbulenceOctaves: this.turbulenceOctaves,
                animationSpeed: this.animationSpeed,
                rotationEnabled: this.rotationEnabled,
                rotationDirections: this.rotationDirections,
                rotationDelays: this.rotationDelays
            });
        }
        
        console.log('流体效果配置已应用');
        return this;
    },
    
    // 启用流体效果
    enable: function() {
        this.enabled = true;
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
    disable: function() {
        this.enabled = false;
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
    toggle: function() {
        // 如果启用了全屏流体效果，不允许切换播放器流体效果
        if (this.fullscreenEnabled) {
            console.warn('全屏流体效果已启用，无法切换播放器流体效果');
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
        return this.enabled;
    },
    
    // 启用全屏流体效果
    enableFullscreen: function() {
        this.fullscreenEnabled = true;
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
    disableFullscreen: function() {
        this.fullscreenEnabled = false;
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
    toggleFullscreen: function() {
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
        return this.fullscreenEnabled;
    },
    
    // 设置参数
    set: function(key, value) {
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
            
            // 特殊处理enabled参数：如果启用了全屏流体效果，不允许启用播放器流体效果
            if (key === 'enabled' && value && this.fullscreenEnabled) {
                console.warn('全屏流体效果已启用，无法启用播放器流体效果');
                return false;
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
                } else if (key === 'animationSpeed') {
                    fluidEffect.updateOptions({ animationSpeed: value });
                } else if (key === 'rotationEnabled') {
                    fluidEffect.updateOptions({ rotationEnabled: value });
                } else if (key === 'rotationDirections') {
                    fluidEffect.updateOptions({ rotationDirections: value });
                } else if (key === 'rotationDelays') {
                    fluidEffect.updateOptions({ rotationDelays: value });
                } else if (key === 'audioResponsive') {
                    fluidEffect.updateOptions({ audioResponsive: value });
                } else if (key === 'minDisplacementScale') {
                    fluidEffect.updateOptions({ minDisplacementScale: value });
                } else if (key === 'maxDisplacementScale') {
                    fluidEffect.updateOptions({ maxDisplacementScale: value });
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
                } else if (key === 'animationSpeed' && fullscreenFluidEffect.updateOptions) {
                    fullscreenFluidEffect.updateOptions({ animationSpeed: value });
                } else if (key === 'rotationEnabled' && fullscreenFluidEffect.updateOptions) {
                    fullscreenFluidEffect.updateOptions({ rotationEnabled: value });
                } else if (key === 'rotationDirections' && fullscreenFluidEffect.updateOptions) {
                    fullscreenFluidEffect.updateOptions({ rotationDirections: value });
                } else if (key === 'rotationDelays' && fullscreenFluidEffect.updateOptions) {
                    fullscreenFluidEffect.updateOptions({ rotationDelays: value });
                }
            }
            
            console.log(`参数 ${key} 已设置为:`, value);
            return true;
        }
        console.warn(`参数 ${key} 不存在或不可设置`);
        return false;
    },
    
    // 获取当前配置
    getConfig: function() {
        const config = {};
        for (const key in this) {
            if (typeof this[key] !== 'function') {
                config[key] = this[key];
            }
        }
        return config;
    },
    
    // 重置为默认值
    reset: function() {
        const defaults = {
            enabled: false,
            resolution: 512,
            blurAmount: 5,
            displacementScale: 400,
            turbulenceFrequency: 0.005,
            turbulenceOctaves: 1,
            animationSpeed: 1.0,
            rotationEnabled: true,
            rotationDirections: [1, -1, 1, -1],
            rotationDelays: [0, 0.5, 1.0, 1.5],
            audioResponsive: false,
            minDisplacementScale: 200,
            maxDisplacementScale: 600,
            fullscreenEnabled: false
        };
        
        Object.assign(this, defaults);
        this.apply();
        console.log('配置已重置为默认值');
        return this;
    },
    
    // 显示当前配置
    showConfig: function() {
        console.group('流体效果当前配置');
        for (const key in this) {
            if (typeof this[key] !== 'function') {
                console.log(`${key}:`, this[key]);
            }
        }
        console.groupEnd();
        return this;
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

function updateFluidIntensity(intensity) {
    if (window.FluidEffectConfig) {
        window.FluidEffectConfig.set('intensity', intensity);
    }
}

function updateFluidResolution(resolution) {
    if (window.FluidEffectConfig) {
        window.FluidEffectConfig.set('resolution', resolution);
    }
}

// 自动初始化
(function() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
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
    // 确保配置对象存在
    if (!window.FluidEffectConfig) {
        console.warn('FluidEffectConfig not found. Make sure fluid_control.js is loaded.');
        return;
    }

    // 检查是否启用了全屏流体效果
    if (!window.FluidEffectConfig.fullscreenEnabled) {
        console.log('全屏流体效果未启用');
        // 如果已有全屏流体效果实例，先销毁
        if (fullscreenFluidEffect) {
            fullscreenFluidEffect.destroy();
            fullscreenFluidEffect = null;
        }
        return;
    }

    timerManager.pause('backgroundChange');

    // 如果已有全屏流体效果实例，先销毁
    if (fullscreenFluidEffect) {
        fullscreenFluidEffect.destroy();
        fullscreenFluidEffect = null;
    }

    // 获取全屏容器（使用body作为容器）
    var container = document.body;

    // 使用新的流体效果类 (FluidEffect2)
    if (typeof FluidEffect2 === 'undefined') {
        console.warn('FluidEffect2 class not found. Make sure fluid_effect2.js is loaded.');
        return;
    }
    
    try {
        fullscreenFluidEffect = new FluidEffect2(container, {
            resolution: window.FluidEffectConfig.resolution,
            blurAmount: window.FluidEffectConfig.blurAmount,
            displacementScale: window.FluidEffectConfig.displacementScale,
            turbulenceFrequency: window.FluidEffectConfig.turbulenceFrequency,
            turbulenceOctaves: window.FluidEffectConfig.turbulenceOctaves,
            animationSpeed: window.FluidEffectConfig.animationSpeed,
            rotationEnabled: window.FluidEffectConfig.rotationEnabled,
            rotationDirections: window.FluidEffectConfig.rotationDirections,
            rotationDelays: window.FluidEffectConfig.rotationDelays,
            canvasDisplacementAmplitude: 30 // 全屏效果可以稍微大一点
        });
        
        // 启动动画
        fullscreenFluidEffect.start();
        
        // 检查是否已经有封面图，如果有就立即使用
        if (typeof player_control_thumbnail !== 'undefined' && player_control_thumbnail && player_control_thumbnail.src && player_control_thumbnail.src !== '') {
            console.log('发现已有封面图，立即设置流体效果源');
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                if (fullscreenFluidEffect) {
                    fullscreenFluidEffect.setSourceFromImage(img);
                }
            };
            img.src = player_control_thumbnail.src;
        } else {
            // 否则等待wallpaperMediaThumbnailListener响应
            console.log('全屏流体效果已初始化，等待封面图更新...');
        }
        
        console.log('全屏流体效果已启用');
    } catch (error) {
        console.error('Failed to initialize fullscreen fluid effect:', error);
        return;
    }
}

function destroyFullscreenFluidEffect() {
    if (fullscreenFluidEffect) {
        fullscreenFluidEffect.destroy();
        fullscreenFluidEffect = null;

        timerManager.resume('backgroundChange');
        console.log('全屏流体效果已销毁');
    }
}

// 更新全屏流体效果的源图像
function updateFullscreenFluidSource() {
    // 确保配置对象存在
    if (!window.FluidEffectConfig) {
        console.warn('FluidEffectConfig not found. Make sure fluid_control.js is loaded.');
        return;
    }

    // 检查是否启用了全屏流体效果
    if (!window.FluidEffectConfig.fullscreenEnabled) {
        console.log('全屏流体效果未启用，跳过源图像更新');
        return;
    }

    // 检查是否有全屏流体效果实例
    if (!fullscreenFluidEffect) {
        console.log('全屏流体效果实例不存在，尝试初始化');
        initFullscreenFluidEffect();
        return;
    }

    // 检查是否有封面图
    if (typeof player_control_thumbnail === 'undefined' || !player_control_thumbnail || !player_control_thumbnail.src || player_control_thumbnail.src === '') {
        console.log('没有可用的封面图，跳过源图像更新');
        return;
    }

    console.log('更新全屏流体效果源图像');
    
    // 创建新的图像对象
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        if (fullscreenFluidEffect && fullscreenFluidEffect.setSourceFromImage) {
            fullscreenFluidEffect.setSourceFromImage(img);
            console.log('全屏流体效果源图像已更新');
        }
    };
    img.onerror = (error) => {
        console.error('加载封面图失败:', error);
    };
    img.src = player_control_thumbnail.src;
}