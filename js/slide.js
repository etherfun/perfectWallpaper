/**
 * Created by xtong on 2017/5/6 0006.
 */

// 幻灯片实现代码

var RGBuse = document.querySelector("#RGBuse")
var pictures = {
	picture_info : document.querySelector("#picture_info"),
	info : document.querySelector("#picture_info .info"),
	title : document.querySelector("#picture_info .title"),
	author : document.querySelector("#picture_info .author"),
	where : document.querySelector("#picture_info .location"),
	text : document.querySelector("#picture_info .description")
}

var t

/** 更新播放列表 */
function updateFileList(currentFiles) {
    // 列入播放列表
    for (var i = 0; i < currentFiles.length; ++i) {
        if(myList.indexOf(currentFiles[i]) === -1){
            myList.push(currentFiles[i]);
        }
    }
}

/** 计算切换周期 **/
var calculate = function(t){
    var res = 1;
    switch (t){
		case 0.5:
			res = 30
			break
        case 1:
            // 1min
            res = 60;
            break;
        case 2:
            // 5min
            res = 5*60;
            break;
        case 3:
            // 10min
            res = 10*60;
            break;
        case 4:
            // 30min
            res = 30*60;
            break;
        case 5:
            // 60min
            res = 60*60;
            break;
        default:

    }
    return res*1000;
};

/** 变换背景 */
function changeBackground(){

	switch (wallpapermode){
        case 1://单一壁纸模式
			shouldShow();
            break;
        case 2://随机模式
			if(myList.length){
				if(random){
					// 随机模式);
					nextImage(random);
				}else{
					// 顺序模式
					nextImage();
				};
			}else{
				shouldShow();
			};
			t = setTimeout(changeBackground,calculate(speed));
            break;
		case 3://视频模式
			shouldShow();
			break;
		case 4://Bing壁纸
			shouldShow();
			t = setTimeout(changeBackground,10800000);
			break;
		case 5://Lorem Picsum
			shouldShow();
			t = setTimeout(changeBackground,calculate(speed));
			break;
		case 6://NASA
			shouldShow();
			t = setTimeout(changeBackground,10800000);
			break;
		case 7://次元api
			shouldShow();
			t = setTimeout(changeBackground,calculate(speed));
			break;
		case 8://Windows聚焦
			shouldShow();
			t = setTimeout(changeBackground,calculate(speed));
			break
        default:
    }
	//setInterval("changeBackground()",5000);
	
}

// 顺序切or随机切换
function nextImage(rands){
    var index = -1;
	var indexNow = -1;
	//首次为空
	if (currentImg)
	{
		indexNow = myList.indexOf(currentImg);
		index = indexNow;
	}
	//是否随机
    if(rands){
		while(index == indexNow)
		{
			index = Math.floor(Math.random()*(myList.length));
		}
		currentImg = myList[index];
    }else{
		if(index+1 == myList.length){
			// 播放循环到首个图片
			currentImg = myList[0];
		}else{
			// 播放下一张图片
			currentImg = myList[index+1];
		}
	}
    shouldShow();
	//setTimeout("nextImage()",5000);
}

