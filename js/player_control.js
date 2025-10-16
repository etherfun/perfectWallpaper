//msct

let Color_pickup_method
let thumbnail
let thumbnailcolor
let fontcolor
let duration = 0
let position = 0
let player_now


let singtitle
let singartist
let singalbumTitle
let aubarstop
var colorGroup

var player_control_color;
var player_control_blurcolor_show;
var player_control_blurcolor;
var player_control_yakeli_show;
var player_control_yakeli;
var player_control_yakelicolor;
var player_control_bluryakeli;
var player_control_sizeX_show;
var player_control_show = false;
var player_control_yakelibgusetb = 1;
var player_control_fontusetb = 5;
var player_control_roundedcorners;
var player_control_thumbnailrorl = false;
var player_control_samealbumTitle = false;
var player_control_thumbnail_size = true;
var player_control_thumbnail_size_value = 100;
var player_control_size_value;
var player_control_thumbnail_size_value

var player_control_barline
var player_control_scalefactor
var player_control_visualaudiobar
var player_control_hdong = 0.1
var player_control_thumbnail_rotation
var player_control_thumbnail_rotation_speed

var player_control = document.querySelector("#player_control")
var player_control_background = document.querySelector("#player_control .background")
var player_control_thumbnail = document.querySelector("#player_control .thumbnail")
var player_control_thumbnailWrap = document.querySelector("#player_control .thumbnail-wrap")
var player_control_info = document.querySelector("#player_control .info")
var player_control_title = document.querySelector("#player_control .title")
var player_control_artist = document.querySelector("#player_control .artist")
var player_control_albumTitle = document.querySelector("#player_control .albumTitle")
var player_control_timeline = document.querySelector("#player_control .progress-bar")
var player_control_aubar = document.querySelector("#player_control .aubar")

/*msct封面*/
window.wallpaperRegisterMediaThumbnailListener(wallpaperMediaThumbnailListener)
function wallpaperMediaThumbnailListener(event) {
    if (event && player_control_show) {
        player_control_thumbnail.src = event.thumbnail;

        const img = document.querySelector("#player_control .thumbnail")
        img.onload = function () {
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(player_control_thumbnail, 3);

            colorGroup = [
                [
                    hexToRgb(event.primaryColor),
                    hexToRgb(event.secondaryColor),
                    hexToRgb(event.tertiaryColor),
                    hexToRgb(event.highContrastColor),
                ],
                [
                    colorThief.getColor(player_control_thumbnail),
                    palette[0],
                    palette[1],
                    palette[2]
                ],
                player_control_yakelicolor,
                player_control_color
            ];

            setTimeout(function () {
                thumbnailsue()
            }, 50)
        }
    }
}


/*msct进度*/
window.wallpaperRegisterMediaTimelineListener(wallpaperMediaTimelineListener);
let timelineTimer = null;
let currentPosition = 0;
let waitingForData = false;

function wallpaperMediaTimelineListener(event) {
    const { position, duration } = event;

    waitingForData = false;

    currentPosition = position;

    if (timelineTimer) {
        clearTimeout(timelineTimer);
        timelineTimer = null;
    }

    function updateTimeline() {
        if (waitingForData) return;

        if (
            player_now === window.wallpaperMediaIntegration.PLAYBACK_STOPPED ||
            player_now === window.wallpaperMediaIntegration.PLAYBACK_PAUSED
        ) {
            timelineTimer = setTimeout(updateTimeline, 500);
            return;
        }

        currentPosition += 0.1;
        if (currentPosition >= duration) {
            currentPosition = duration;
            waitingForData = true;
        }

        const progressPercent = (currentPosition / duration) * 100;
        player_control_timeline.style.width = progressPercent + "%";

        if (!waitingForData) {
            timelineTimer = setTimeout(updateTimeline, 100);
        } else {
            timelineTimer = null;
        }
    }

    updateTimeline();
}


