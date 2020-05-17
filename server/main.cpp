#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <unistd.h>

#include <glog/logging.h>

#include "seasocks/PrintfLogger.h"
#include "seasocks/Server.h"
#include "seasocks/StringUtil.h"
#include "seasocks/WebSocket.h"
#include "seasocks/util/Json.h"

#include "logger.h"
#include "util.h"

using namespace seasocks;

class PlayerGroup {
 public:
  void AddSocket(WebSocket *socket) {
    if (size() == 0) {
      owner_ = socket;
      socket->send("r:o");
    } else {
      socket->send("r:s");
    }

    sockets_.insert(socket);

    SendCurrentStatus(socket);
    BroadcastUserCount();
  }

  void RemoveSocket(WebSocket *socket) {
    sockets_.erase(socket);
    if (socket == owner_) {
      if (sockets_.size() > 0) {
        owner_ = *sockets_.begin();
        owner_->send("r:o");
      } else {
        owner_ = nullptr;
      }
    }

    BroadcastUserCount();
  }

  void Broadcast(std::string_view data) {
    auto tokens = str::split(data, ":");
    if (tokens.size() >= 2) {
      auto timestamp = str::to_double(tokens[1]);
      if (timestamp.has_value()) {
        if (tokens[0] == "play") {
          is_playing_ = true;
          last_video_timestamp_ = timestamp.value();
          last_timestamp_ = std::chrono::steady_clock::now();
        } else if (tokens[0] == "pause") {
          is_playing_ = false;
          last_video_timestamp_ = timestamp.value();
          last_timestamp_ = std::chrono::steady_clock::now();
        } else if (tokens[0] == "seek") {
          last_video_timestamp_ = timestamp.value();
          last_timestamp_ = std::chrono::steady_clock::now();
        }
      }
    }
    for (auto socket : sockets_) {
      if (socket != owner_)
        socket->send(reinterpret_cast<const uint8_t*>(data.data()), data.size());
    }
  }

  void SendCurrentStatus(WebSocket *socket) {
    if (is_playing_) {
      double offset = std::chrono::duration_cast<std::chrono::microseconds>(
          std::chrono::steady_clock::now() - last_timestamp_).count() / 1000000.0;
      if (std::chrono::duration_cast<std::chrono::hours>(
          last_timestamp_.time_since_epoch()).count() == 0)
        offset = 0;

      socket->send("play:" + std::to_string(last_video_timestamp_ + offset));
    } else {
      socket->send("pause:" + std::to_string(last_video_timestamp_));
    }
  }

  int size() const {
    return sockets_.size();
  }

  WebSocket* owner() const {
    return owner_;
  }

  void set_md5_hash(const std::string &md5_hash) {
    md5_hash_ = md5_hash;
  }

  std::string md5_hash() const {
    return md5_hash_;
  }

 private:
  std::unordered_set<WebSocket*> sockets_;
  WebSocket* owner_{nullptr};
  std::string md5_hash_;

  bool is_playing_{false};
  double last_video_timestamp_{0};
  std::chrono::steady_clock::time_point last_timestamp_;

  void BroadcastUserCount() {
    for (auto socket : sockets_) {
      socket->send("user_count:" + std::to_string(size()));
    }
  }
};

class SyncHandler : public WebSocket::Handler {
 public:
  explicit SyncHandler(Server *server)
      : server_(server) {}

  void onConnect(WebSocket *connection) override {
    auto it = sockets_map_.find(connection);
    if (it != sockets_map_.end())
      return;

    sockets_map_[connection] = nullptr;
    connection->send("l:s");
  }

  void onData(WebSocket *connection, const char *data) {
    PlayerGroup *player_group = nullptr;
    auto it = sockets_map_.find(connection);
    if (it != sockets_map_.end())
      player_group = it->second;

    std::string_view command{data};

    if (command == "hb") {
      connection->send("hb");
    } else if (str::has_prefix(command, "r:j:")) {
      JoinRoom(player_group, connection, command.substr(4));
    } else if (str::has_prefix(command, "c:b:")) {
      BroadcastCommand(player_group, connection, command.substr(4));
    } else if (str::has_prefix(command, "c:h:")) {
      UpdateMD5Hash(player_group, connection, command.substr(4));
    } else if (command == "c:rs") {
      RequestForStatus(player_group, connection);
    } else {
      /* Craps */
      LOG(ERROR) << "Unrecognized request sent from client: " << data;
      connection->close();
    }
  }

  void onDisconnect(WebSocket *connection) override {
    auto it = sockets_map_.find(connection);
    if (it == sockets_map_.end())
      return;

    auto player_group = it->second;
    if (player_group)
      player_group->RemoveSocket(connection);
    sockets_map_.erase(it);
  }

 private:
  Server *server_;
  std::unordered_map<WebSocket*, PlayerGroup*> sockets_map_;
  std::unordered_map<std::string, PlayerGroup*> groups_map_;

  void JoinRoom(PlayerGroup *group, WebSocket *socket, std::string_view group_name) {
    if (group)
      group->RemoveSocket(socket);

    std::string group_name_str{group_name};

    PlayerGroup *player_group{nullptr};
    auto it = groups_map_.find(group_name_str);
    if (it != groups_map_.end()) {
      player_group = it->second;

      player_group->AddSocket(socket);
      sockets_map_[socket] = player_group;
      if (!player_group->md5_hash().empty())
        player_group->Broadcast("hash:" + player_group->md5_hash());
    } else {
      player_group = new PlayerGroup();
      groups_map_[group_name_str] = player_group;

      player_group->AddSocket(socket);
      sockets_map_[socket] = player_group;
      LOG(INFO) << "Create new room " << group_name_str;
    }
  }

  void BroadcastCommand(PlayerGroup *group, WebSocket *socket, std::string_view cmd) {
    if (!group) {
      // socket->close();
      return;
    }

    if (socket == group->owner()) {
      group->Broadcast(cmd);
    }
  }

  void UpdateMD5Hash(PlayerGroup *group, WebSocket *socket, std::string_view cmd) {
    if (!group) {
      // socket->close();
      return;
    }

    if (socket == group->owner() && str::has_prefix(cmd, "hash:")) {
      group->Broadcast(cmd);
      group->set_md5_hash(std::string{cmd.substr(5)});
    }
  }

  void RequestForStatus(PlayerGroup *group, WebSocket *socket) {
    if (!group) {
      // socket->close();
      return;
    }

    group->SendCurrentStatus(socket);
  }
};

int main(int argc, char *argv[]) {
  google::InstallFailureSignalHandler();

  std::string path;
  std::string log_folder("./logs");
  int port = 8080;
  int opt;
  while ((opt = getopt(argc, argv, "h:p:l:")) != -1) {
    switch (opt) {
      case 'a':
        path = optarg;
        break;
      case 'p':
        port = std::stoi(optarg);
        break;
      case 'l':
        log_folder = optarg;
        break;
      default:
        std::cerr << "Unknown option " << static_cast<char>(opt) << std::endl;
        return -1;
    }
  }

  FLAGS_alsologtostderr = 1;
  FLAGS_log_dir = log_folder;
  google::InitGoogleLogging(argv[0]);
  auto logger = std::make_shared<FileLogger>(log_folder + "/seasocks.log");

  LOG(INFO) << "Logs is in " << log_folder;

  Server server(logger);

  auto handler = std::make_shared<SyncHandler>(&server);
  server.addWebSocketHandler("/ws", handler);
  server.startListening(port);
  server.loop();

  return 0;
}
