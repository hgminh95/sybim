workspace(
    name = "sybim",
)

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "seasocks",
    urls = [
        "https://github.com/mattgodbolt/seasocks/archive/refs/tags/v1.4.4.tar.gz",
    ],
    strip_prefix = "seasocks-1.4.4",
    sha256 = "5ec016ee87d4985a031212fa23a00de3de5f0fa1ceb82d7b9a3d1c189356bf8d",
    build_file = "//third_party:seasocks.BUILD"
)

http_archive(
    name = "com_github_gflags_gflags",
    sha256 = "34af2f15cf7367513b352bdcd2493ab14ce43692d2dcd9dfc499492966c64dcf",
    strip_prefix = "gflags-2.2.2",
    urls = ["https://github.com/gflags/gflags/archive/v2.2.2.tar.gz"],
)

http_archive(
    name = "com_github_google_glog",
    sha256 = "21bc744fb7f2fa701ee8db339ded7dce4f975d0d55837a97be7d46e8382dea5a",
    strip_prefix = "glog-0.5.0",
    urls = ["https://github.com/google/glog/archive/v0.5.0.zip"],
)


