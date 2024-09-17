var wallpaperSettings = {
    ledPlugin: false,
    cuePlugin: false
};

var backgroundRGB
var sakuraRGB
var RGBRefresh
var RGB_show
var particlesRGB
var nextphoto
var audiobarRGB
var opacity_saRGb
var audioArray
var aurgbcolor
var aurgbhigh

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


function background2canvas(src, videoORimages){
    var Frist = true 
    var sakura = document.getElementById('sakura')
    var particles = document.getElementById('canvas-particles')
    var bg = document.getElementById('RGBuse')
    var rgbbg = document.getElementById('RGBuse').getContext('2d')

    function drawLayer(){
        var sakurause = (sakuraRGB && ((sakura.width == window.screen.width) && (sakura.height == window.screen.height)))
        
        rgbbg.save()
        rgbbg.globalAlpha = opacity_saRGb
        if(sakurause){rgbbg.drawImage(sakura,0,0,sakura.width,sakura.height,0,0,100,20)}

        rgbbg.globalAlpha = 1
        if(particlesRGB){rgbbg.drawImage(particles,0,0,particles.width,particles.height,0,0,100,20)}

        if(audiobarRGB && audioArray){
            
            var barWidth = (bg.width / 128);
            var scaleFactor = aurgbhigh;
        
            rgbbg.fillStyle = 'rgb('+ aurgbcolor +')';
      
            for (var i = 0; i < audioArray.length; ++i) {  
                var channelIndex = i % 64;
                if (i >= 64) {  
                    channelIndex += 64;
                }
                var height = bg.height * Math.min(audioArray[i], 1) * scaleFactor;  
                var actualHeight = Math.min(height, bg.height);  
                rgbbg.fillRect(barWidth * channelIndex, bg.height - actualHeight, barWidth, actualHeight);  
            }
        }  
        
        rgbbg.restore()
        startRGB()
        if(!nextphoto && !Paused && RGB_show && (videoORimages || (sakurause || particlesRGB || audiobarRGB))){
            if(RGBRefresh != "free"){
                setTimeout(function(){
                    requestAnimationFrame(drawLayers);  
                },RGBRefreshTiming())
            }else{
                requestAnimationFrame(drawLayers)
            }
        }
    }  
      
    function drawLayers() {  
        
        if(backgroundRGB){
            if(videoORimages){
                var video = document.getElementById('myvideo') 
                if(!video.paused && !video.ended){
                    rgbbg.drawImage(video,0,0,100,20)
                    drawLayer();
                    Frist =false
                }
            }else{  
                var img = new Image() 
                img.src = src
                img.onload = function(){
                    if(Frist == true){
                        setTimeout(function(){
                            rgbbg.drawImage(img,0,0,100,20)
                            drawLayer()
                            Frist =false
                        },500)
                    }else{
                        rgbbg.drawImage(img,0,0,100,20)
                        drawLayer()
                        Frist =false
                    }
                }
            }
        }else{
            rgbbg.clearRect(0,0,100,20)
            drawLayer();
        }
    }
    //drawLayers()
    requestAnimationFrame(drawLayers)
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