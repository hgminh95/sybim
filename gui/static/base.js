let $ = id => document.getElementById(id);

let g_toasting = false;

function toast(msg) {
  if (!g_toasting) {  /* handle multiple toast called, probably not perfect */
    g_toasting = true;

    let x = $("toast");
    x.innerHTML = msg;
    x.className = "show";
    setTimeout(function() {
      x.className = x.className.replace("show", "");
      g_toasting = false;
    }, 3000);
  } else {
    setTimeout(() => toast(msg), 1000);
  }
}


function generateRandomLightColor() {
  var letters = 'BCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
    color += letters[Math.floor(Math.random() * letters.length)];
  }
  return color;
}

function getWSAddr() {
  let loc = window.location, new_uri;
  if (loc.protocol === "https:")
    new_uri = "wss:";
  else
    new_uri = "ws:";
  new_uri += "//" + loc.host + "/ws";

  return new_uri;
}

function request_ws(cmd, success_callback, error_callback) {
  socket = new WebSocket(getWSAddr());

  socket.onopen = event => {
    socket.send(cmd);
  }

  socket.onmessage = event => {
    if (event.data.text) {
      event.data.text().then(msg => success_callback(msg));
    } else {
      success_callback(event.data);
    }
  };

  socket.onerror = event => {
    error_callback && error_callback(event);
  };
}


/**
 * Custom websocket that can handle unstable connection.
 */
class SybimSocket {
  constructor(address, room, token, nickname) {
    this.address = address;
    this.room = room;
    this.token = token;
    this.nickname = nickname;

    this.heartbeatTimer = null;
    this.retryTimer = null;

    this.connected = false;
    this.failureCount = 0;
  }

  connect() {
    this.socket = new WebSocket(this.address);

    this.socket.onopen = event => {
      this.socket.send(`r|j|${this.room}|${this.token}|${this.nickname}`);
      this.heartbeatTimer = setInterval(() => this.socket.send("hb"), 15000);
    }

    this.socket.onmessage = event => {
      if (event.data.text) {
        event.data.text().then(msg => this.handleMsg(msg));
      } else {
        this.handleMsg(event.data);
      }
    }

    this.socket.onerror = event => {
      clearTimeout(this.retryTimer);
      clearInterval(this.heartbeatTimer);

      this.failureCount += 1;
      if (this.failureCount > 5) {
        this.onunstable && this.onunstable();
        this.failureCount = 0;
      }

      this.retryTimer = setTimeout(() => this.connect(), 500);
    }

    this.socket.onclose = event => {
      clearTimeout(this.retryTimer);
      clearInterval(this.heartbeatTimer);

      this.failureCount += 1;
      if (this.failureCount > 5) {
        this.onunstable && this.onunstable();
        this.failureCount = 0;
      }

      this.retryTimer = setTimeout(() => this.connect(), 500);
    }
  }

  handleMsg(msg) {
    if (msg === "hb")
      return;

    if (!this.connected) {
      this.connected = true;
      this.failureCount = 0;

      this.onopen && this.onopen();
    }

    this.onmessage && this.onmessage(msg);
  }

  send(msg) {
    this.socket.send(msg);
  }
}

// -------------------------------------------------------------------
// SybimVideoPlayer - inspired by vlitejs
// -------------------------------------------------------------------

