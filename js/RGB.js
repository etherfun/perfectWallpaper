var wallpaperSettings = {
    ledPlugin: false,
    cuePlugin: false
};

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
    }
};

function getEncodedCanvasImageData(canvas) {
    var context = canvas.getContext('2d');
    var imageData = context.getImageData(0, 0, 100, 20);
    var colorArray = [];

    for (var d = 0; d < imageData.data.length; d += 4) {
        var write = d / 4 * 3;
        colorArray[write] = imageData.data[d];
        colorArray[write + 1] = imageData.data[d + 1];
        colorArray[write + 2] = imageData.data[d + 2];
    }
    return String.fromCharCode.apply(null, colorArray);
}

// Only execute this logic if the LED plugin has actually been loaded
function startRGB() {
    const canvas = document.getElementById('RGBuse');
    var encodedImageData = getEncodedCanvasImageData(canvas);
    window.wpPlugins.led.setAllDevicesByImageData(encodedImageData, canvas.width, canvas.height);
}


let videoIntervalId
  
function background2canvas(src, videoORimages) {  
    var rgbbg = document.querySelector('#RGBuse')
    var ctx = rgbbg.getContext('2d')
    
  
    if (!videoORimages) {  
        clearInterval(videoIntervalId)
        videoIntervalId = null
    }  
  
    if (videoORimages) {  
        var video = document.getElementById('myvideo')
        videoIntervalId = setInterval(function() {  
            if (!video.paused && !video.ended) {  
                ctx.clearRect(0,0,100,20)
                ctx.drawImage(video,0,0,100,20)
                startRGB()
            }  
        }, RGBRefreshTiming());
    } else {  
        var img = new Image() 
        img.src = src
        img.onload = function(){
            setTimeout(function(){
                ctx.drawImage(img,0,0,100,20)
            startRGB()
            },200)
        }
    }  
}  

function RGBRefreshTiming(){
    switch(RGBRefresh){
        case 24:
            return 41
            
        case 30:
            return 33

        case 45:
            return 22

        case 60:
            return 16
    }
}

let sakuraIntervalId

function sakuraccanvas(){
    var sakura = document.getElementById('sakura')
    var gl = sakura.getContext("webgl")
    var rgbbg = document.querySelector('#RGBuse').getContext('2d')

    
    sakuraIntervalId = setInterval(function(){
        if((sakura.width == window.screen.width) && (sakura.height == window.screen.height)){
            rgbbg.drawImage(sakura,0,0,sakura.width,sakura.height,0,0,100,20)
        }
    },RGBRefreshTiming())
    
}
setTimeout(sakuraccanvas,10000)