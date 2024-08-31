//msct


let Color_pickup_method = 1
let thumbnail
let thumbnailcolor
let thumbnailsecondColor
let thumbnailtextColor
let thumbnailthirdcolor
let thumbnailhighContrastColor
let duration = 0
let position = 0

let singtitle
let singartist
let singalbumTitle

var player_control = document.querySelector("#player_control")
var player_control_background = document.querySelector("#player_control .background")
var player_control_thumbnail = document.querySelector("#player_control .thumbnail")
var player_control_info = document.querySelector("#player_control .info")
var player_control_title = document.querySelector("#player_control .title")
var player_control_artist = document.querySelector("#player_control .artist")
var player_control_albumTitle = document.querySelector("#player_control .albumTitle")
var player_control_timeline = document.querySelector("#player_control .progress-bar")

/*msct封面*/
window.wallpaperRegisterMediaThumbnailListener(wallpaperMediaThumbnailListener)
function wallpaperMediaThumbnailListener(event){
    thumbnail = event.thumbnail

    thumbnailcolor = hexToRgb(event.primaryColor)
    thumbnailsecondColor = hexToRgb(event.secondaryColor)
    thumbnailthirdcolor = hexToRgb(event.tertiaryColor)
    thumbnailtextColor = hexToRgb(event.textColor)
    thumbnailhighContrastColor = hexToRgb(event.highContrastColor)

    if(player_control_show == true){thumbnailsue()}
}


/*msct进度*/
/*window.wallpaperRegisterMediaTimelineListener(wallpaperMediaTimelineListener)
function wallpaperMediaTimelineListener(event) {  
    let position = event.position;
    let duration = event.duration;
    let currentPosition = position;

    console.log("当前" + position + "共" + duration);
  
    function updateTimeline() {  
        if (player_playback == 2 || 
            player_playback == 0 ) {  
        } else {  
            currentPosition += 0.1; 
        }

        let progressPercent = (currentPosition / duration) * 100;
        player_control_timeline.style.width = progressPercent + '%';

        if (currentPosition < duration) {
            timer = setTimeout(updateTimeline, 100);
        } else {
            currentPosition = 0;
        }
        console.log(currentPosition)
    }  
  
    updateTimeline(); 
}*/

/*msct监听*/
window.wallpaperRegisterMediaPropertiesListener(wallpaperMediaPropertiesListener)
function wallpaperMediaPropertiesListener(event){

    singtitle = event.title
    singartist = event.artist
    singalbumTitle = event.albumTitle
    playertitle()
}