const Svg = {
  bigPlay: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm0 29C8.82 29 3 23.18 3 16S8.82 3 16 3s13 5.82 13 13-5.82 13-13 13zM12 9l12 7-12 7z"/></svg>`,
  volumeHigh: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 32"><path d="M27.814 28.814a1.5 1.5 0 0 1-1.061-2.56C29.492 23.515 31 19.874 31 16.001s-1.508-7.514-4.247-10.253a1.5 1.5 0 1 1 2.121-2.121C32.179 6.932 34 11.327 34 16.001s-1.82 9.069-5.126 12.374a1.495 1.495 0 0 1-1.061.439zm-5.329-2.829a1.5 1.5 0 0 1-1.061-2.56c4.094-4.094 4.094-10.755 0-14.849a1.5 1.5 0 1 1 2.121-2.121c2.55 2.55 3.954 5.94 3.954 9.546s-1.404 6.996-3.954 9.546a1.495 1.495 0 0 1-1.061.439zm-5.328-2.828a1.5 1.5 0 0 1-1.061-2.56 6.508 6.508 0 0 0 0-9.192 1.5 1.5 0 1 1 2.121-2.121c3.704 3.704 3.704 9.731 0 13.435a1.495 1.495 0 0 1-1.061.439zM13 30a1 1 0 0 1-.707-.293L4.586 22H1a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h3.586l7.707-7.707A1 1 0 0 1 14 3v26a1.002 1.002 0 0 1-1 1z"/></svg>`,
  volumeMute: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M13 30a1 1 0 0 1-.707-.293L4.586 22H1a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h3.586l7.707-7.707A1 1 0 0 1 14 3v26a1.002 1.002 0 0 1-1 1z"/></svg>`,
  play: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 4l20 12L6 28z"/></svg>`,
  pause: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M4 4h10v24H4zm14 0h10v24H18z"/></svg>`,
  fullscreen: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M27.414 24.586L22.828 20 20 22.828l4.586 4.586L20 32h12V20zM12 0H0v12l4.586-4.586 4.543 4.539 2.828-2.828-4.543-4.539zm0 22.828L9.172 20l-4.586 4.586L0 20v12h12l-4.586-4.586zM32 0H20l4.586 4.586-4.543 4.539 2.828 2.828 4.543-4.539L32 12z"/></svg>`,
  fullscreenExit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M24.586 27.414L29.172 32 32 29.172l-4.586-4.586L32 20H20v12zM0 12h12V0L7.414 4.586 2.875.043.047 2.871l4.539 4.543zm0 17.172L2.828 32l4.586-4.586L12 32V20H0l4.586 4.586zM20 12h12l-4.586-4.586 4.547-4.543L29.133.043l-4.547 4.543L20 0z"/></svg>`,
};

let ThirdParty = {
  is_youtube_loaded: false,
  LoadYoutubeAPI: function(OnReady) {
    if (ThirdParty.is_youtube_loaded) {
      OnReady();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        ThirdParty.is_youtube_loaded = true;
        OnReady();
      }
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  },
};

class SybimVideoPlayer {
  constructor({selector, options}) {
    this.is_paused = null;
    this.is_ready = false;
    this.isFullScreen = false;
    this.delayAutoHide = 3000;
    this.supportTouch = this.IsTouchSupported();
    this.controls_enable = false;

    if (typeof selector === 'string')
      this.player = document.querySelector(selector);
    else if (typeof selector === 'object')
      this.player = selector;

    if (this.player == null) {
      console.warn('[sybim:video-player] Selector not found');
      return;
    }

    const DEFAULT_OPTIONS = {};

    this.options = Object.assign({}, DEFAULT_OPTIONS, options);

    this.BuildPlayerDom();
    this.BindEvents();
  }

  BuildPlayerDom() {
    // Create wrapper for each player
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'sybim-player first-start paused loading');
    wrapper.setAttribute('tabindex', 0);
    this.player.parentNode.insertBefore(wrapper, this.player);
    wrapper.appendChild(this.player);
    this.wrapperPlayer = this.player.parentNode;

