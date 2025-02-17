
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

var player_control_barline
var player_control_scalefactor
var player_control_visualaudiobar
var player_control_hdong = 0.1

var player_control = document.querySelector("#player_control")
var player_control_background = document.querySelector("#player_control .background")
var player_control_thumbnail = document.querySelector("#player_control .thumbnail")
var player_control_info = document.querySelector("#player_control .info")
var player_control_title = document.querySelector("#player_control .title")
var player_control_artist = document.querySelector("#player_control .artist")
var player_control_albumTitle = document.querySelector("#player_control .albumTitle")
var player_control_timeline = document.querySelector("#player_control .progress-bar")
var player_control_aubar = document.querySelector("#player_control .aubar")

/*msct封面*/
window.wallpaperRegisterMediaThumbnailListener(wallpaperMediaThumbnailListener)
function wallpaperMediaThumbnailListener(event) {
    player_control_thumbnail.src = event.thumbnail

    switch (Color_pickup_method) {
        case 1:
            switch (player_control_yakelibgusetb) {
                case 1:
                    thumbnailcolor = hexToRgb(event.primaryColor)
                    break;
                case 2:
                    thumbnailcolor = hexToRgb(event.secondaryColor)
                    break;
                case 3:
                    thumbnailcolor = hexToRgb(event.tertiaryColor)
                    break
                case 4:
                    thumbnailcolor = hexToRgb(event.highContrastColor)
                    break
                case 5:
                    thumbnailcolor = player_control_yakelicolor
                    break
            }
            switch (player_control_fontusetb) {
                case 1:
                    fontcolor = hexToRgb(event.primaryColor)
                    break;
                case 2:
                    fontcolor = hexToRgb(event.secondaryColor)
                    break;
                case 3:
                    fontcolor = hexToRgb(event.tertiaryColor)
                    break
                case 4:
                    fontcolor = hexToRgb(event.highContrastColor)
                    break
                case 5:
                    fontcolor = player_control_color
                    break
            }
            break
        case 2:
            var img = document.querySelector("#player_control .thumbnail")
            img.onload = function () {
                const colorThief = new ColorThief();

                switch (player_control_yakelibgusetb) {
                    case 1:
                        thumbnailcolor = colorThief.getColor(img)
                        break;
                    case 2:
                        thumbnailcolor = colorThief.getPalette(img, 3)[0]
                        break;
                    case 3:
                        thumbnailcolor = colorThief.getPalette(img, 3)[1]
                        break
                    case 4:
                        thumbnailcolor = colorThief.getPalette(img, 3)[2]
                        break
                    case 5:
                        thumbnailcolor = player_control_yakelicolor
                        break
                }
                switch (player_control_fontusetb) {
                    case 1:
                        fontcolor = colorThief.getColor(img)
                        break;
                    case 2:
                        fontcolor = colorThief.getPalette(img, 3)[0]
                        break;
                    case 3:
                        fontcolor = colorThief.getPalette(img, 3)[1]
                        break
                    case 4:
                        fontcolor = colorThief.getPalette(img, 3)[2]
                        break
                    case 5:
                        fontcolor = player_control_yakelicolor
                        break
                }
            }
            break
        case 3:


    }

    if (player_control_show == true) {
        setTimeout(function () {
            player_control_background.style.background = "rgba(" + thumbnailcolor + "," + player_control_yakeli + ")"
            player_control_info.style.color = "rgb(" + fontcolor + ")"
            player_iconcolor(fontcolor)
        }, 50)
    }
}


/*msct进度*/
/*window.wallpaperRegisterMediaTimelineListener(wallpaperMediaTimelineListener)
function wallpaperMediaTimelineListener(event) {  
    var position = event.position;
    var duration = event.duration;
    var currentPosition = position;

    function updateTimeline() {  
        if(player_now == window.wallpaperMediaIntegration.PLAYBACK_STOPPED || player_now == window.wallpaperMediaIntegration.PLAYBACK_PAUSED) {  

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
    
    console.log("当前" + position + "共" + duration);
    updateTimeline(); 
}*/

/*msct监听*/
window.wallpaperRegisterMediaPropertiesListener(wallpaperMediaPropertiesListener)
function wallpaperMediaPropertiesListener(event) {

    singtitle = event.title
    singartist = event.artist
    singalbumTitle = event.albumTitle
    aubarstop = true
    playertitle()
    player_control_aubar.width = 0
    player_control_aubar.height = 0
    pc_aubar()
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
function wallpaperMediaPlaybackListener(event) {
    player_now = event.state
    if ((player_control_show == true) && ((event.state == window.wallpaperMediaIntegration.PLAYBACK_PLAYING) || (event.state == window.wallpaperMediaIntegration.PLAYBACK_PAUSED))) {
        player_control.style.display = "flex"
    } else {
        player_control.style.display = "none"
    }
    /*if(player_now == window.wallpaperMediaIntegration.PLAYBACK_PLAYING){
        wallpaperMediaTimelineListener(null)
    }*/
}

function thumbnailsue() {

    //player_control_thumbnail.style.backgroundImage = "url(" + thumbnail + ")"


    player_control_background.style.background = "rgba(" + thumbnailcolor + "," + player_control_yakeli + ")"
    player_control_info.style.color = "rgb(" + fontcolor + ")"
    player_iconcolor(fontcolor)


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

function pc_aubar() {
    var full = document.querySelector("#player_control .info-container");
    var usage = document.querySelector("#player_control .info");
    var bar = document.querySelector(".aubar");

    var aubar = document.querySelector(".aubar");
    var rgbbg = document.querySelector(".aubar").getContext('2d');

    var height = full.clientHeight - usage.clientHeight;
    var width = full.clientWidth;

    bar.width = width;
    bar.height = height;

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

        if (!aubarstop && player_control_visualaudiobar) {
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
        if (!aubarstop && player_control_visualaudiobar) {
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

    }
}

