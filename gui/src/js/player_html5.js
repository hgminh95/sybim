// import player.js

class Html5Player {
  constructor(sb_player, source) {
    this.html5_player = sb_player.player;
    this.sb_player = sb_player;

    this.html5_player.src = source;

    this.WaitUntilVideoIsReady().then(() => { this.sb_player.OnPlayerReady(); } );

    this.BindEvents();

    this.sb_player.UpdateThumbnail('rgba(76, 175, 80, 0)');
  }

  Destroy() {}

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

  SetLoopImpl(loop) {
    this.html5_player.loop = loop;
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