/** 应该展示的背景 */
function shouldShow(){

	switch (wallpapermode){
        case 1://单一壁纸模式
			//关闭幻灯片特效
			$.backstretch("destroy", false);
			//关闭视频
			myvideo.src = null;
			//document.body.style.background = "";
			document.body.style.backgroundImage = "";
            if(custom){
				document.body.style.background = "url('"+'file:///' + custom + "')";
				//RGBuse.style.background = "url('"+'file:///' + custom + "')";
				//document.body.style.backgroundImage="url('"+'file:///' + custom + "')";
			}else{
				//document.body.style.background = "url('imgs/1.jpg')";
				document.body.style.background = backgroundRoute;
				//RGBuse.style.background = backgroundRoute;
				//document.body.style.backgroundImage = "url('imgs/1.jpg')";
			}
			//设置但壁纸样式
			setBackgroundStyle();
			clearpicturesinfo()
			pictures.picture_info.style.display = "none"
			if(RGB_show){
				var src = document.body.style.backgroundImage.replace(/^url\("(.+?)"\)$/, '$1')
				background2canvas(src,false)
			}
            break;
        case 2://随机模式
			//关闭视频
			myvideo.src = null;
			if(myList.length){
				//$.backstretch('file:///' + currentImg, {fade: 1000});
				TransitionSwith();
			}else{
				$.backstretch("destroy", false);
				//document.body.style.backgroundImage = "url('imgs/1.jpg')";
				document.body.style.backgroundImage = backgroundRoute
				//RGBuse.style.backgroundImage = backgroundRoute
			}
			clearpicturesinfo()
			pictures.picture_info.style.display = "none"
			if(RGB_show){
				nextphoto = true
				setTimeout(function(){
					background2canvas(currentImg,false)
							nextphoto =false
				},100) 
			}
            break;
		case 3://视频模式
			//关闭幻灯片特效
			$.backstretch("destroy", false);
			ChangeVideoModel();
			clearpicturesinfo()
			pictures.picture_info.style.display = "none"
			if(RGB_show){
				nextphoto = true
				setTimeout(function(){
					background2canvas(null,true)
					nextphoto = false
				},100)
			}
			break;
		case 4: // Bing壁纸
			if(picturesinfo_show && pictures.picture_info.style.display == "none"){
				pictures.picture_info.style.display = "flex"
			}
			// 关闭幻灯片特效
			$.backstretch("destroy", false);
			// 关闭视频
			myvideo.src = null;

			switch(picturesinfo_language){
				case 1:
					var lga = "zh-CN"
					break
				case 2:
					var lga = "zh-TW"
					break
				case 3:
					var lga = "en-US"
					break
				case 4:
					var lga = "ja-JP"
					break
				case 5:
					var lga = "Ko_KR"
			}

			$.get("https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=" + lga, function (get) {
				console.log(JSON.stringify(get));

				var title = get.images[0].title
				var text = ""
				var copyright = ""
				var where = ""
				const match = get.images[0].copyright.match(/\(([^)]+)\)/);  
				if (match) {   
			    	copyright = match[1];  
			    	where = get.images[0].copyright.replace(/\(([^)]+)\)/, '').trim();  
				}  
				picturesinfo_showrl(title,copyright,where,text)

				var bingurl = 'https://www.bing.com' + get.images[0].urlbase;
				var img = new Image();
				img.src = bingurl + "_UHD.jpg";
	
				img.onload = function () {
					document.body.style.backgroundImage = "url('" + img.src + "')";
				
					if(RGB_show){
						nextphoto = true
						setTimeout(function(){
							background2canvas(img.src,false)
							nextphoto =false
						},100) 
					}
					setBackgroundStyle();
				};
			});
			break;
		case 5: // Lorem Picsum
			// 关闭幻灯片特效
			$.backstretch("destroy", false);
			// 关闭视频
			myvideo.src = null;
			var timestamp = new Date().getTime();
		
			var img = new Image();  
			img.src = "https://picsum.photos/3840/2160?random=" + timestamp;    
			
			img.onload = function() {  
				
				document.body.style.backgroundImage = "url(" + img.src + ")";

				if(RGB_show){
					nextphoto = true
						setTimeout(function(){
							background2canvas(img.src,false)
							nextphoto =false
						},100) 
				}
				setBackgroundStyle();  
			};  
			clearpicturesinfo()
			pictures.picture_info.style.display = "none"
			break;
		/*case 6://星河图片api
			// 关闭幻灯片特效
			$.backstretch("destroy", false);
			// 关闭视频
			myvideo.src = null;
			var timestamp = new Date().getTime();
			  
			var img = new Image();  
			img.src = galaxyapi + timestamp;    
			 
			img.onload = function() {  
				
				document.body.style.backgroundImage = "url(" + galaxyapi + timestamp + ")";
				setBackgroundStyle();  
			};  
			break*/
		case 7: // 次元api  
			// 关闭幻灯片特效  
			$.backstretch("destroy", false);  
			// 关闭视频  
			myvideo.src = null;  
			 
			$.get(chiyuanapi, function (getchiyuan) {  
				var url = JSON.parse(getchiyuan).url

				var img = new Image();  
				img.src = url;
			
				img.onload = function() {  
					  
					document.body.style.backgroundImage = "url('" + img.src + "')";  

					if(RGB_show){
						nextphoto = true
						setTimeout(function(){
							background2canvas(img.src,false)
							nextphoto =false
						},100) 
					}
					setBackgroundStyle();  
				};  
			});  
			clearpicturesinfo()
			pictures.picture_info.style.display = "none"
			break;
		case 6: // NASA星空
			if(picturesinfo_show && pictures.picture_info.style.display == "none"){
				pictures.picture_info.style.display = "flex"
			}
			// 关闭幻灯片特效
			$.backstretch("destroy", false);
			// 关闭视频
			myvideo.src = null;
			
			switch(galaxyapi){
				case 0:
					$.get("https://apod.nasa.gov/", function (get) {
				
					url = "https://apod.nasa.gov/apod/" + $(get).find("img").attr("src")
					use(url)
				})
				break;
				case 1:
					$.get("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true", function(get){
						console.log(JSON.stringify(get));

						if(get.media_type == "video"){
							url = get.thumbnail_url
						}else{
							url = get.hdurl
						}
						use(url)

						var copyright
						if(get.copyright == undefined){copyright = ""}else{copyright = get.copyright}
						picturesinfo_showrl(get.title,copyright,"",get.explanation)
					
					})
				break;
			}
			
			function use(url){
				var img = new Image();
				img.src = url
				img.onload = function () {
					document.body.style.backgroundImage = "url('" + img.src + "')";
					
					if(RGB_show){
						nextphoto = true
						setTimeout(function(){
							background2canvas(img.src,false)
							nextphoto =false
						},100) }
					setBackgroundStyle();
				};
			}
		break;
		case 8:
			if(picturesinfo_show && pictures.picture_info.style.display == "none"){
				pictures.picture_info.style.display = "flex"
			}
			// 关闭幻灯片特效
			$.backstretch("destroy", false);
			// 关闭视频
			myvideo.src = null;

			switch(picturesinfo_language){
				case 1:
					var lga = "zh-CN"
					break
				case 2:
					var lga = "zh-TW"
					break
				case 3:
					var lga = "en-US"
					break
				case 4:
					var lga = "ja-JP"
					break
				case 5:
					var lga = "Ko_KR"
			}
			var ctry = lga.slice(3)

			$.get("https://arc.msn.com/v3/Delivery/Placement?pid=209567&fmt=json&cdm=1&pl=" + lga + "&lc=" + lga +"&ctry=" + ctry, function (get) {
				var rawjson = JSON.parse(get.batchrsp.items[0].item.replace("\\",""))

				var url = rawjson.ad.image_fullscreen_001_landscape.u
				var img = new Image();
				img.src = url;
				
				var title = rawjson.ad.hs1_cta_text.tx
				var text = rawjson.ad.hs2_title_text.tx
				var copyright = rawjson.ad.copyright_text.tx
				var where = rawjson.ad.title_text.tx
				picturesinfo_showrl(title,copyright,where,text)
				
				img.onload = function () {
					document.body.style.backgroundImage = "url('" + img.src + "')";
				
					setBackgroundStyle();
					if(RGB_show){
						nextphoto = true
						setTimeout(function(){
							background2canvas(img.src,false)
							nextphoto =false
						},100) 
					}
				};
			});
			break;
    };

	if(wallpapermode != 3 ){
		//background2canvas()
	}

};

