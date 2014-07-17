var https = require('https');
var qs = require('querystring');
var async = require('async');
var exec = require('child_process').exec;
var Datastore = require('nedb'), db = new Datastore({
	filename : './savetv.db', autoload : true}); 

/*
 * constants that need adjustment based on save.tv user
 * preferences.
 */
var DOWNLOAD_DIR = './downloads/';   // directory to download the files to. 
                                     // please end with delimiter and create directory before
                                     // first use. the script will otherwise error
var SIMULTANOUS_DOWNLOADS = 3;  // number of simultanous downloads
var USERNAME = <Username>; // save.tv username
var PASSWORD = <Password>; // save.tv password

// parameters to be implement in the future
// var ADDFREE = true, false;
// var RECORDING_VERSIONS = ['standard', 'hd', 'mobile'];

var post_data = qs.stringify({
	 sUsername : USERNAME,
	 sPassword : PASSWORD,
	 value : 'Login'
});

var logon_options = {
	hostname : 'www.save.tv',
	path : '/STV/M/Index.cfm?sk=PREMIUM',
	headers : {
	   			'Accept' : '*/*',
       			'Content-Type' : 'application/x-www-form-urlencoded',
       			'Content-Length' :  post_data.length },
	method: 'POST'
}

var list_options = {
	hostname : 'www.save.tv',
	path : '/STV/M/obj/archive/JSON/VideoArchiveApi.cfm',
	headers : { 'Accept' : '*/*',
                'Cookie' : ''
	}
}

var downloadUrl_options = {
	hostname : 'www.save.tv',
	path : 'https://www.save.tv/STV/M/obj/cRecordOrder/croGetDownloadUrl.cfm',
	headers : { 'Accept' : '*/*',
                'Cookie' : ''
	}
}

var logout_options = {
	hostname : 'www.save.tv',
	path : 'https://www.save.tv/STV/M/obj/user/usLogout.cfm',
	headers : { 'Accept' : '*/*',
                'Cookie' : ''
	}
}

// crate wget child process to download the recording
function download_file_wget(file_url, file_name, callback) {

	var wget_options = { 
			encoding: 'binary',
			maxBuffer: 5000*1024,
	}

    // compose the wget command
    var wget = 'wget -c -O "' + file_name + '" ' + file_url;

    console.log('Downloading %s from %s', file_name, file_url);
    
    // excute wget using child_process' exec function
    exec(wget, { encoding: 'binary',
			maxBuffer: 5000*1024 } ,function(err, stdout, stderr) {
        if (err) callback(new Error(err));
        else console.log(file_name + ' downloaded.');
        callback();
    });
};


// retreive the url from where to download the recording and initiate the downlod
function download_recording(recording, callback){

    downloadUrl_options.path = 'https://www.save.tv/STV/M/obj/cRecordOrder/croGetDownloadUrl.cfm?TelecastId=' + recording.ITELECASTID + 
                      '&iFormat=5.0&bAdFree=true';

	// get the download url for the recording
	var downloadUrl_req = https.request(downloadUrl_options, function(res){
	
		res.setEncoding('utf8');
		var list = '';

		res.on('data', function(chunk){
			list += chunk;
		});

		res.on('end', function(){

	        var obj = JSON.parse(list);
	        if (obj.ARRVIDEOURL[1] === 'OK'){
               
	            downloadUrl = obj.ARRVIDEOURL[2];
	            var file_name = DOWNLOAD_DIR + recording.STITLE + '-' + recording.SSUBTITLE + '.mp4';
	            download_file_wget(downloadUrl, file_name , function(err) {
	            	if(err) console.log('An error occured during download ', err);
	            	else  db.insert(recording, function(err, newRecording){});
	            	callback();
	            });

	        } else {
	        	console.log('Error when trying to get the url to the recording %s. The error was: %s', obj.ARRVIDEOURL[0], obj.ARRVIDEOURL[2] );
	        	callback();
	        }
	     });
	});

    downloadUrl_req.end();
}

// callback function for retreiveing the list of recordings and queue them up
list_callback = function(res){

    var list = '';
	res.setEncoding('utf8');

	res.on('data', function(chunk){
    	list += chunk;
	});

    res.on('end', function(){

	 	var obj = JSON.parse(list); 	

    	obj.ARRVIDEOARCHIVEENTRIES.forEach(function(recording){

        	  db.findOne({ ITELECASTID : recording.ITELECASTID }, function(err, doc){
	        	  	if (doc === null){
	        	  		// push the recording into the download queue
                        queue.push(recording);
	        	  		console.log('Found new recording - %s - %s', recording.STITLE, recording.SSUBTITLE);
	        	  	} else {
	        	  		console.log('Recording - %s - %s already downloaded', recording.STITLE, recording.SSUBTITLE);
	        	  	}
        	  });
        });

    });
}

// callback function for logon to save.tv
logon_callback = function(res){

	res.setEncoding('utf8');
 	 
 	res.on('data', function(body){
    	if(body.indexOf('Login_Succeed') > -1){
        	console.log('Login to www.save.tv successful');
        	downloadUrl_options.headers.Cookie = list_options.headers.Cookie 
        	     = logout_options.headers.Cookie = res.headers['set-cookie'][0].split(';')[0];
    	} else {
    		console.log('Login to www.save.tv failed');
    	}
 	});

 	res.on('end', function(body){
 	   var list_req = https.request(list_options, list_callback).end(); 
    });

}

// create a queue to download recordings simultanously and queue the rest
var queue = async.queue(download_recording, SIMULTANOUS_DOWNLOADS);

queue.drain = function(){
    // log out of the website
    var logout_req = https.request(logout_options, function(res){
    
		res.setEncoding('utf8');
		var list = '';

		res.on('data', function(chunk){
            list += chunk;
		})

		res.on('end', function(){
             console.log('Logged out of www.save.tv', list);
		});

    }).end();
}

var logon_req = https.request(logon_options, logon_callback)
logon_req.write(post_data);
logon_req.end();

