load("@sybim//bazel:expand_template.bzl", "cmake_substitutions", "expand_template")

_SUBSTITUTIONS = {
  "@PROJECT_VERSION@": "1.4.4",
  "@DEFLATE_SUPPORT_BOOL@": "false",
}

expand_template(
    name = "config_h",
    out = "internal/Config.h",
    substitutions = _SUBSTITUTIONS,
    template = "cmake/Config.h.in",
)

py_binary(
    name = "gen_embedded",
    srcs = [
        "scripts/gen_embedded.py",
    ],
)

filegroup(
    name = "embedded_files",
    srcs = [
        "src/main/web/_404.png",
        "src/main/web/_error.css",
        "src/main/web/_error.html",
        "src/main/web/_jquery.min.js",
        "src/main/web/_seasocks.css",
        "src/main/web/_stats.html",
        "src/main/web/favicon.ico",
    ],
)

genrule(
    name = "embedded_cpp",
    srcs = [
        ":embedded_files",
    ],
    outs = [
        "Embedded.cpp"
    ],
    cmd = """
        python3 $(location :gen_embedded) -o $@ -f $(locations :embedded_files)
    """,
    tools = [":gen_embedded"],
)

cc_library(
    name = "seasocks",
    hdrs = glob([
        "src/main/c/**/*.h",
    ]) + [
        "internal/Config.h",
    ],
    srcs = glob([
        "src/main/c/**/*.cpp",
    ], exclude = [
        "src/main/c/seasocks/ZlibContext.cpp",
    ]) + [
        "Embedded.cpp",
    ],
    includes = ["src/main/c"],
    visibility = ["//visibility:public"],
)
