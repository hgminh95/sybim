#include "seasocks/Logger.h"
#include "spdlog/spdlog.h"
#include "spdlog/async.h" //support for async logging.

#include "spdlog/sinks/rotating_file_sink.h"

class FileLogger : public seasocks::Logger {
 public:
  FileLogger(const std::string &fp) {
    async_file_ = spdlog::rotating_logger_mt<spdlog::async_factory>(
        "file_logger", fp, 1024 * 1024 * 100, 5);
  }

  ~FileLogger() override {};

  void log(Level level, const char* message) {
    switch (level) {
      case Level::Debug:
        async_file_->debug(message);
      case Level::Access:
      case Level::Info:
        async_file_->info(message);
        break;
      case Level::Warning:
        async_file_->warn(message);
        break;
      case Level::Error:
      case Level::Severe:
        async_file_->error(message);
        break;
      default:
        async_file_->info("UNK - {}", message);
        break;
    }
  }

 private:
  std::shared_ptr<spdlog::logger> async_file_;
};
