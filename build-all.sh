#!/bin/bash
if [ $# -lt 1 ]; then
    echo "./build-all.sh <connection_string>"
else 
    rm -frv ../emohd-build;
    #../emohd-extra/build-v2.sh ;
    ../emohd-extra/build.sh ;
    ../emohd-extra/build-android;
    #scp ../emohd-build/emohd.tgz $1:/opt
fi
