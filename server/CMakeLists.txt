cmake_minimum_required(VERSION 3.3)

project(video_sync VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_subdirectory(seasocks EXCLUDE_FROM_ALL)
add_subdirectory(spdlog EXCLUDE_FROM_ALL)

add_executable(sync_server main.cpp)
target_link_libraries(sync_server PRIVATE seasocks glog spdlog_header_only)