/*msct监听*/
window.wallpaperRegisterMediaPropertiesListener(wallpaperMediaPropertiesListener)
function wallpaperMediaPropertiesListener(event) {
    if (event) {
        singtitle = event.title
        singartist = event.artist
        singalbumTitle = event.albumTitle
        aubarstop = true

        player_control_aubar.width = 0
        player_control_aubar.height = 0
        if (player_control_show == true && (singtitle && singtitle !== '')) player_control.style.display = 'flex'
    }
    if (!player_control_show || singtitle == undefined || singtitle == '') return

    playertitle()
    if (player_control_visualaudiobar) pc_aubar()
    //setTimeout(pc_aubar,100)
}

function playertitle() {
    if (player_control_thumbnailrorl == false) {
        var player_control_title = document.querySelector("#player_control .title .left")
        var player_control_artist = document.querySelector("#player_control .artist .left")
        var player_control_albumTitle = document.querySelector("#player_control .albumTitle .left")
        var elements = document.querySelectorAll("#player_control .right");
        for (var i = 0; i < elements.length; i++) {
            elements[i].innerHTML = '';
        }
    } else {
        var player_control_title = document.querySelector("#player_control .title .right")
        var player_control_artist = document.querySelector("#player_control .artist .right")
        var player_control_albumTitle = document.querySelector("#player_control .albumTitle .right")
        var elements = document.querySelectorAll("#player_control .left")
        for (var i = 0; i < elements.length; i++) {
            elements[i].innerHTML = ''
        }
    }

    player_control_title.innerHTML = singtitle
    player_control_artist.innerHTML = singartist
    player_control_albumTitle.innerHTML = singalbumTitle
    if (singalbumTitle != singtitle || player_control_samealbumTitle == true) {
        document.querySelector("#player_control .albumTitle").style.display = ''
    } else {
        document.querySelector("#player_control .albumTitle").style.display = 'none'
    }
}


/*msct状态*/
window.wallpaperRegisterMediaPlaybackListener(wallpaperMediaPlaybackListener)
let = player_now
function wallpaperMediaPlaybackListener(event) {
    if (event) player_now = event.state

    if (player_control_show) {
        if ((event.state == window.wallpaperMediaIntegration.PLAYBACK_PLAYING) || (event.state == window.wallpaperMediaIntegration.PLAYBACK_PAUSED)) {
            player_control.style.display = "flex";
        } else {
            player_control.style.display = "none";
        }
    }

    if (!player_control_thumbnail_rotation) return;

    if (event.state == window.wallpaperMediaIntegration.PLAYBACK_STOPPED || event.state == window.wallpaperMediaIntegration.PLAYBACK_PAUSED) {
        // 暂停动画但保持当前位置
        player_control_thumbnail.style.animationPlayState = 'paused';
    } else {
        player_control_thumbnail.style.borderRadius = '50%';
        // 确保动画定义存在
        if (!player_control_thumbnail.style.animation.includes('spin')) {
            player_control_thumbnail.style.animation = `spin ${player_control_thumbnail_rotation_speed}s linear infinite`;
        }
        // 继续动画
        player_control_thumbnail.style.animationPlayState = 'running';
    }
}

function thumbnailsue() {
    if (player_control_yakelibgusetb !== 5) {
        thumbnailcolor = colorGroup[Color_pickup_method - 1][player_control_yakelibgusetb - 1];
    } else {
        thumbnailcolor = player_control_yakelicolor
    }

    if (player_control_fontusetb !== 5) {
        fontcolor = colorGroup[Color_pickup_method - 1][player_control_fontusetb - 1];
    } else {
        fontcolor = player_control_color
    }

    player_control_background.style.background = "rgba(" + thumbnailcolor + "," + player_control_yakeli + ")"
    player_control_info.style.color = "rgb(" + fontcolor + ")"
    player_iconcolor(fontcolor)
    player_control_timeline.style.backgroundColor = "rgb(" + fontcolor + ")"
    document.querySelector('.timeline').style.backgroundColor = "rgba(" + [255,255,255] + "," + (player_control_yakeli + 0.4) + ")"
}

