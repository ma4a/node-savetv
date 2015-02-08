A set of node.js scripts to download recordings from www.save.tv
================================================================

The toolset can be used to managed and download recordings from www.save.tv. 

Prerequisites
-------------

The download script depends on the existance of wget. You can get a version of wget for Windows from http://gnuwin32.sourceforge.net/packages/wget.htm. A version for the Mac from http://osxdaily.com/2012/05/22/install-wget-mac-os-x/. Linux wget is typically installed with the base OS. We have tried the two wgets but typically any wget should do the trick.

Installation
------------
Install node.js from http://nodejs.org/. Once installed clone or download the github repository to a directory of your choice on your machine. Run the package manager to install dependencies into the directory with 
```
npm install
```
this will read package.json and get the required dependencies from the npm repository

Getting started
---------------
Download recordings to a specified directory. you can maniplulate the type to download inside the file by changing the parameter RECORDING_FORMAT. 6 = HD, 5 = h.264 High Quality, 4 = h.264 Mobile. 
```
node savetv.js -u <savetv_user> -p <savetv_password>  [ -d <directory_to_save_files_to> ]
```
-d is optional. If you do not specify the directory the directory you are currently in is used. If you specify a directory make sure this directory exists. The tool will not creat it automatically.

Delete duplicates on www.save.tv. This tool can be used to check for duplicates. This typically
happens when you have scheduled recordings via the Channels functionality and a recording is aired multiple time on the same or on various channels.
```
node savetv_delete_duplicates.js -u <savetv_user> -p <savetv_password> 
```
Delete the recordings that you have previously downloaded and still on your harddrive. This can be used to build a library over time and prevent previously downloaded recordings from being recorded again. This tool depends on a specific file name being present. Right now Title - Subtitle.mp4 is the expected file naming convention.
```
node savetv_check_against_downloaded.js -u <savetv_user> -p <savetv_password> -d <directory_to_search>
```


 