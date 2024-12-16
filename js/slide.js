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
				if(RGB_show){
					nextphoto = true
					setTimeout(function(){
						background2canvas(src,false)
						nextphoto =false
					},100) 
				}
			}
            break;
        case 2://随机模式
			//关闭视频
			myvideo.src = null;
			if(myList.length){
				//$.backstretch('file:///' + currentImg, {fade: 1000});
				document.body.style.backgroundImage = "url('"+'file:///' + currentImg + "')";
				//TransitionSwith('file:///' + currentImg);
			}else{
				$.backstretch("destroy", false);
				document.body.style.backgroundImage = "url('imgs/1.jpg')";
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
			//$.backstretch("destroy", false);
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
					//TransitionSwith(img.src);
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
			//$.backstretch("destroy", false);
			// 关闭视频
			myvideo.src = null;
			var timestamp = new Date().getTime();
		
			var img = new Image();  
			img.src = "https://picsum.photos/3840/2160?random=" + timestamp;    
			
			img.onload = function() {  
				//TransitionSwith(img.src);
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
			//$.backstretch("destroy", false);  
			// 关闭视频  
			myvideo.src = null;  
			 
			$.get(chiyuanapi, function (getchiyuan) {  

				var img = new Image();  
				img.src = getchiyuan;
			
				img.onload = function() {  
					//TransitionSwith(img.src);
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
			//$.backstretch("destroy", false);
			// 关闭视频
			myvideo.src = null;

			switch(galaxyapi){
				case 2:
					$.get("https://apod.nasa.gov/", function (get) {
				
						var url = "https://apod.nasa.gov/apod/" + $(get).find("img").attr("src")
						
						var $html = $('<div>').html(get);
						var title = $html.find('b').first().text();
						var author = $html.find('a').eq(2).text();
						var explanation = $html.find('p').eq(2).text();
						picturesinfo_showrl(title,author,"",explanation)
						do1(url)
				})
				break;
				case 1:
					$.get("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true", function(get){
						console.log(JSON.stringify(get));

						if(get.media_type == "video"){
							var url = get.thumbnail_url
						}else{
							var url = get.hdurl
						}

						var copyright
						if(get.copyright == undefined){copyright = ""}else{copyright = get.copyright}
						picturesinfo_showrl(get.title,copyright,"",get.explanation)
					
						do1(url)
					})
				break;
			}
			
			function do1(url){
				var img = new Image();
				img.src = url
				img.onload = function () {
					//TransitionSwith(img.src);
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
		case 8://windows聚焦
			if(picturesinfo_show && pictures.picture_info.style.display == "none"){
				pictures.picture_info.style.display = "flex"
			}
			// 关闭幻灯片特效
			//$.backstretch("destroy", false);
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
					//TransitionSwith(img.src);
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


function TransitionSwith(){
	switch (TransitionMode){
		case 0:
			switch (TransitionMode_choose_0){
			    case 0: document.body.style.transition = "background-image 1s linear 0s"; break;
				case 1: document.body.style.transition = "background-image 1s linear(0 0%, 0.22 2.1%, 0.86 6.5%, 1.11 8.6%, 1.3 10.7%, 1.35 11.8%, 1.37 12.9%, 1.37 13.7%, 1.36 14.5%, 1.32 16.2%, 1.03 21.8%, 0.94 24%, 0.89 25.9%, 0.88 26.85%, 0.87 27.8%, 0.87 29.25%, 0.88 30.7%, 0.91 32.4%, 0.98 36.4%, 1.01 38.3%, 1.04 40.5%, 1.05 42.7%, 1.05 44.1%, 1.04 45.7%, 1 53.3%, 0.99 55.4%, 0.98 57.5%, 0.99 60.7%, 1 68.1%, 1.01 72.2%, 1 86.7%, 1 100%) 0s"; break;
				case 2: document.body.style.transition = "background-image 1s linear(0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%, 0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%, 0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%, 0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%, 0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%) 0s"; break;
				case 3: document.body.style.transition = "background-image 1s linear(0 0%, 0 1.8%, 0.01 3.6%, 0.03 6.35%, 0.07 9.1%, 0.13 11.4%, 0.19 13.4%, 0.27 15%, 0.34 16.1%, 0.54 18.35%, 0.66 20.6%, 0.72 22.4%, 0.77 24.6%, 0.81 27.3%, 0.85 30.4%, 0.88 35.1%, 0.92 40.6%, 0.94 47.2%, 0.96 55%, 0.98 64%, 0.99 74.4%, 1 86.4%, 1 100%) 0s"; break;
			}
			break;
		case 1:
			switch (TransitionMode_choose_1) {
			    case 0: document.body.style.transition = "background-image 1s ease-in-out 0s"; break;
				case 1: document.body.style.transition = "background-image 1s cubic-bezier(0.45, 0.05, 0.55, 0.95) 0s"; break;
				case 2: document.body.style.transition = "background-image 1s cubic-bezier(0.46, 0.03, 0.52, 0.96) 0s"; break;
				case 3: document.body.style.transition = "background-image 1s cubic-bezier(0.65, 0.05, 0.36, 1) 0s"; break;
				case 4: document.body.style.transition = "background-image 1s cubic-bezier(0.4, 0, 0.2, 1) 0s"; break;
			}
			break;
		case 2:
			document.body.style.transition = "background-image 1s ease-in 0s"; break;
		case 3:
			document.body.style.transition = "background-image 1s ease-out 0s"; break;
		case 4:
			document.body.style.transition = TransitionMode_choose_4; break;
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
	document.querySelector("#picture_info .description").innerHTML = null
}
		