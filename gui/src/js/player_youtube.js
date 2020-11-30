// import player.js

class YoutubePlayer {
  constructor(sb_player, source) {
    this.sb_player = sb_player;
    this.will_loop = false;

    ThirdParty.LoadYoutubeAPI(() => {
      let video_info = this.ExtractYoutubeUrlInfo(source);
      this.youtube_player = new window.YT.Player(this.sb_player.player, {
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
          controls: 0,
          cc_load_policy: 1,
          cc_lang_pref: 'en',
        },
        events: {
          onReady: data => this.OnYoutubeReady(data),
          onStateChange: state => this.OnYoutubeStateChange(state),
        }
      });

      this.sb_player.UpdateThumbnail('url(https://img.youtube.com/vi/' + video_info.video_id + '/0.jpg)');
    });
  }

  Destroy() {
    clearInterval(this.time_timer);
    this.youtube_player.destroy();
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
    console.log("Youtube player is ready");
    this.sb_player.OnPlayerReady();
  }

  OnYoutubeStateChange(e) {
    switch (e.data) {
      case window.YT.PlayerState.UNSTARTED:
        this.sb_player.OnDurationChange();
        break;
      case window.YT.PlayerState.ENDED:
        if (this.will_loop)
          this.youtube_player.playVideo();
        break;
      case window.YT.PlayerState.PLAYING:
        this.sb_player.UpdateLoadingStatus(false);
        this.sb_player.EmitSyncEvent('play', this.current_time());

        if (this.time_timer == null) {
          this.time_timer = setInterval(() => {
            this.sb_player.OnCurrentTimeChange();
          }, 300);
        }
        break;
      case window.YT.PlayerState.PAUSED:
        this.sb_player.UpdateLoadingStatus(false);
        this.sb_player.EmitSyncEvent('pause', this.current_time());
        break;
      case window.YT.PlayerState.BUFFERING:
        this.sb_player.UpdateLoadingStatus(false);
        break;
      case window.YT.PlayerState.CUED:
        break;
    }
  }

  current_time() {
    return this.youtube_player.getCurrentTime();
  }

  duration() {
    return this.youtube_player.getDuration();
  }

  volume() {
    return this.youtube_player.getVolume() / 100;
  }

  SeekToImpl(new_time) {
    this.youtube_player.seekTo(new_time);
  }

  SetVolumeImpl(new_volume) {
    this.youtube_player.setVolume(new_volume * 100);
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

  SetLoopImpl(loop) {
    this.youtube_player.setLoop(loop);
    this.will_loop = loop;
  }
}