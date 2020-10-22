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

class Room {
 public:
  Room(std::string_view name, bool enable_chat, std::string_view password)
      : name_(name), enable_chat_(enable_chat), password_(password) {
    token_ = str::gen_random(32);
    last_active_time_ = std::chrono::steady_clock::now();
  }

  void AddMember(WebSocket *socket, std::string prefered_name) {
    auto [iter, created] = members_.emplace(socket, MemberInfo(prefered_name, ++member_id_, socket));

    if (!owner_) {
      owner_ = socket;
      socket->send("r|o|" + iter->second.nickname());
    } else {
      socket->send("r|s|" + iter->second.nickname());
    }

    SendCurrentStatus(socket);
    BroadcastUserCount();

    last_active_time_ = std::chrono::steady_clock::now();
  }

  void RemoveMember(WebSocket *socket) {
    members_.erase(socket);
    if (socket == owner_) {
      if (members_.size() > 0) {
        auto &new_owner = members_.begin()->second;
        owner_ = new_owner.socket();
        owner_->send("r|o|" + new_owner.nickname());
      } else {
        owner_ = nullptr;
      }
    }

    BroadcastUserCount();

    last_active_time_ = std::chrono::steady_clock::now();
  }

  void Broadcast(WebSocket *source, std::string_view data) {
    auto tokens = str::split(data, "|");
    if (tokens.empty())
      return;

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

    if (tokens.size() == 4 && tokens[0] == "source") {
      source_msg_ = std::string(data);
    }

    if (source == nullptr)
      source = owner_;

    for (auto &[socket, member] : members_) {
      if (socket != source)
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

      socket->send("play|" + std::to_string(last_video_timestamp_ + offset));
    } else {
      socket->send("pause|" + std::to_string(last_video_timestamp_));
    }

    if (!source_msg_.empty())
      socket->send(source_msg_);
  }

