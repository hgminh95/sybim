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