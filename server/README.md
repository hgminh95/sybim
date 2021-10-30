# Server

## Requirements

- GCC with C++20 support
- Bazel
- Internet

## How to use

```
# To build
$ bazel build server:sybim

# To build and run
$ bazel run server:sybim -- -port 8080

# To build and run in production
$ bazel run --config opt server:sybim -- -port 8080
```
