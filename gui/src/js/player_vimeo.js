// import player.js

class VimeoPlayer {
  constructor(sb_player, source) {
    this.sb_player = sb_player;
    this.will_loop = false;

    this.vimeo_duration = 0;
    this.vimeo_volume = 1;
    this.vimeo_current_time = 0;

    ThirdParty.LoadVimeoAPI(() => {
      this.vimeo_player = new window.Vimeo.Player(this.sb_player.wrapperPlayer.querySelector('#div_player'), {
        url: source,
        controls: false,
        transparent: true,
        playsinline: true,
      });

      this.vimeo_player.on('play', () => {
        this.sb_player.EmitSyncEvent('play', this.current_time());
      });

      this.vimeo_player.on('pause', () => {
        this.sb_player.EmitSyncEvent('pause', this.current_time());
      });

      this.vimeo_player.on('timeupdate', e => {
        this.vimeo_current_time = e.seconds;
        this.sb_player.OnCurrentTimeChange();
      });

      this.vimeo_player.on('volumechange', e => {
        this.vimeo_volume = e.volume;
      });

      this.vimeo_player.on('bufferstart', e => {
        this.sb_player.UpdateLoadingStatus(true);
      });

      this.vimeo_player.on('bufferend', e => {
        this.sb_player.UpdateLoadingStatus(false);
      });

      this.vimeo_player.on('progress', e => {
        this.sb_player.UpdateLoadingStatus(true);
      });

      this.vimeo_player.getDuration().then((duration) => {
        console.log("Get Duration")
        this.vimeo_duration = duration;
        this.sb_player.OnPlayerReady();
        this.sb_player.OnDurationChange();
      });
    });
  }

  Destroy() {
    this.vimeo_player.destroy();
  }

  duration() {
    return this.vimeo_duration;
  }

  current_time() {
    return this.vimeo_current_time;
  }

  volume() {
    return this.vimeo_volume;
  }

  SeekToImpl(new_time) {
    this.vimeo_player.setCurrentTime(new_time);
  }

  PlayImpl() {
    this.vimeo_player.play();
  }

  PauseImpl() {
    this.vimeo_player.pause();
  }

  MuteImpl() {
    this.vimeo_player.setVolume(0);
  }

  UnMuteImpl() {
    this.vimeo_player.setVolume(1);
  }

  SetVolumeImpl(volume) {
    this.vimeo_player.setVolume(volume);
  }

  SetLoopImpl(loop) {
    this.vimeo_player.setLoop(loop);
  }
}