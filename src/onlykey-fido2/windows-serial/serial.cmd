


@ECHO OFF

SET PROJECTDIR=%~dp0
cd %PROJECTDIR%

set NODEVERSION=13.13.0
set NWJSVERSION=0.45.2

set NODE=%PROJECTDIR%nw-node\node-v%NODEVERSION%-win-x64
set NODE_PATH=%PROJECTDIR%nw-node\node-v%NODEVERSION%-win-x64\node_modules

SET PATH=%PROJECTDIR%nw-node\nwjs-sdk-v%NWJSVERSION%-win-x64;%PROJECTDIR%nw-node\node-v13.13.0-win-x64;%PATH%


start nw ./