    const htmlControls = `
      ${!this.supportTouch
        ? `<div class="v-overlayLeft" data-v-fast-forward data-direction="left"></div><div class="v-overlayRight" data-v-fast-forward data-direction="right"></div>`
        : ``}
      <div class="loader">
        <div class="loader-content">
          <div class="loader-bounce-1"></div>
          <div class="loader-bounce-2"></div>
          <div class="loader-bounce-3"></div>
        </div>
      </div>
      <div class="thumbnail active" data-v-toggle-play-pause style=""></div>

      <div class="big-play-btn" data-v-toggle-play-pause>
        <span class="icon icon-big-play">${Svg.bigPlay}</span>
      </div>

      <div class="control-bar">
        <div class="progress-bar">
          <div class="progress-total">
            <div class="progress-seek"></div>
          </div>
          <input type="range" class="progress-input" min="0" max="100" step="0.01" value="0" orient="horizontal" />
        </div>

        <div class="control-bar-content">
          <div class="play-pause-btn" data-v-toggle-play-pause>
            <span class="icon play-icon">${Svg.play}</span>
            <span class="icon pause-icon">${Svg.pause}</span>
          </div>

          <div class="volume">
            <span class="icon volume-high-icon">${Svg.volumeHigh}</span>
            <span class="icon volume-muted-icon">${Svg.volumeMute}</span>
          </div>

          <div class="volume-slider">
            <input type="range" min="0" max="1" step="0.01" value="1" orient="horizontal" />
          </div>

          <div class="time">
            <span class="current-time">00:00</span>&nbsp;/&nbsp;<span class="duration"></span>
          </div>

          <div class="fullscreen">
            <span class="icon fullscreen-icon">${Svg.fullscreen}</span>
            <span class="icon shrink-icon">${Svg.fullscreenExit}</span>
          </div>
        </div>
      </div>
    `;

