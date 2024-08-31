var countdown_text = document.querySelector("#countdown .text");
var countdown = document.querySelector("#countdown");


var examDate


function setcountdown(){
    var examDate = new Date(countdown_year,countdown_month - 1,countdown_day);  
    var now = new Date();
    var distance = examDate - now;

    var days = Math.ceil(distance / (1000 * 60 * 60 * 24));  
    var hours = Math.ceil((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));  
    var minutes = Math.ceil((distance % (1000 * 60 * 60)) / (1000 * 60));  
    var seconds = Math.ceil((distance % (1000 * 60)) / 1000);

    countdown_text.innerHTML = countdown_txt + (days - 1) + ":" + add0(hours - 1) + ":" + add0(minutes - 1) + ":" + add0(seconds) + countdown_txt1;

    
}

//setInterval(setcountdown, 1000);  
function setcountdown_a(){
    setcountdown()
    setTimeout(setcountdown_a,1000);
}
setcountdown_a()
