import './App.css';
import React from 'react';

let tomatoPath = 'tomato.png';
let alarmPath = 'visualradiostartsound.wav';
let timerPath = 'webworker_timer.js';

function App() {
  return (
    <div className="App">
      <PomodoroWidget/>
    </div>
  );
}

class PomodoroWidget extends React.Component{
  workPeriods = ['Work', 'Short Break', 'Work', 'Short Break', 'Work', 'Short Break',
                  'Work', 'Long Break'];
  workTime = 1.5e+6;
  shortBreakTime = 300000;
  longBreakTime = 900000;
  workPeriodTimes = [this.workTime, this.shortBreakTime, this.workTime,
                    this.shortBreakTime, this.workTime, this.shortBreakTime,
                    this.workTime, this.longBreakTime];
  timerWorker = undefined;
  alarmAudio = new Audio(alarmPath);

  constructor(props){
    super(props);
    this.startSession = this.startSession.bind(this);
    this.moveToNextInterval = this.moveToNextInterval.bind(this);
    this.endSession = this.endSession.bind(this);
    this.pauseSession = this.pauseSession.bind(this);
    this.state = {
      isSessionOngoing : false,
      intervalNumber: 0,
      workPeriodsFinished : 0,
      countdown: 0,
      isTimerActive : false
    };
    this.alarmAudio.loop = true;
  }

  startSession(){
    this.setState({
      isSessionOngoing: true,
      intervalNumber: 0,
      workPeriodsFinished: 0,
      countdown : this.workPeriodTimes[0]
    }, this.startTimer);
  }

  moveToNextInterval(){
    this.alarmAudio.pause();
    this.alarmAudio.currentTime = 0;
    if(this.state.intervalNumber + 1 < this.workPeriods.length){
      const increment = (this.workPeriods[this.state.intervalNumber] === 'Work') ? 1 : 0;
      this.setState({
        intervalNumber : this.state.intervalNumber + 1,
        countdown : this.workPeriodTimes[this.state.intervalNumber + 1],
        workPeriodsFinished : this.state.workPeriodsFinished + increment
      }, this.startTimer);
    } else {
       this.setState({
        intervalNumber : 0,
        countdown : this.workPeriodTimes[0],
        workPeriodsFinished : 0
      }, this.startTimer);
    }
  }

  endSession(){
    this.setState({
      isSessionOngoing: false,
      countdown : 0
    });
    this.timerWorker.terminate();
    this.alarmAudio.pause();
    this.alarmAudio.currentTime = 0;
  }

  pauseSession(){
    this.setState({
      isTimerActive : this.state.isTimerActive ? false : true
    }, () => {
      let messageObj = {isTimerActive: this.state.isTimerActive, countdown: this.state.countdown, initialize: false}
      this.timerWorker.postMessage(messageObj);
    });
  }

  startTimer = () => {
    if(this.timerWorker != undefined){
      this.timerWorker.terminate();
    }
    this.timerWorker = new Worker(timerPath);
    this.timerWorker.onmessage = (event) => {
      this.setState({
        isTimerActive : event.data.isTimerActive,
        countdown : event.data.countdown
      });
    }
    this.setState({isTimerActive : true}, 
      () => {
        let messageObj = {isTimerActive: this.state.isTimerActive, countdown: this.state.countdown, initialize: true}
        this.timerWorker.postMessage(messageObj);
      });
  };

  render(){
    let widgetContents;
    let timerContents;
    if(this.state.isSessionOngoing){
      if(this.state.countdown > 0){
        timerContents = 
        <TimerCircle countdown={this.state.countdown} totalTime={this.workPeriodTimes[this.state.intervalNumber]}/>;
      } else {
        this.alarmAudio.play();
        timerContents = <>
          <button className='pomodoro-button' onClick={this.moveToNextInterval}>Start Next Interval</button>
        </>;
      }

      widgetContents = <>
        <h1>{this.workPeriods[this.state.intervalNumber]}</h1>
        <div className='timer-container'>{timerContents}</div>
        <TomatoIcons total={this.state.workPeriodsFinished}/>
        <button className='pomodoro-button' onClick={this.pauseSession}>Pause</button>
        <button className='pomodoro-button' onClick={this.endSession}>End Session</button>
      </>;
    } else {
      widgetContents = <>
        <h1>Pomodoro</h1>
        <button className='pomodoro-button' onClick={this.startSession}>Start Session</button>
      </>
    }
    return (
      <div className='flex-container'>
        {widgetContents}
      </div>);
  }

}

function TomatoIcons(props){
  const total = props.total;
  let tomatoes = [];
  for(let i = 0; i < total; i++){
    tomatoes.push(<img key={i} className='tomato-icon' src={tomatoPath}></img>);
  }

  return <div className='tomato-container'>{tomatoes}</div>;
}

function millisecondsToMinutesAndSeconds(ms){
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return (
    seconds == 60 ?
    (minutes+1) + ":00" :
    minutes + ":" + (seconds < 10 ? "0" : "") + seconds
  );

}

function TimerCircle(props){
  const radius = 100;
  const strokeColor = '#8eff43';
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (props.countdown / props.totalTime) * circumference;
    return (<div className='timer-circle-container'>
    <h1 className='timer-text'>{millisecondsToMinutesAndSeconds(props.countdown)}</h1>
    <svg className='timer-circle'>
      <circle
        cx={radius}
        cy={radius}
        r={radius}
        fill="none"
        stroke={'#413012'}
        strokeWidth={strokeWidth}>
       </circle>
    </svg>
    
    <svg className='timer-circle'>
      <circle
        strokeDasharray={circumference}
        strokeDashoffset={
          strokeDashoffset
        }
        r={radius}
        cx={radius}
        cy={radius}
        fill="none"
        strokeLinecap='round'
        stroke={strokeColor}
        strokeWidth={strokeWidth + 2}>
       </circle>
    </svg>
    
  </div>);
}

export default App;
