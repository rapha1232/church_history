#!/bin/bash
set -e
cd /home/user/church
rm -rf /home/user/church/site/img
python3 tools/build_media.py | tail -1
python3 tools/series.py
python3 tools/extras.py
python3 tools/extras2.py
python3 tools/extras3.py
python3 tools/extras4.py
python3 tools/extras5.py
python3 tools/extras6.py
python3 tools/extras7.py