  int size() const {
    return members_.size();
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

  std::string metadata() const {
    if (password_ != "_") {
      return std::to_string(enable_chat_) + "|*";
    } else {
      return std::to_string(enable_chat_) + "|_";
    }
  }

  std::string password() const {
    return password_;
  }

  std::string token() const {
    return token_;
  }

  bool is_stale() const {
    auto now = std::chrono::steady_clock::now();

    auto inactive_duration = std::chrono::duration_cast<std::chrono::minutes>(
        now - last_active_time_).count();

    return inactive_duration > 5;  // minutes
  }

 private:
  class MemberInfo {
   public:
    MemberInfo(std::string name, int id, WebSocket *socket) : socket_(socket) {
      nickname_ = name + "#" + std::to_string(id);
    }

    std::string nickname() const {
      return nickname_;
    }

    WebSocket* socket() const {
      return socket_;
    }

   private:
    std::string nickname_;
    WebSocket *socket_;
  };

  std::unordered_map<WebSocket*, MemberInfo> members_;
  int member_id_{0};

  WebSocket* owner_{nullptr};
  std::string md5_hash_;

  std::string name_;
  bool enable_chat_;
  std::string password_;

  std::chrono::steady_clock::time_point last_active_time_;

  std::string token_;

  std::string source_msg_;

  bool is_playing_{false};
  double last_video_timestamp_{0};
  std::chrono::steady_clock::time_point last_timestamp_;

  void BroadcastUserCount() {
    for (auto &[socket, _] : members_) {
      socket->send("user_count|" + std::to_string(size()));
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
  }

  void onData(WebSocket *connection, const char *data) {
    Room *player_group = nullptr;
    auto it = sockets_map_.find(connection);
    if (it != sockets_map_.end())
      player_group = it->second;

    std::string_view command{data};
    if (command.length() > 1024) {
      // Message is too long, probably something malicious
      connection->close();
      return;
    }

    if (command == "hb") {
      connection->send("hb");
    } else if (str::has_prefix(command, "qr|")) {
      // Query Room Information
      QueryRoom(connection, command.substr(3));
    } else if (str::has_prefix(command, "cr|")) {
      // Create Room
      if (player_group == nullptr) {
        CreateRoom(connection, command.substr(3));
      } else {
        LOG(ERROR) << "Cannot create room while it is already in other room";
      }
    } else if (str::has_prefix(command, "ar|")) {
      // Access Room, to obtain token
      if (player_group == nullptr) {
        AccessRoom(connection, command.substr(3));
      } else {
        LOG(ERROR) << "Cannot access room while it is already in other room";
      }
    } else if (str::has_prefix(command, "r|j|")) {
      // Join Room
      JoinRoom(player_group, connection, command.substr(4));
    } else if (str::has_prefix(command, "c|b|")) {
      BroadcastCommand(player_group, connection, command.substr(4));
    } else if (str::has_prefix(command, "c|h|")) {
      UpdateMD5Hash(player_group, connection, command.substr(4));
    } else if (command == "c|rs") {
      RequestForStatus(player_group, connection);
    } else {
      /* Craps */
      LOG(ERROR) << "Unrecognized request sent from client: " << data;
      connection->close();
    }

    auto now = std::chrono::steady_clock::now();
    double report_duration = std::chrono::duration_cast<std::chrono::minutes>(
        now - last_reported_time_).count();

    if (report_duration > 5) {
      CleanEmptyGroup();
      ReportStats();
      last_reported_time_ = std::chrono::steady_clock::now();
    }
  }

  void onDisconnect(WebSocket *connection) override {
    auto it = sockets_map_.find(connection);
    if (it == sockets_map_.end())
      return;

    auto player_group = it->second;
    if (player_group)
      player_group->RemoveMember(connection);
    sockets_map_.erase(it);
  }

 private:
  Server *server_;
  std::unordered_map<WebSocket*, Room*> sockets_map_;
  std::unordered_map<std::string, Room*> groups_map_;

  std::chrono::steady_clock::time_point last_reported_time_;

  void QueryRoom(WebSocket *socket, std::string_view room_name) {
    std::string group_name{room_name};

    if (auto it = groups_map_.find(group_name); it != groups_map_.end()) {
      socket->send(it->second->metadata());
    } else {
      LOG(ERROR) << "Room does not exist";
      socket->send("|");
    }
  }

  void CreateRoom(WebSocket *socket, std::string_view room_info) {
    // Room Info must follow this format: "<enable_chat>:<password>"
    auto tokens = str::split(room_info, "|");

    if (tokens.size() != 2) {
      LOG(ERROR) << "Receive invalid create room request: " << room_info;
      return;
    }

    std::string group_name = str::gen_random(6);
    while (groups_map_.count(group_name))
      group_name = str::gen_random(6);

    auto player_group = new Room(group_name, tokens[0] == "1", tokens[1]);
    groups_map_[group_name] = player_group;

    LOG(INFO) << "Create new room " << group_name;

    socket->send(group_name + "|" + player_group->token());
  }

  void AccessRoom(WebSocket *socket, std::string_view room_access) {
    // <room_name>:<password>
    auto tokens = str::split(room_access, "|");

    if (tokens.size() != 2) {
      LOG(ERROR) << "Receive invalid access room request: " << room_access;
      return;
    }

    std::string group_name{tokens[0]};

    if (auto it = groups_map_.find(group_name); it != groups_map_.end()) {
      auto player_group = it->second;

      if (tokens[1] == player_group->password())
        socket->send(player_group->token());
      else
        socket->send("x");
    } else {
      LOG(ERROR) << "Invalid room";
    }
  }

  void JoinRoom(Room *group, WebSocket *socket, std::string_view join_info) {
    if (group)
      group->RemoveMember(socket);

    auto tokens = str::split(join_info, "|");

    if (tokens.size() != 3) {
      LOG(ERROR) << "Receive invalid join room request: " << join_info
                 << " tokens_size=" << tokens.size();
      return;
    }

    std::string group_name{tokens[0]};

    Room *player_group{nullptr};
    if (auto it = groups_map_.find(group_name); it != groups_map_.end()) {
      auto player_group = it->second;

      if (tokens[1] == player_group->token()) {
        player_group->AddMember(socket, std::string(tokens[2]));
        sockets_map_[socket] = player_group;
        if (!player_group->md5_hash().empty())
          player_group->Broadcast(nullptr, "hash|" + player_group->md5_hash());
      } else {
        socket->send("x");
      }
    } else {
      LOG(ERROR) << "Join request to non-exist room";
      socket->send("n");
    }
  }

  void BroadcastCommand(Room *group, WebSocket *socket, std::string_view cmd) {
    if (!group) {
      // socket->close();
      return;
    }

    if (socket == group->owner() || cmd.rfind("chat|", 0) == 0) {
      group->Broadcast(socket, cmd);
    }
  }

  void UpdateMD5Hash(Room *group, WebSocket *socket, std::string_view cmd) {
    if (!group) {
      // socket->close();
      return;
    }

    if (socket == group->owner() && str::has_prefix(cmd, "hash|")) {
      group->Broadcast(socket, cmd);
      group->set_md5_hash(std::string{cmd.substr(5)});
    }
  }

  void RequestForStatus(Room *group, WebSocket *socket) {
    if (!group) {
      // socket->close();
      return;
    }

    group->SendCurrentStatus(socket);
  }

  void CleanEmptyGroup() {
    int cnt{0};
    for (auto it = groups_map_.begin(); it != groups_map_.end();) {
      if (it->second->size() == 0 && it->second->is_stale()) {  // no users in the group
        it = groups_map_.erase(it);
        ++cnt;
      } else {
        ++it;
      }
    }

    LOG(INFO) << cnt << " empty group(s) removed";
  }

  void ReportStats() {
    LOG(INFO) << "Stats - users: " << sockets_map_.size() << "; room: " << groups_map_.size();
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
