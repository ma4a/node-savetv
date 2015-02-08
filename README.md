A set of node.js scripts to download recordings from www.save.tv
================================================================

This is a toolset that allows you to manage and download recordings from the Germany TV Website www.save.tv. In order to use the tools you have to have a paid account on the website. The toolset is only tested with a premium account where you can record in h.264 format. If you only have a standard account with avi recordings your milage may vary. Feel free to send me a message in case you have an avi only account so we can make the necessary adjustments for avi to work. 

Prerequisites
-------------

The download script depends on the existence of wget. You can get a version of wget for Windows from http://gnuwin32.sourceforge.net/packages/wget.htm. A version for the Mac from http://osxdaily.com/2012/05/22/install-wget-mac-os-x/. Linux wget is typically installed with the base OS. We have tried the two wgets but typically any wget should do the trick. Make sure that once installed the path wget resides in is part of the PATH variable and can be seen on the command line without specifying the path.

Installation
------------
Install node.js from http://nodejs.org/. Once installed clone or download the github repository to a directory of your choice on your machine. Run the package manager to install dependencies into the directory with 
```
npm install
```
this will read package.json and get the required dependencies from the npm repository

Getting started
---------------
Download recordings to a specified directory. you can manipulate the behaviour of the script with the following parameters by changing them inside the sript near the top.

| Parameter | Default | Description |
| ------------- | ------------- |
| RECORDING_FORMAT | 6 | changes what format should be downloaded. valid parameters are: 6 = HD, 5 = h.264 High Quality, 4 = h.264 Mobile|
| DEL_REC_AFTER_DOWNLOAD | true | deletes the recording on save.tv after successfull download |
| ADDFREE | true | download the add free version of a file. if there is no add free version skip the download | 

```
node savetv.js -u <username> -p <password>  [ -d <directory_to_save_files_to> ]
```
-d is optional. If you do not specify the directory the directory you are currently in is used. If you specify a directory make sure this directory exists. The tool will not create it automatically.

Delete duplicates on www.save.tv. This tool can be used to check for duplicates. This typically happens when you have scheduled recordings via the Channels functionality and a recording is aired multiple time on the same or on various channels.
```
node savetv_delete_duplicates.js -u <username> -p <password> 
```
Delete the recordings that you have previously downloaded and still on your hard drive. This can be used to build a library over time and prevent previously downloaded recordings from being recorded again. This tool depends on a specific file name being present. Right now Title - Subtitle.mp4 is the expected file naming convention and the tools
is hardcoded for mp4 files.
```
node savetv_check_against_downloaded.js -u <username> -p <password> -d <directory_to_search>
```


 