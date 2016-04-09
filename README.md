A set of node.js scripts to download recordings from www.save.tv
================================================================

This is a toolset that allows you to manage and download recordings from the Germany TV Website www.save.tv. In order to use the tools you have to have a paid account on the website.

Prerequisites
-------------

The download script depends on the existence of wget. You can get a version of wget for Windows from http://gnuwin32.sourceforge.net/packages/wget.htm. A version for the Mac from http://osxdaily.com/2012/05/22/install-wget-mac-os-x/. Linux wget is typically installed with the base OS or can be easily install with the respective package manager with ```apt-get -y install wget``` or ```yum -y install wget```. I am currently using the Windows and Mac wgets but typically any wget should do the trick. Make sure that once installed the path to wget is part of the PATH variable and can be seen on the command line without specifying the path.

Installation
------------
Install node.js from http://nodejs.org/. Once installed clone or download the github repository to a directory of your choice on your machine and run the package manager to install dependencies into the directory with 
```
npm install
```
this will read package.json and get the required dependencies from the npm repository

Getting started
---------------
Download recordings to a specified directory. 
```
node savetv.js -u <username> -p <password>  [ -d <directory_to_save_files_to> ]
```
-d is optional. If you do not specify the directory the directory you are currently in is used. If you specify a directory make sure this directory exists. The tool will not create it automatically. The script will find the best quality avaiable for each recordings and download. You can manipulate the behavior of the script with the following parameters by changing them inside the script near the top.

| Parameter | Default | Description |
| ------------- | ------------- |------------- |
| DEL_REC_AFTER_DOWNLOAD | true | deletes the recording on save.tv after successful download |
| ADDFREE | true | download the add free version of a file. if there is no add free version skip the download | 


Delete duplicates on www.save.tv. This tool can be used to check for duplicates. This typically happens when you have scheduled recordings via the Channels functionality and a recording is aired multiple time on the same or on various channels.
```
node savetv_delete_duplicates.js -u <username> -p <password> 
```
Delete the recordings that you have previously downloaded and still on your hard drive. This can be used to build a library over time and prevent previously downloaded recordings from being recorded again. This tool depends on a specific file name being present. Right now Title - Subtitle.mp4 is the expected file naming convention and the tools
is hardcoded for mp4 files.
```
node savetv_check_against_downloaded.js -u <username> -p <password> -d <directory_to_search>
```


 