    wrapper.insertAdjacentHTML('beforeend', htmlControls);
  }

  BindEvents() {
    this.OnChangeProgressBar = e => {
      this.SeekTo((e.target.value * this.real_player.duration()) / 100, true);
    }
    this.wrapperPlayer.querySelector('.progress-input').addEventListener('change', this.OnChangeProgressBar, false);

    const play_pause_btn = this.wrapperPlayer.querySelectorAll('[data-v-toggle-play-pause]');
    play_pause_btn.forEach(button => {
      button.addEventListener('click', (e) => this.TogglePlayPause(true), false);
    });

    this.OnClickToggleVolume = e => {
      e.preventDefault();
      this.ToggleVolume();
    };
    this.wrapperPlayer.querySelector('.volume').addEventListener('click', this.OnClickToggleVolume, false);

    this.wrapperPlayer.querySelector('.volume-slider > input').addEventListener('change', (e) => {
      this.real_player.SetVolumeImpl(e.target.value);
    }, false);

    this.wrapperPlayer.querySelector('.fullscreen').addEventListener('click', () => this.ToggleFullScreen(), false);

    this.wrapperPlayer.addEventListener('keyup', (e) => this.OnKeyUp(e), false);

    this.OnMousemoveEvent = e => {
      this.OnMouseMove(e);
    }

    this.wrapperPlayer.addEventListener('mousemove', this.OnMousemoveEvent, false);

    ["", "webkit", "moz", "ms"].forEach(
      prefix => document.addEventListener(prefix + "fullscreenchange", () => {
        if ((document.fullScreenElement !== undefined && document.fullScreenElement === null) || (document.msFullscreenElement !== undefined && document.msFullscreenElement === null) || (document.mozFullScreen !== undefined && !document.mozFullScreen) || (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen)) {
          this.wrapperPlayer.querySelector('.fullscreen').classList.remove('exit');
        } else {
          this.wrapperPlayer.querySelector('.fullscreen').classList.add('exit');
        }
      }, false)
    );
  }

  SetSource(player_type, source) {
    this.ResetGuiState();
    if (player_type === 'html5') {
      this.real_player = new Html5Player(this, source);
    } else if (player_type === 'youtube') {
      this.real_player = new YoutubePlayer(this, source);
    } else {
      console.warn('[sybim:video-player] Unknown player_type ' + player_type);
    }
  }

  ResetGuiState() {
     this.is_paused = true;
     this.is_ready = false;
     this.UpdatePlayPauseGui();
  }

  OnPlayerReady() {
    this.UpdateLoadingStatus(false);
  }

  RegisterEvent(event_name, callback) {
    this.callbacks[event_name].push(callback);
  }

  /**
   * Check if browser support touch event.
   */
  IsTouchSupported () {
		return 'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch)
  }

  DisableControls() {
    this.controls_enable = false;

    this.wrapperPlayer.querySelector('.progress-bar').classList.add('disabled');
    this.wrapperPlayer.querySelector('.play-pause-btn').classList.add('disabled');
    this.wrapperPlayer.querySelector('.big-play-btn').classList.add('disabled');
  }

  EnableControls() {
    this.controls_enable = true;

    this.wrapperPlayer.querySelector('.progress-bar').classList.remove('disabled');
    this.wrapperPlayer.querySelector('.play-pause-btn').classList.remove('disabled');
    this.wrapperPlayer.querySelector('.big-play-btn').classList.remove('disabled');
  }

  RegisterOnReadyCallback(callback) {
    this.on_ready_callback = callback;
  }

  UpdateLoadingStatus(loading) {
    if (!loading && !this.is_ready) {
      this.is_ready = true;
      this.on_ready_callback && this.on_ready_callback();
    }
    if (loading) {
      this.wrapperPlayer.classList.add('loading');
    } else {
      this.wrapperPlayer.classList.remove('loading');
    }
  }

  OnDurationChange(duration) {
    this.wrapperPlayer.querySelector('.duration').innerHTML = this.constructor.FormatVideoTime(duration || this.real_player.duration());
  }

  UpdateThumbnail(thumbnail) {
    this.wrapperPlayer.querySelector('.thumbnail').style.background = `${thumbnail}`;
  }

  Play(is_human) {
    if (this.controls_enable || !is_human) {
      if (this.wrapperPlayer.classList.contains('first-start')) {
        this.wrapperPlayer.classList.remove('first-start');
        this.wrapperPlayer.querySelector('.thumbnail').classList.remove('active');
      }

      this.real_player.PlayImpl();
      this.is_paused = false;
      this.UpdatePlayPauseGui();
    }
  }

  Pause(is_human) {
    if (this.controls_enable || !is_human) {
      this.real_player.PauseImpl();
      this.is_paused = true;
      this.UpdatePlayPauseGui();
    }
  }

  TogglePlayPause(is_human) {
    if (this.wrapperPlayer.classList.contains('paused')) {
      this.Play(is_human);
    } else {
      this.Pause(is_human);
    }
  }

  UpdatePlayPauseGui() {
    if (this.is_paused) {
      this.wrapperPlayer.classList.replace('playing', 'paused');
      this.wrapperPlayer.querySelector('.control-bar').classList.remove('hidden');
    } else {
      this.wrapperPlayer.classList.replace('paused', 'playing');
      this.timer_autohide = setTimeout(() => {
        this.wrapperPlayer.querySelector('.control-bar').classList.add('hidden');
      }, this.delayAutoHide);
    }
  }

  OnStatusChanged(e) {
    if (e.is_paused != null) {
      this.is_paused = e.is_paused;
      this.UpdatePlayPauseGui();
    }
  }

  Mute() {
    this.real_player.MuteImpl();
    this.wrapperPlayer.querySelector('.volume').classList.add('muted');
  }

  UnMute() {
    this.real_player.UnMuteImpl();
    this.wrapperPlayer.querySelector('.volume').classList.remove('muted');
  }

  ToggleVolume() {
    const volume_btn = this.wrapperPlayer.querySelector('.volume');

    if (volume_btn.classList.contains('muted')) {
      this.UnMute()
    } else {
      this.Mute();
    }
  }

  SeekTo(new_time, is_human) {
    if (this.controls_enable || !is_human)
      this.real_player.SeekToImpl(new_time)
  }

  ToggleFullScreen() {
    let elem = document.body;

    if ((document.fullScreenElement !== undefined && document.fullScreenElement === null) || (document.msFullscreenElement !== undefined && document.msFullscreenElement === null) || (document.mozFullScreen !== undefined && !document.mozFullScreen) || (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen)) {
      if (elem.requestFullScreen) {
        elem.requestFullScreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullScreen) {
        elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  OnKeyUp(e) {
    if (e.keyCode === 38) { // Up Arrow
      this.real_player.SetVolumeImpl(this.real_player.volume() + 0.1);
    }

    if (e.keyCode === 40) { // Down Arrow
      this.real_player.SetVolumeImpl(this.real_player.volume() - 0.1);
    }

    if (e.keyCode === 32) { // Space
      this.TogglePlayPause(true);
    }

    if (e.keyCode === 39) { // Right Arrow
      this.SeekTo(this.real_player.current_time() + 5, true);
    }

    if (e.keyCode === 37) { // Left Arrow
      this.SeekTo(this.real_player.current_time() - 5, true);
    }
  }

  OnMouseMove(e) {
    if (!this.is_paused) {
      this.wrapperPlayer.querySelector('.control-bar').classList.remove('hidden');
      clearTimeout(this.timer_autohide);

      this.timer_autohide = setTimeout(() => {
				this.wrapperPlayer.querySelector('.control-bar').classList.add('hidden')
			}, this.delayAutoHide)
    }
  }

  OnCurrentTimeChange(tm) {
    const current_time = Math.round(tm || this.real_player.current_time());
		const duration = this.real_player.duration();
		const width = (current_time * 100) / duration;
		const time_elem = this.wrapperPlayer.querySelector('.current-time');

		this.wrapperPlayer.querySelector('.progress-seek').style.width = `${width}%`;

		if (time_elem !== null) {
			time_elem.innerHTML = this.constructor.FormatVideoTime(current_time);
		}
  }

  RegisterSyncEventCallback(callback) {
    this.sync_event_callback = callback;
  }

  EmitSyncEvent(status, token) {
    this.sync_event_callback(status, token);
  }

  static FormatVideoTime(time) {
    const ms = time * 1000
		const min = (ms / 1000 / 60) << 0
		const sec = (ms / 1000) % 60 << 0
		let timeInString = ''

		timeInString += min < 10 ? '0' : ''
		timeInString += min + ':'
		timeInString += sec < 10 ? '0' : ''
		timeInString += sec

		return timeInString;
  }
}

class Html5Player {
  constructor(sb_player, source) {
    this.html5_player = sb_player.player;
    this.sb_player = sb_player;

    this.html5_player.src = source;

    this.WaitUntilVideoIsReady().then(() => { this.sb_player.OnPlayerReady(); } );

    this.BindEvents();

    this.sb_player.UpdateThumbnail('rgba(76, 175, 80, 0)');
  }

  WaitUntilVideoIsReady() {
    return new window.Promise((resolve, reject) => {
      if (typeof this.html5_player.duration === 'number' && isNaN(this.html5_player.duration) === false) {
        resolve();
      } else {
        this.onDurationChange = () => {
          this.html5_player.removeEventListener('durationchange', this.onDurationChange);
          this.html5_player.removeEventListener('error', this.onError);

          resolve();
        }

        this.onError = (error) => {
          this.html5_player.removeEventListener('error', this.onError);
          this.html5_player.removeEventListener('durationchange', this.onDurationChange);

          reject(error);
        }

        this.html5_player.addEventListener('durationchange', this.onDurationChange, false);
        this.html5_player.addEventListener('error', this.onError, false);
      }
    });
  }

  BindEvents() {
    this.html5_player.addEventListener('durationchange', (e) => this.sb_player.OnDurationChange(this.duration()), false);
    this.html5_player.addEventListener('timeupdate', (e) => this.sb_player.OnCurrentTimeChange(), false);
    this.html5_player.addEventListener('playing', (e) => this.sb_player.UpdateLoadingStatus(false), false);
    this.html5_player.addEventListener('play', (e) => {
      this.sb_player.EmitSyncEvent('play', this.current_time());
    }, false);
    this.html5_player.addEventListener('pause', (e) => {
      this.sb_player.EmitSyncEvent('pause', this.current_time());
      this.sb_player.OnStatusChanged({ is_paused: true });
    }, false);
    this.html5_player.addEventListener('waiting', (e) => this.sb_player.UpdateLoadingStatus(true), false);
    this.html5_player.addEventListener('seeking', (e) => this.sb_player.UpdateLoadingStatus(true), false);
    this.html5_player.addEventListener('seeked', (e) => {
      if (this.html5_player.paused)
        this.sb_player.EmitSyncEvent('pause', this.current_time());
      else
        this.sb_player.EmitSyncEvent('play', this.current_time());

      this.sb_player.UpdateLoadingStatus(false);
    }, false);
  }

  PlayImpl() {
    this.html5_player.play();
  }

  PauseImpl() {
    this.html5_player.pause();
  }

  MuteImpl() {
    this.html5_player.muted = true;
    this.html5_player.setAttribute('muted', '');
  }

  UnMuteImpl() {
    this.html5_player.muted = false;
    this.html5_player.removeAttribute('muted');
  }

  SetVolumeImpl(volume) {
    this.html5_player.volume = volume;
  }

  SeekToImpl(new_time) {
    this.html5_player.currentTime = new_time;
  }

  duration() {
    return this.html5_player.duration;
  }

  current_time() {
    return this.html5_player.currentTime;
  }

  volume() {
    return this.html5_player.volume;
  }
}

class YoutubePlayer {
  constructor(sb_player, source) {
    this.sb_player = sb_player;

    ThirdParty.LoadYoutubeAPI(() => {
      let video_info = this.ExtractYoutubeUrlInfo(source);
      this.youtube_player = new window.YT.Player('player', {
        videoId: video_info.video_id,
        height: '100%',
        width: '100%',
        playerVars: {
          showinfo: 0,
          modestbranding: 0,
          autohide: 1,
          rel: 0,
          fs: 0,
          playsinline: 1,
          wmode: 'transparent',
          controls: 0
        },
        events: {
          onReady: data => this.OnYoutubeReady(data),
          onStateChange: state => this.OnYoutubeStateChange(state),
        }
      });

      this.sb_player.UpdateThumbnail('url(https://img.youtube.com/vi/' + video_info.video_id + '/0.jpg)');
    });
  }

  ExtractYoutubeUrlInfo(url) {
    var result = {
      video_id: null
    };

    var regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regex);

    if (match && match[2].length === 11) {
      result.video_id = match[2];
    }

    var regPlaylist = /[?&]list=([^#\&\?]+)/;
    match = url.match(regPlaylist);

    if(match && match[1]) {
      result.list_id = match[1];
    }

    return result;
  }

  OnYoutubeReady(data) {
    this.sb_player.OnPlayerReady();
  }

  OnYoutubeStateChange(e) {
    switch (e.data) {
      case window.YT.PlayerState.UNSTARTED:
        this.sb_player.OnDurationChange();
        break;
      case window.YT.PlayerState.ENDED:
        break;
      case window.YT.PlayerState.PLAYING:
        this.sb_player.UpdateLoadingStatus(false);

        if (this.time_timer == null) {
          this.time_timer = setInterval(() => {
            this.sb_player.OnCurrentTimeChange();
          }, 300);
        }
        break;
      case window.YT.PlayerState.PAUSED:
        break;
      case window.YT.PlayerState.BUFFERING:
        this.sb_player.UpdateLoadingStatus(false);
        break;
      case window.YT.PlayerState.CUED:
        break;
    }
  }

  SeekToImpl(new_time) {
    this.youtube_player.seekTo(new_time);
  }

  current_time() {
    return this.youtube_player.getCurrentTime();
  }

  duration() {
    return this.youtube_player.getDuration();
  }

  PlayImpl() {
    this.youtube_player.playVideo();
  }

  PauseImpl() {
    this.youtube_player.pauseVideo();
  }

  MuteImpl() {
    this.youtube_player.mute();
  }

  UnMuteImpl() {
    this.youtube_player.unMute();
  }
}