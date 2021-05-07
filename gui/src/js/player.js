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
  loop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.547 24.547"><path d="M5.285,24.082c-0.111,0-0.217-0.041-0.298-0.12l-4.866-4.879c-0.161-0.159-0.161-0.422,0-0.585 l4.866-4.885c0.119-0.117,0.298-0.155,0.454-0.089c0.156,0.06,0.256,0.215,0.256,0.384v3.021h13.335c0.369,0,0.67-0.301,0.67-0.668 v-3.4c0-0.111,0.043-0.216,0.119-0.295l3.256-3.269c0.118-0.118,0.3-0.156,0.454-0.091c0.157,0.066,0.258,0.22,0.258,0.386v7.391 c0,2.64-1.395,4.034-4.033,4.034H5.698v2.652c0,0.167-0.1,0.318-0.256,0.38C5.392,24.07,5.335,24.082,5.285,24.082z"/> <path d="M1.171,15.378c-0.055,0-0.108-0.012-0.159-0.033c-0.156-0.063-0.258-0.213-0.258-0.383v-7.39 c0-2.641,1.392-4.033,4.033-4.033h14.064V0.88c0-0.165,0.101-0.317,0.256-0.385c0.158-0.061,0.335-0.031,0.455,0.092l4.864,4.875 c0.162,0.162,0.162,0.427,0,0.588l-4.864,4.882c-0.119,0.121-0.296,0.158-0.454,0.091c-0.155-0.063-0.256-0.216-0.256-0.386V7.623 H5.508c-0.367,0-0.664,0.3-0.664,0.669v3.401c0,0.11-0.043,0.213-0.124,0.296l-3.258,3.265C1.385,15.334,1.281,15.378,1.171,15.378 z"/> </svg>`,
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

  is_vimeo_loaded: false,
  LoadVimeoAPI: function(OnReady) {
    if (ThirdParty.is_vimeo_loaded) {
      OnReady();
    } else {
      var tag = document.createElement('script');
      tag.src = 'https://player.vimeo.com/api/player.js';
      tag.addEventListener('load', e => {
        OnReady();
      });

      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }
};

function SelectPlayer(url) {
  if (url.startsWith('http://youtube.com')
      || url.startsWith('https://youtube.com')
      || url.startsWith('http://www.youtube.com')
      || url.startsWith('https://www.youtube.com'))
    return 'youtube';

  if (url.startsWith('http://vimeo.com')
      || url.startsWith('https://vimeo.com')
      || url.startsWith('http://www.vimeo.com')
      || url.startsWith('https://www.vimeo.com'))
    return 'vimeo';

  return 'html5';
}

class SybimVideoPlayer {
  constructor({selector, options}) {
    this.is_paused = null;
    this.is_ready = false;
    this.is_fullscreen = false;
    this.delay_autohide = 3000;
    this.support_touch = this.IsTouchSupported();
    this.controls_enable = false;
    this.volume = 1;

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
    this.player.setAttribute('data-v-toggle-play-pause', '');

    const htmlControls = `
      <div id="div_player" class="real-player"></div>
      <div class="overlay" data-v-toggle-play-pause>
        ${!this.support_touch
          ? `<div class="overlay-left" data-v-fast-forward data-direction="left"></div><div class="overlay-right" data-v-fast-forward data-direction="right"></div>`
          : ``}
      </div>
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

          <div class="loop">
            <span class="icon">${Svg.loop}</span>
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
      e.preventDefault();
      this.SeekTo((e.target.value * this.real_player.duration()) / 100, true);
    }
    this.wrapperPlayer.querySelector('.progress-input').addEventListener('change', this.OnChangeProgressBar, false);

    const play_pause_btn = this.wrapperPlayer.querySelectorAll('[data-v-toggle-play-pause]');
    play_pause_btn.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.TogglePlayPause(true)
      }, false);
    });

    this.OnClickToggleVolume = e => {
      e.preventDefault();
      this.ToggleVolume();
    };
    this.wrapperPlayer.querySelector('.volume').addEventListener('click', this.OnClickToggleVolume, false);

    this.wrapperPlayer.querySelector('.volume-slider > input').addEventListener('change', (e) => {
      e.preventDefault();
      this.SetVolume(e.target.value);
    }, false);

    this.wrapperPlayer.querySelector('.loop').addEventListener('click', e => {
      e.preventDefault();
      this.ToggleLoop(true);
    }, false);

    this.wrapperPlayer.querySelector('.fullscreen').addEventListener('click', e => {
      e.preventDefault();
      this.ToggleFullScreen();
    }, false);

    this.wrapperPlayer.addEventListener('keyup', (e) => {
      e.preventDefault();
      this.OnKeyUp(e);
    }, false);

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

    if (this.real_player != null) {
      this.real_player.Destroy();
    }

    if (player_type === 'html5') {
      this.real_player = new Html5Player(this, source);
    } else if (player_type === 'youtube') {
      this.real_player = new YoutubePlayer(this, source);
    } else if (player_type === 'vimeo') {
      this.real_player = new VimeoPlayer(this, source);
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
    this.SetVolume(this.volume);
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
    this.wrapperPlayer.querySelector('.loop').classList.add('disabled');
  }

  EnableControls() {
    this.controls_enable = true;

    this.wrapperPlayer.querySelector('.progress-bar').classList.remove('disabled');
    this.wrapperPlayer.querySelector('.play-pause-btn').classList.remove('disabled');
    this.wrapperPlayer.querySelector('.big-play-btn').classList.remove('disabled');
    this.wrapperPlayer.querySelector('.loop').classList.remove('disabled');
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
    this.wrapperPlayer.querySelector('.thumbnail').style.backgroundImage = `${thumbnail}`;
  }

  Play(is_human) {
    if (this.controls_enable || !is_human) {
      if (this.wrapperPlayer.classList.contains('first-start')) {
        this.wrapperPlayer.classList.remove('first-start');
        this.wrapperPlayer.querySelector('.thumbnail').classList.remove('active');
      }

      this.real_player && this.real_player.PlayImpl();
      this.is_paused = false;
      this.UpdatePlayPauseGui();
    }
  }

  Pause(is_human) {
    if (this.controls_enable || !is_human) {
      this.real_player && this.real_player.PauseImpl();
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
      }, this.delay_autohide);
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

  ToggleLoop(is_human) {
    const loop_btn = this.wrapperPlayer.querySelector('.loop');

    if (loop_btn.classList.contains('looped')) {
      this.SetLoop(false, is_human);
    } else {
      this.SetLoop(true, is_human);
    }
  }

  SetLoop(loop, is_human) {
    if (this.controls_enable || !is_human) {
      this.real_player && this.real_player.SetLoopImpl(loop);

      const loop_btn = this.wrapperPlayer.querySelector('.loop');

      if (loop) {
        loop_btn.classList.add('looped');
        this.EmitSyncEvent('loop', '1');
      } else {
        loop_btn.classList.remove('looped');
        this.EmitSyncEvent('loop', '0');
      }
    }
  }

  SetVolume(volume) {
    this.real_player.SetVolumeImpl(volume);
    this.volume = volume;

    // TODO(mhoang) update GUI
  }

  SeekTo(new_time, is_human) {
    if (this.controls_enable || !is_human)
      this.real_player && this.real_player.SeekToImpl(new_time)
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
      this.SetVolume(this.volume + 0.1);
    }

    if (e.keyCode === 40) { // Down Arrow
      this.SetVolume(this.volume - 0.1);
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
      }, this.delay_autohide);
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
