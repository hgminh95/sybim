#!/bin/bash

set -e 
set -x

PREFIX=static/third_party

mkdir -p $PREFIX

wget -q https://vjs.zencdn.net/7.7.6/video-js.css -O $PREFIX/video-js.css
wget -q https://vjs.zencdn.net/7.7.6/video.js -O $PREFIX/video.js

wget -q https://imshaikot.github.io/srt-webvtt/index.js -O $PREFIX/srt_webvtt.js

wget -q https://cdn.rawgit.com/satazor/SparkMD5/master/spark-md5.min.js -O $PREFIX/spark-md5.min.js

