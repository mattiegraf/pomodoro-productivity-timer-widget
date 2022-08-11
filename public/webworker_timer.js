let countdown = 0;
let isTimerActive = false;

function startTimer(){
    const interval = setInterval(() => {
        if(isTimerActive){
        countdown = countdown - 10;
        }

        if(countdown <= 0){
        clearInterval(interval);
        isTimerActive = false;
        countdown = 0;
        }

        postMessage({isTimerActive: isTimerActive, countdown: countdown});
    }, 10);
};

  onmessage = (event) => {
    isTimerActive = event.data.isTimerActive;
    countdown = event.data.countdown;
    if(event.data.initialize){
        startTimer();
    }
  };