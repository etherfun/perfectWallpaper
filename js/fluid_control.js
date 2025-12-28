// 流体效果参数配置
// 提供简单的参数暴露，供用户自行配置

// 流体效果全局配置对象
window.FluidEffectConfig = {
    // 基础参数
    enabled: true,
    intensity: 0.8,
    resolution: 512,
    viscosity: 0.5,
    diffusion: 0.0001,
    
    // 高级参数
    dt: 0.1,
    iterations: 4,
    useImageColors: true,
    
    // 新流体效果参数 (FluidEffect2)
    effectVersion: 2, // 1: 原版, 2: 新版
    blurAmount: 5,
    displacementScale: 400,
    turbulenceFrequency: 0.005,
    turbulenceOctaves: 1,
    animationSpeed: 1.0,
    // backdrop-filter 参数
    backdropFilterEnabled: false,
    backdropBlur: 8,
    backdropSaturate: 120,
    // 旋转动画参数
    rotationEnabled: true,
    rotationSpeeds: [0.5, 0.8, 0.6, 0.7],
    rotationDirections: [1, -1, 1, -1],
    rotationDelays: [0, 0.5, 1.0, 1.5],
    audioResponsive: false,
    minDisplacementScale: 200,
    maxDisplacementScale: 600,
    
    // 初始化函数
    init: function() {
        console.log('流体效果配置已加载');
        console.log('可用参数:', Object.keys(this).filter(key => typeof this[key] !== 'function'));
        
        // 如果已启用，自动初始化流体效果
        if (this.enabled && typeof FluidEffect !== 'undefined') {
            this.apply();
        }
        
        return this;
    },
    
    // 应用配置到流体效果
    apply: function() {
        // 根据启用状态初始化或销毁流体效果
        if (this.enabled) {
            if (typeof initFluidEffect === 'function') {
                initFluidEffect();
            }
        } else {
            if (typeof destroyFluidEffect === 'function') {
                destroyFluidEffect();
            }
        }
        
        // 如果流体效果已存在，更新其选项
        if (fluidEffect) {
            fluidEffect.updateOptions({
                density: this.intensity,
                resolution: this.resolution,
                viscosity: this.viscosity,
                diffusion: this.diffusion,
                dt: this.dt,
                iterations: this.iterations
            });
        }
        
        console.log('流体效果配置已应用');
        return this;
    },
    
    // 启用流体效果
    enable: function() {
        this.enabled = true;
        // 直接初始化流体效果，避免递归调用
        if (typeof initFluidEffect === 'function') {
            initFluidEffect();
        }
        return this;
    },
    
    // 禁用流体效果
    disable: function() {
        this.enabled = false;
        // 直接销毁流体效果，避免递归调用
        if (typeof destroyFluidEffect === 'function') {
            destroyFluidEffect();
        }
        return this;
    },
    
    // 切换启用状态
    toggle: function() {
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
    
    // 设置参数
    set: function(key, value) {
        if (key in this && typeof this[key] !== 'function') {
            this[key] = value;
            
            // 如果流体效果已启用，立即应用更改
            if (this.enabled && fluidEffect) {
                if (key === 'intensity') {
                    fluidEffect.updateOptions({ density: value });
                } else if (key === 'resolution') {
                    fluidEffect.updateOptions({ resolution: value });
                    // 重新设置图像源
                    if (player_control_thumbnail && player_control_thumbnail.complete) {
                        fluidEffect.setSourceFromImage(player_control_thumbnail);
                    }
                } else if (key === 'viscosity') {
                    fluidEffect.updateOptions({ viscosity: value });
                } else if (key === 'diffusion') {
                    fluidEffect.updateOptions({ diffusion: value });
                } else if (key === 'dt') {
                    fluidEffect.updateOptions({ dt: value });
                } else if (key === 'iterations') {
                    fluidEffect.updateOptions({ iterations: value });
                } else if (key === 'effectVersion') {
                    // 切换效果版本需要重新初始化
                    if (typeof destroyFluidEffect === 'function') {
                        destroyFluidEffect();
                    }
                    if (this.enabled && typeof initFluidEffect === 'function') {
                        initFluidEffect();
                    }
                } else if (key === 'blurAmount' && fluidEffect && fluidEffect.updateOptions) {
                    fluidEffect.updateOptions({ blurAmount: value });
                } else if (key === 'displacementScale' && fluidEffect && fluidEffect.updateOptions) {
                    fluidEffect.updateOptions({ displacementScale: value });
                } else if (key === 'turbulenceFrequency' && fluidEffect && fluidEffect.updateOptions) {
                    fluidEffect.updateOptions({ turbulenceFrequency: value });
                } else if (key === 'turbulenceOctaves' && fluidEffect && fluidEffect.updateOptions) {
                    fluidEffect.updateOptions({ turbulenceOctaves: value });
                } else if (key === 'animationSpeed' && fluidEffect && fluidEffect.updateOptions) {
                    fluidEffect.updateOptions({ animationSpeed: value });
                } else if (key === 'rotationEnabled' && fluidEffect && fluidEffect.updateOptions) {
                    fluidEffect.updateOptions({ rotationEnabled: value });
                } else if (key === 'rotationSpeeds' && fluidEffect && fluidEffect.updateOptions) {
                    fluidEffect.updateOptions({ rotationSpeeds: value });
                } else if (key === 'rotationDirections' && fluidEffect && fluidEffect.updateOptions) {
                    fluidEffect.updateOptions({ rotationDirections: value });
                } else if (key === 'rotationDelays' && fluidEffect && fluidEffect.updateOptions) {
                    fluidEffect.updateOptions({ rotationDelays: value });
                        } else if (key === 'backdropFilterEnabled' && fluidEffect && fluidEffect.updateOptions) {
                            fluidEffect.updateOptions({ backdropFilterEnabled: value });
                        } else if (key === 'backdropBlur' && fluidEffect && fluidEffect.updateOptions) {
                            fluidEffect.updateOptions({ backdropBlur: value });
                        } else if (key === 'backdropSaturate' && fluidEffect && fluidEffect.updateOptions) {
                            fluidEffect.updateOptions({ backdropSaturate: value });
                } else if (key === 'audioResponsive' && fluidEffect && fluidEffect.updateOptions) {
                    fluidEffect.updateOptions({ audioResponsive: value });
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
            intensity: 0.8,
            resolution: 64,
            viscosity: 0.5,
            diffusion: 0.0001,
            dt: 0.1,
            iterations: 4,
            useImageColors: true,
            effectVersion: 2,
            blurAmount: 5,
            displacementScale: 400,
            turbulenceFrequency: 0.005,
            turbulenceOctaves: 1,
            animationSpeed: 1.0,
            backdropFilterEnabled: false,
            backdropBlur: 8,
            backdropSaturate: 120,
            rotationEnabled: true,
            rotationSpeeds: [0.5, 0.8, 0.6, 0.7],
            rotationDirections: [1, -1, 1, -1],
            rotationDelays: [0, 0.5, 1.0, 1.5],
            audioResponsive: false,
            minDisplacementScale: 200,
            maxDisplacementScale: 600
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