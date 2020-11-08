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

function toggleFullScreen(elem) {
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