function player_iconcolor(rgb) {
    var player_control_titleicon = document.querySelector("#player_control .titleicon")
    var player_control_artisticon = document.querySelector("#player_control .artisticon")
    var player_control_albumTitleicon = document.querySelector("#player_control .albumTitleicon")

    var filter = 'drop-shadow(0 10240px ' + 'rgb(' + rgb + '))'
    player_control_titleicon.style.filter = filter;
    player_control_artisticon.style.filter = filter;
    player_control_albumTitleicon.style.filter = filter;
}

function pc_aubar() {
    var full = document.querySelector("#player_control .info-container");
    var usage = document.querySelector("#player_control .info");

    var aubar = document.querySelector(".aubar");
    var rgbbg = document.querySelector(".aubar").getContext('2d');

    var height = full.clientHeight - usage.clientHeight;
    var width = full.clientWidth;

    aubar.width = width;
    aubar.height = height;

    aubarstop = false;

    var previousHeights = new Array(64).fill(aubar.height);
    var barHeights = new Array(64).fill(0);

    function lerp(start, end, amount) {
        return (1 - amount) * start + amount * end;
    }

    function draw() {
        rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        var barWidth = aubar.width / 64;
        rgbbg.fillStyle = 'rgb(' + fontcolor + ')';

        for (var i = 0, l = 64; i < 64; ++i, ++l) {
            var bar = (audioArray[i] + audioArray[l]) / 2;
            var targetHeight = aubar.height * Math.min(bar, 1) * player_control_scalefactor;
            var actualHeight = Math.min(targetHeight, aubar.height);

            barHeights[i] = lerp(barHeights[i], actualHeight, player_control_hdong);

            rgbbg.fillRect(barWidth * i, aubar.height - barHeights[i], barWidth, barHeights[i]);
        }

        if (!aubarstop && player_control_visualaudiobar && player_now.state !== 0) {
            requestAnimationFrame(draw);
        } else {
            rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        }
    }

    function drawline() {
        rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        rgbbg.lineWidth = 2;
        rgbbg.strokeStyle = 'rgb(' + fontcolor + ')';
        var spacing = aubar.width / 64;

        rgbbg.beginPath();

        var x, y, prevX, prevY;
        var cornerRadius = 4;
        for (var i = 0, l = 64; i < 64; ++i, ++l) {
            var amplitude = (audioArray[i] + audioArray[l]) / 2;
            var targetHeight = aubar.height - aubar.height * Math.min(amplitude, 1) * player_control_scalefactor;

            targetHeight = Math.max(0, Math.min(targetHeight, aubar.height));

            previousHeights[i] = lerp(previousHeights[i], targetHeight, player_control_hdong);

            x = spacing * i;
            y = previousHeights[i];

            if (i === 0) {
                rgbbg.moveTo(x, y);
            } else {
                prevX = spacing * (i - 1);
                prevY = previousHeights[i - 1];

                var dx = x - prevX;
                var dy = y - prevY;
                var distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > cornerRadius * 2) {
                    var controlX = prevX + (x - prevX) / 2;
                    var controlY = prevY + (y - prevY) / 2;

                    rgbbg.quadraticCurveTo(prevX, prevY, controlX, controlY);
                    rgbbg.quadraticCurveTo(controlX, controlY, x, y);
                } else {
                    rgbbg.lineTo(x, y);
                }
            }
        }
        rgbbg.stroke();
        if (!aubarstop && player_control_visualaudiobar && player_now.state !== 0) {
            requestAnimationFrame(drawline);
        } else {
            rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        }
    }

    if (player_control_visualaudiobar && player_control_barline == 2) {
        drawline()
    } else if (player_control_visualaudiobar && player_control_barline == 1) {
        draw();
    } else {
        return;
    }
}

