#!/bin/bash

set -e
set -x

mkdir -p $PREFIX

wget -q https://imshaikot.github.io/srt-webvtt/index.js -O $PREFIX/srt_webvtt.js

wget -q https://cdn.rawgit.com/satazor/SparkMD5/master/spark-md5.min.js -O $PREFIX/spark-md5.min.js
