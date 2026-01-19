let wallpaperSettings = {
    ledPlugin: false,
    cuePlugin: false
};

let backgroundRGB
let sakuraRGB
let RGBRefresh
let RGB_show
let particlesRGB
let nextphoto
let audiobarRGB
let opacity_saRGb
let audioArray
let aurgbcolor
let aurgbhigh
let audiobarrainbowcolor
let rainbowmove
let rainbowmovespeed
let time = 0

window.wallpaperPluginListener = {
    onPluginLoaded: function (name, version) {
        if (name === 'led') {
            // LED plugin loaded (works for all hardware)
            wallpaperSettings.ledPlugin = true;
        }
        if (name === 'cue') {
            // iCUE-specific plugin loaded, only needed if you want to utilize extra iCUE functions
            wallpaperSettings.cuePlugin = true;
        }
        debugLogger.info('RGB插件启用情况', {type: name})
    }
};

function getEncodedCanvasImageData(canvas) {
    let context = canvas.getContext('2d');
    let imageData = context.getImageData(0, 0, 100, 20);
    let colorArray = [];

    for (let d = 0; d < imageData.data.length; d += 4) {
        let write = d / 4 * 3;
        colorArray[write] = imageData.data[d];
        colorArray[write + 1] = imageData.data[d + 1];
        colorArray[write + 2] = imageData.data[d + 2];
    }
    return String.fromCharCode.apply(null, colorArray);
}

// Only execute this logic if the LED plugin has actually been loaded
function startRGB() {
    const canvas = document.getElementById('RGBuse');
    let encodedImageData = getEncodedCanvasImageData(canvas);
    window.wpPlugins.led.setAllDevicesByImageData(encodedImageData, canvas.width, canvas.height);
}


function background2canvas(src, videoORimages) {
    let Frist = true
    let sakura = document.getElementById('sakura')
    let particles = document.getElementById('canvas-particles')
    let bg = document.getElementById('RGBuse')
    let rgbbg = document.getElementById('RGBuse').getContext('2d')

    function drawLayers() {
        let sakurause = (sakuraRGB && ((sakura.width == window.screen.width) && (sakura.height == window.screen.height)))

        rgbbg.save()
        rgbbg.globalAlpha = opacity_saRGb
        if (sakurause) { rgbbg.drawImage(sakura, 0, 0, sakura.width, sakura.height, 0, 0, 100, 20) }

        rgbbg.globalAlpha = 1
        if (particlesRGB) { rgbbg.drawImage(particles, 0, 0, particles.width, particles.height, 0, 0, 100, 20) }
        if (audiobarrainbowcolor) {
            if (audiobarRGB && audioArray) {
                let barWidth = bg.width / 128;
                let scaleFactor = aurgbhigh;
                let hueStep = 360 / 128;

                // 初始化 smoothedAudioArray，如果不存在
                if (!window.smoothedAudioArray || window.smoothedAudioArray.length !== audioArray.length) {
                    window.smoothedAudioArray = new Array(audioArray.length).fill(0);
                }

                // 更新 smoothedAudioArray 值，逐渐靠近 audioArray
                for (let i = 0; i < audioArray.length; ++i) {
                    window.smoothedAudioArray[i] += (audioArray[i] - window.smoothedAudioArray[i]) * 0.1; // 平滑系数为 0.1
                }

                for (let i = 0; i < audioArray.length; ++i) {
                    let hue = (i * hueStep + time) % 360;
                    let saturation = '100%';
                    let lightness = '50%';
                    let rgbColor = `hsl(${hue}, ${saturation}, ${lightness})`;

                    let channelIndex = i % 64;
                    if (i >= 64) {
                        channelIndex += 64;
                    }

                    let height = bg.height * Math.min(window.smoothedAudioArray[i], 1) * scaleFactor;
                    let actualHeight = Math.min(height, bg.height);

                    rgbbg.fillStyle = rgbColor;
                    rgbbg.fillRect(barWidth * channelIndex, bg.height - actualHeight, barWidth, actualHeight);
                }
                if (rainbowmove) {
                    time += rainbowmovespeed;
                }
            }
        } else {
            if (audiobarRGB && audioArray) {
                let barWidth = bg.width / 128;
                let scaleFactor = aurgbhigh;
                rgbbg.fillStyle = 'rgb(' + aurgbcolor + ')';

                // 初始化 smoothedAudioArray，如果不存在
                if (!window.smoothedAudioArray || window.smoothedAudioArray.length !== audioArray.length) {
                    window.smoothedAudioArray = new Array(audioArray.length).fill(0);
                }

                // 更新 smoothedAudioArray 值
                for (let i = 0; i < audioArray.length; ++i) {
                    window.smoothedAudioArray[i] += (audioArray[i] - window.smoothedAudioArray[i]) * 0.1;
                }

                for (let i = 0; i < audioArray.length; ++i) {
                    let channelIndex = i % 64;
                    if (i >= 64) {
                        channelIndex += 64;
                    }
                    let height = bg.height * Math.min(window.smoothedAudioArray[i], 1) * scaleFactor;
                    let actualHeight = Math.min(height, bg.height);
                    rgbbg.fillRect(barWidth * channelIndex, bg.height - actualHeight, barWidth, actualHeight);
                }
            }
        }

        rgbbg.restore()
        startRGB()
        if (wallpaperSettings.ledPlugin && !nextphoto && !Paused && RGB_show && (videoORimages || (sakurause || particlesRGB || audiobarRGB))) {
            if (RGBRefresh != "free") {
                setTimeout(function () {
                    requestAnimationFrame(drawbackground);
                }, RGBRefresh);
            } else {
                requestAnimationFrame(drawbackground);
            }
        }
    }

    function drawbackground() {
        if (backgroundRGB) {
            if (videoORimages) {
                let video = document.getElementById('myvideo')
                if (!video.paused && !video.ended) {
                    rgbbg.drawImage(video, 0, 0, 100, 20);
                    drawLayer();
                    Frist = false;
                }
            } else {
                let img = new Image()
                img.src = src;
                img.onload = function () {
                    if (Frist == true) {
                        setTimeout(function () {
                            rgbbg.drawImage(img, 0, 0, 100, 20);
                            drawLayers();
                            Frist = false;
                        }, 500);
                    } else {
                        rgbbg.drawImage(img, 0, 0, 100, 20);
                        drawLayers();
                        Frist = false;
                    }
                }
            }
        } else {
            rgbbg.clearRect(0, 0, 100, 20);
            drawLayers();
        }
    }
    //drawLayers()
    requestAnimationFrame(drawbackground);
}