/** 设置壁纸 */
var setBackgroundStyle = function(){
	//单壁纸样式
	switch (bgStyle){
		case 1:
			// 填充
			document.body.style.backgroundRepeat="no-repeat";
			document.body.style.backgroundSize="cover";
			document.body.style.backgroundPosition="center";
			break;
		case 2:
			// 拉伸
			//document.body.style.backgroundImage = "";
			//document.body.style.background="url('"+'file:///' + img + "')";
			document.body.style.backgroundRepeat="no-repeat";
			document.body.style.backgroundSize="100% 100%";
			document.body.style.backgroundPosition="center";
			break;
		case 3:
			// 适应
			//document.body.style.backgroundImage = "";
			//document.body.style.background="url('"+'file:///' + img + "')";
			document.body.style.backgroundRepeat="no-repeat";
			document.body.style.backgroundSize="contain";
			document.body.style.backgroundPosition="center";
			break;
		case 4:
			// 平铺
			//document.body.style.backgroundImage = "";
			//document.body.style.background="url('"+'file:///' + img + "')";
			document.body.style.backgroundRepeat="repeat";
			break;
		case 5:
			// 居中
			//document.body.style.backgroundImage = "";
			//document.body.style.background="url('"+'file:///' + img + "')";
			document.body.style.backgroundRepeat="no-repeat";
			document.body.style.backgroundPosition="center";
			break;
		case 6:
			//自由
			document.body.style.backgroundRepeat="no-repeat";
			document.body.style.backgroundSize=bgs;
			document.body.style.backgroundPosition=bgx + " " + bgy;
		default:
	}
};