function playertitle(){
    if(player_control_thumbnailrorl == false){
        var player_control_title = document.querySelector("#player_control .title .left")
        var player_control_artist = document.querySelector("#player_control .artist .left")
        var player_control_albumTitle = document.querySelector("#player_control .albumTitle .left")
        var elements = document.querySelectorAll("#player_control .right");  
        for (var i = 0; i < elements.length; i++) {  
            elements[i].innerHTML = '';  
        }
    }else{
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
    if(singalbumTitle != singtitle || player_control_samealbumTitle == true){
        document.querySelector("#player_control .albumTitle").style.display = ''
    }else{
        document.querySelector("#player_control .albumTitle").style.display = 'none'
    }
}


/*msct状态*/
window.wallpaperRegisterMediaPlaybackListener(wallpaperMediaPlaybackListener)
function wallpaperMediaPlaybackListener(event){
    if((player_control_show == true) && ((event.state == window.wallpaperMediaIntegration.PLAYBACK_PLAYING) || (event.state == window.wallpaperMediaIntegration.PLAYBACK_PAUSED))){
        player_control.style.display = "flex"
    }else{
        player_control.style.display = "none"
    }
}

function thumbnailsue(){

    player_control_thumbnail.style.backgroundImage = "url(" + thumbnail + ")"

    switch(Color_pickup_method){
        case 1 :
            switch (player_control_yakelibgusetb) {
                case 1:
                    player_control_background.style.background = "rgba("+thumbnailcolor+","+player_control_yakeli+")"
                    break;
                case 2:
                    player_control_background.style.background = "rgba("+thumbnailsecondColor+","+player_control_yakeli+")"
                    break;
                case 3:
                    player_control_background.style.background = "rgba("+thumbnailthirdcolor+","+player_control_yakeli+")"
                    break
                case 4:
                    player_control_background.style.background = "rgba("+thumbnailtextColor+","+player_control_yakeli+")"
                   break
                case 5:
                    player_control_background.style.background = "rgba("+player_control_yakelicolor+","+player_control_yakeli+")"
                    break
            }
    
            switch (player_control_fontusetb) {
                case 1:
                    player_control_info.style.color = "rgb("+thumbnailcolor+")"

                    player_iconcolor(thumbnailcolor)
                    break;
                case 2:
                    player_control_info.style.color = "rgb("+thumbnailsecondColor+")"
                    player_iconcolor(thumbnailsecondColor)
                    break;
                case 3:
                    player_control_info.style.color = "rgb("+thumbnailthirdcolor+")"
                    player_iconcolor(thumbnailthirdcolor)
                    break
                case 4:
                    player_control_info.style.color = "rgb("+thumbnailtextColor+")"
                    player_iconcolor(thumbnailtextColor)
                    break
                case 5:
                    player_control_info.style.color = 'rgb('+player_control_color+')'
                    player_iconcolor(player_control_color)
                    break
            }
            break;
        case 2 :
            const colorThief = new ColorThief();
            let img = player_control_thumbnail

            thumbnailcolor = hexToRgb(colorThief.getColor(img))
            thumbnailsecondColor = hexToRgb(colorThief.getPalette(img)[0])
            thumbnailthirdcolor = hexToRgb(colorThief.getPalette(img)[1])

            switch (player_control_yakelibgusetb) {
                case 1:
                    player_control_background.style.background = "rgba("+thumbnailcolor+","+player_control_yakeli+")"
                    break;
                case 2:
                    player_control_background.style.background = "rgba("+thumbnailsecondColor+","+player_control_yakeli+")"
                    break;
                case 3:
                    player_control_background.style.background = "rgba("+thumbnailthirdcolor+","+player_control_yakeli+")"
                    break
                case 4:
                    player_control_background.style.background = "rgba("+thumbnailtextColor+","+player_control_yakeli+")"
                   break
                case 5:
                    player_control_background.style.background = "rgba("+player_control_yakelicolor+","+player_control_yakeli+")"
                    break
            }
    
            switch (player_control_fontusetb) {
                case 1:
                    player_control_info.style.color = "rgb("+thumbnailcolor+")"

                    player_iconcolor(thumbnailcolor)
                    break;
                case 2:
                    player_control_info.style.color = "rgb("+thumbnailsecondColor+")"
                    player_iconcolor(thumbnailsecondColor)
                    break;
                case 3:
                    player_control_info.style.color = "rgb("+thumbnailthirdcolor+")"
                    player_iconcolor(thumbnailthirdcolor)
                    break
                case 4:
                    player_control_info.style.color = "rgb("+thumbnailtextColor+")"
                    player_iconcolor(thumbnailtextColor)
                    break
                case 5:
                    player_control_info.style.color = 'rgb('+player_control_color+')'
                    player_iconcolor(player_control_color)
                    break
            }
            break;

    }
}

/*
function playericon(){
    if(player_control_thumbnailrorl == false){
        player_control_artist.innerHTML = "<img class='artisticon' src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NDAgNTEyJz48IS0tIEZvbnQgQXdlc29tZSBQcm8gNi4wLjAtYWxwaGEyIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIC0tPjxwYXRoIGQ9J00zODkuNDE4IDM0Ny42NjRDMzU4LjgzNCAzMjAuNTc4IDMxOC43MzIgMzA0IDI3NC42NjQgMzA0SDE3My4zMzZDNzcuNjA5IDMwNCAwIDM4MS42MDIgMCA0NzcuMzMyQzAgNDk2LjQ3NyAxNS41MjMgNTEyIDM0LjY2NCA1MTJIMzU1LjE5M0MzMzMuNCA0OTMuNDMyIDMyMCA0NjguMjcgMzIwIDQ0MEMzMjAgMzk5LjA0NSAzNDguMDQxIDM2NC43MDkgMzg5LjQxOCAzNDcuNjY0Wk0yMjQgMjU2QzI5NC42OTUgMjU2IDM1MiAxOTguNjkxIDM1MiAxMjhTMjk0LjY5NSAwIDIyNCAwQzE1My4zMTIgMCA5NiA1Ny4zMDkgOTYgMTI4UzE1My4zMTIgMjU2IDIyNCAyNTZaTTYwMS43MjUgMTYwLjYzMUw1MDUuNzI1IDE3OS44MzJDNDkwLjc2OCAxODIuODI0IDQ4MCAxOTUuOTU3IDQ4MCAyMTEuMjExVjM3Mi40MDhDNDY5Ljk0NSAzNjkuNzI3IDQ1OS4yODEgMzY4IDQ0OCAzNjhDMzk0Ljk4IDM2OCAzNTIgNDAwLjIzNCAzNTIgNDQwQzM1MiA0NzkuNzY0IDM5NC45OCA1MTIgNDQ4IDUxMlM1NDQgNDc5Ljc2NCA1NDQgNDQwVjMwMC4xNzZMNjE0LjI3NSAyODYuMTIxQzYyOS4yMzIgMjgzLjEzMSA2NDAgMjY5Ljk5NiA2NDAgMjU0Ljc0MlYxOTIuMDFDNjQwIDE3MS44MTYgNjIxLjUyNSAxNTYuNjcyIDYwMS43MjUgMTYwLjYzMVonLz48L3N2Zz4='></img>" +  " " +singartist
    if(singalbumTitle != ""){
        player_control_albumTitle.innerHTML = "<img class='albumTitleicon' src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA1MTIgNTEyJz48IS0tIEZvbnQgQXdlc29tZSBQcm8gNi4wLjAtYWxwaGEyIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIC0tPjxwYXRoIGQ9J00yNTYgMTZDMTIzLjQ2MSAxNiAxNiAxMjMuNDE5IDE2IDI1NlMxMjMuNDYxIDQ5NiAyNTYgNDk2UzQ5NiAzODguNTgxIDQ5NiAyNTZTMzg4LjUzOSAxNiAyNTYgMTZaTTgwLjcxNSAyNTZINzkuNjI3QzcwLjU0OSAyNTYgNjMuMjI5IDI0Ny45OSA2NC4wNjUgMjM4LjY1OEM3Mi4zNjQgMTQ2LjAxNyAxNDYuNDkgNzIuMDYgMjM5LjI3NCA2NC4wNTVDMjQ4LjI5MSA2My4yNzggMjU2IDcwLjc5MSAyNTYgODAuMTMyVjgwLjEzMkMyNTYgODguNDgyIDI0OS43ODYgOTUuMzYzIDI0MS43MjcgOTYuMDc3QzE2NC43NDUgMTAyLjg5OCAxMDMuMTQ4IDE2NC4zNDcgOTYuMTUzIDI0MS4zNTRDOTUuNDAxIDI0OS42MzQgODguNzcxIDI1NiA4MC43MTUgMjU2Wk0yNTYgMzUyQzIwMi45NzYgMzUyIDE2MCAzMDkgMTYwIDI1NlMyMDIuOTc2IDE2MCAyNTYgMTYwUzM1MiAyMDMgMzUyIDI1NlMzMDkuMDI0IDM1MiAyNTYgMzUyWk0yNTYgMjI0QzIzOC4zMDMgMjI0IDIyNCAyMzguMjUgMjI0IDI1NlMyMzguMzAzIDI4OCAyNTYgMjg4QzI3My42OTcgMjg4IDI4OCAyNzMuNzUgMjg4IDI1NlMyNzMuNjk3IDIyNCAyNTYgMjI0WicvPjwvc3ZnPg=='></img>" +  " " +singalbumTitle
    }else{
        player_control_albumTitle.innerHTML = ""
    }
        player_control_title.innerHTML = "<img class='titleicon' src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB0PSIxNzIxNTQwMzA2MzU0IiBjbGFzcz0iaWNvbiIgdmVyc2lvbj0iMS4xIiBwLWlkPSIxNDA1Ij4KIDxnPgogIDx0aXRsZT5MYXllciAxPC90aXRsZT4KICA8cGF0aCBzdHJva2U9Im51bGwiIGQ9Im00OTkuMDk0MDIsNTkuMjUxODVsMC40OTk3Nyw0Ljg1NTRsMC4xODE3Myw0LjkwMTQzbDAsMjkyLjEwNjYzYTkwLjg2Njg4LDkyLjA0NTU3IDAgMSAxIC00NS40MTA3MiwtNzkuNzExNDdsLTAuMDIyNzIsLTEyMy44NzAzM2wtMjcyLjYwMDY0LDM5LjQ0MTUzbDAsMjEwLjE2MzA1YTkwLjg2Njg4LDkyLjA0NTU3IDAgMCAxIC04Ni4zMjM1NCw5MS45MzA1MmwtNC41NDMzNCwwLjExNTA2YTkwLjg2Njg4LDkyLjA0NTU3IDAgMSAxIDQ1LjQ1NjE2LC0xNzEuNzU3MDRsLTAuMDIyNzIsLTIyNS41MzQ2N2E2OC4xNTAxNiw2OS4wMzQxOCAwIDAgMSA1NC41MjAxMywtNjcuNjUzNWwzLjk5ODE0LC0wLjY5MDM0bDIyNy4xNjcyLC0zMi44ODMyOGE2OC4xNTAxNiw2OS4wMzQxOCAwIDAgMSA3Ny4xMDA1NSw1OC41ODcwMXptLTQwOC4yMTk0NiwzMDEuODYzNDZhNDUuNDMzNDQsNDYuMDIyNzkgMCAxIDAgMCw5Mi4wNDU1N2E0NS40MzM0NCw0Ni4wMjI3OSAwIDAgMCAwLC05Mi4wNDU1N3ptMzE4LjAzNDA4LC00Ni4wMjI3OWE0NS40MzM0NCw0Ni4wMjI3OSAwIDEgMCAwLDkyLjA0NTU3YTQ1LjQzMzQ0LDQ2LjAyMjc5IDAgMCAwIDAsLTkyLjA0NTU3em0yMi4xNDg4LC0yNjkuMDk1MjNsLTIuNjM1MTQsMC4yMzAxMWwtMjI3LjE2NzIsMzIuODgzMjhhMjIuNzE2NzIsMjMuMDExMzkgMCAwIDAgLTE5LjM3NzM2LDIwLjE1Nzk4bC0wLjEzNjMsMi42MjMzbDAsNDguNjAwMDZsMjcyLjYwMDY0LC0zOS40NDE1M2wwLC00Mi4wNDE4MmEyMi43MTY3MiwyMy4wMTEzOSAwIDAgMCAtMjMuMjg0NjQsLTIzLjAxMTM5eiIgZmlsbD0iIzAwMDAwMCIgcC1pZD0iMTQwNiIgaWQ9InN2Z18xIi8+CiAgPGxpbmUgZmlsbD0ibm9uZSIgeDE9IjM3IiB5MT0iODciIHgyPSI3NSIgeTI9IjE2MiIgaWQ9InN2Z18yIi8+CiA8L2c+Cgo8L3N2Zz4='></img>" + " " +singtitle
    }else{
        player_control_artist.innerHTML = singartist + " " + "<img class='artisticon' src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NDAgNTEyJz48IS0tIEZvbnQgQXdlc29tZSBQcm8gNi4wLjAtYWxwaGEyIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIC0tPjxwYXRoIGQ9J00zODkuNDE4IDM0Ny42NjRDMzU4LjgzNCAzMjAuNTc4IDMxOC43MzIgMzA0IDI3NC42NjQgMzA0SDE3My4zMzZDNzcuNjA5IDMwNCAwIDM4MS42MDIgMCA0NzcuMzMyQzAgNDk2LjQ3NyAxNS41MjMgNTEyIDM0LjY2NCA1MTJIMzU1LjE5M0MzMzMuNCA0OTMuNDMyIDMyMCA0NjguMjcgMzIwIDQ0MEMzMjAgMzk5LjA0NSAzNDguMDQxIDM2NC43MDkgMzg5LjQxOCAzNDcuNjY0Wk0yMjQgMjU2QzI5NC42OTUgMjU2IDM1MiAxOTguNjkxIDM1MiAxMjhTMjk0LjY5NSAwIDIyNCAwQzE1My4zMTIgMCA5NiA1Ny4zMDkgOTYgMTI4UzE1My4zMTIgMjU2IDIyNCAyNTZaTTYwMS43MjUgMTYwLjYzMUw1MDUuNzI1IDE3OS44MzJDNDkwLjc2OCAxODIuODI0IDQ4MCAxOTUuOTU3IDQ4MCAyMTEuMjExVjM3Mi40MDhDNDY5Ljk0NSAzNjkuNzI3IDQ1OS4yODEgMzY4IDQ0OCAzNjhDMzk0Ljk4IDM2OCAzNTIgNDAwLjIzNCAzNTIgNDQwQzM1MiA0NzkuNzY0IDM5NC45OCA1MTIgNDQ4IDUxMlM1NDQgNDc5Ljc2NCA1NDQgNDQwVjMwMC4xNzZMNjE0LjI3NSAyODYuMTIxQzYyOS4yMzIgMjgzLjEzMSA2NDAgMjY5Ljk5NiA2NDAgMjU0Ljc0MlYxOTIuMDFDNjQwIDE3MS44MTYgNjIxLjUyNSAxNTYuNjcyIDYwMS43MjUgMTYwLjYzMVonLz48L3N2Zz4='></img>" 
    if(singalbumTitle != ""){
           player_control_albumTitle.innerHTML = singalbumTitle + " " + "<img class='albumTitleicon' src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA1MTIgNTEyJz48IS0tIEZvbnQgQXdlc29tZSBQcm8gNi4wLjAtYWxwaGEyIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlIChDb21tZXJjaWFsIExpY2Vuc2UpIC0tPjxwYXRoIGQ9J00yNTYgMTZDMTIzLjQ2MSAxNiAxNiAxMjMuNDE5IDE2IDI1NlMxMjMuNDYxIDQ5NiAyNTYgNDk2UzQ5NiAzODguNTgxIDQ5NiAyNTZTMzg4LjUzOSAxNiAyNTYgMTZaTTgwLjcxNSAyNTZINzkuNjI3QzcwLjU0OSAyNTYgNjMuMjI5IDI0Ny45OSA2NC4wNjUgMjM4LjY1OEM3Mi4zNjQgMTQ2LjAxNyAxNDYuNDkgNzIuMDYgMjM5LjI3NCA2NC4wNTVDMjQ4LjI5MSA2My4yNzggMjU2IDcwLjc5MSAyNTYgODAuMTMyVjgwLjEzMkMyNTYgODguNDgyIDI0OS43ODYgOTUuMzYzIDI0MS43MjcgOTYuMDc3QzE2NC43NDUgMTAyLjg5OCAxMDMuMTQ4IDE2NC4zNDcgOTYuMTUzIDI0MS4zNTRDOTUuNDAxIDI0OS42MzQgODguNzcxIDI1NiA4MC43MTUgMjU2Wk0yNTYgMzUyQzIwMi45NzYgMzUyIDE2MCAzMDkgMTYwIDI1NlMyMDIuOTc2IDE2MCAyNTYgMTYwUzM1MiAyMDMgMzUyIDI1NlMzMDkuMDI0IDM1MiAyNTYgMzUyWk0yNTYgMjI0QzIzOC4zMDMgMjI0IDIyNCAyMzguMjUgMjI0IDI1NlMyMzguMzAzIDI4OCAyNTYgMjg4QzI3My42OTcgMjg4IDI4OCAyNzMuNzUgMjg4IDI1NlMyNzMuNjk3IDIyNCAyNTYgMjI0WicvPjwvc3ZnPg=='></img>" 
    }else{
        player_control_albumTitle.innerHTML = ""
    }
        player_control_title.innerHTML = singtitle + " " + "<img class='titleicon' src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB0PSIxNzIxNTQwMzA2MzU0IiBjbGFzcz0iaWNvbiIgdmVyc2lvbj0iMS4xIiBwLWlkPSIxNDA1Ij4KIDxnPgogIDx0aXRsZT5MYXllciAxPC90aXRsZT4KICA8cGF0aCBzdHJva2U9Im51bGwiIGQ9Im00OTkuMDk0MDIsNTkuMjUxODVsMC40OTk3Nyw0Ljg1NTRsMC4xODE3Myw0LjkwMTQzbDAsMjkyLjEwNjYzYTkwLjg2Njg4LDkyLjA0NTU3IDAgMSAxIC00NS40MTA3MiwtNzkuNzExNDdsLTAuMDIyNzIsLTEyMy44NzAzM2wtMjcyLjYwMDY0LDM5LjQ0MTUzbDAsMjEwLjE2MzA1YTkwLjg2Njg4LDkyLjA0NTU3IDAgMCAxIC04Ni4zMjM1NCw5MS45MzA1MmwtNC41NDMzNCwwLjExNTA2YTkwLjg2Njg4LDkyLjA0NTU3IDAgMSAxIDQ1LjQ1NjE2LC0xNzEuNzU3MDRsLTAuMDIyNzIsLTIyNS41MzQ2N2E2OC4xNTAxNiw2OS4wMzQxOCAwIDAgMSA1NC41MjAxMywtNjcuNjUzNWwzLjk5ODE0LC0wLjY5MDM0bDIyNy4xNjcyLC0zMi44ODMyOGE2OC4xNTAxNiw2OS4wMzQxOCAwIDAgMSA3Ny4xMDA1NSw1OC41ODcwMXptLTQwOC4yMTk0NiwzMDEuODYzNDZhNDUuNDMzNDQsNDYuMDIyNzkgMCAxIDAgMCw5Mi4wNDU1N2E0NS40MzM0NCw0Ni4wMjI3OSAwIDAgMCAwLC05Mi4wNDU1N3ptMzE4LjAzNDA4LC00Ni4wMjI3OWE0NS40MzM0NCw0Ni4wMjI3OSAwIDEgMCAwLDkyLjA0NTU3YTQ1LjQzMzQ0LDQ2LjAyMjc5IDAgMCAwIDAsLTkyLjA0NTU3em0yMi4xNDg4LC0yNjkuMDk1MjNsLTIuNjM1MTQsMC4yMzAxMWwtMjI3LjE2NzIsMzIuODgzMjhhMjIuNzE2NzIsMjMuMDExMzkgMCAwIDAgLTE5LjM3NzM2LDIwLjE1Nzk4bC0wLjEzNjMsMi42MjMzbDAsNDguNjAwMDZsMjcyLjYwMDY0LC0zOS40NDE1M2wwLC00Mi4wNDE4MmEyMi43MTY3MiwyMy4wMTEzOSAwIDAgMCAtMjMuMjg0NjQsLTIzLjAxMTM5eiIgZmlsbD0iIzAwMDAwMCIgcC1pZD0iMTQwNiIgaWQ9InN2Z18xIi8+CiAgPGxpbmUgZmlsbD0ibm9uZSIgeDE9IjM3IiB5MT0iODciIHgyPSI3NSIgeTI9IjE2MiIgaWQ9InN2Z18yIi8+CiA8L2c+Cgo8L3N2Zz4='></img>" 
    }
    
}*/

function player_iconcolor(rgb) {
    var player_control_titleicon = document.querySelector("#player_control .titleicon")
    var player_control_artisticon = document.querySelector("#player_control .artisticon")
    var player_control_albumTitleicon = document.querySelector("#player_control .albumTitleicon")

    var filter = 'drop-shadow(0 10240px ' + 'rgb(' + rgb + '))'
    player_control_titleicon.style.filter = filter;
    player_control_artisticon.style.filter = filter;
    player_control_albumTitleicon.style.filter = filter;
}