var TransitionSwith = function(){
	switch (TransitionMode){
		case 1:
			$.backstretch('file:///' + currentImg, {fade: 1000})
			break;
		case 2:
			$.backstretch('file:///' + currentImg, {fadeInOut:1000})
			break;
		case 3:
			$.backstretch('file:///' + currentImg, {pushLeft: 1000})
			break;
		case 4:
			$.backstretch('file:///' + currentImg, {pushRight: 1000})
			break;
		case 5:
			$.backstretch('file:///' + currentImg, {pushUp: 1000})
			break;
		case 6:
			$.backstretch('file:///' + currentImg, {pushDown: 1000})
			break;
		case 7:
			$.backstretch('file:///' + currentImg, {coverLeft: 1000})
			break;
		case 8:
			$.backstretch('file:///' + currentImg, {coverRight: 1000})
			break;
		case 9:
			$.backstretch('file:///' + currentImg, {coverUp: 1000})
			break;
		case 10:
			$.backstretch('file:///' + currentImg, {coverDown: 1000})
			break;
		default:
	}
};

function picturesinfo_showrl(title,author,where,text){
	clearpicturesinfo()
	var text_w = document.querySelector("#picture_info .description")
	if(picturesinfo_showRorL){
		var title_w = document.querySelector("#picture_info .title .right")
		var author_w = document.querySelector("#picture_info .author .right")
		var where_w = document.querySelector("#picture_info .location .right")
	}else{
		var title_w = document.querySelector("#picture_info .title .left")
		var author_w = document.querySelector("#picture_info .author .left")
		var where_w = document.querySelector("#picture_info .location .left")
	}
	title_w.innerHTML = title
	author_w.innerHTML = author
	where_w.innerHTML = where
	text_w.innerHTML = text

}

function clearpicturesinfo(){
	document.querySelector("#picture_info .title .left").innerHTML = null
	document.querySelector("#picture_info .author .left").innerHTML = null
	document.querySelector("#picture_info .location .left").innerHTML = null
	document.querySelector("#picture_info .title .right").innerHTML = null
	document.querySelector("#picture_info .author .right").innerHTML = null
	document.querySelector("#picture_info .location .right").innerHTML = null
}
		