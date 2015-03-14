var https = require('https');
var qs = require('querystring');
var async = require('async');
var path = require('path');
var exec = require('child_process').exec;
var fs = require('fs');
var Datastore = require('nedb'), db = new Datastore({
	filename : './savetv.db', autoload : true}); 

/*
 * constants that need adjustment based on save.tv user
 * preferences.
 */
var DOWNLOAD_DIR = '.';   // directory to download the files to. directory has to exist
                                                // as otherwies the script will break
var SIMULTANOUS_DOWNLOADS = 3;  // number of simultanous downloads
var DEL_REC_AFTER_DOWNLOAD = true; // should the script delete the video on save.tv after successfull download
var ADDFREE = true;  // download the add free version of a file. if there is no add free version skip the download
var RECORDING_FORMAT = 6 // select the recording format to download. Current options 4 = mobile, 5 = h.264 sd, 6 = h.264 hd 
// parameters to be implement in the future
// var RECORDING_FORMATS = { 6 : 'HD (BETA)', 5: 'H.264 High Quality', 4 : 'H.264 Mobile'];

var stdio = require('stdio');
var ops = stdio.getopt({
	'username': {key: 'u', args: 1, mandatory: true, description: 'save.tv username'},
	'password': {key: 'p', args: 1, mandatory: true, description: 'save.tv password'},
	'downloadto' : {key: 'd', args: 1, description: 'save downloads to directory'}
});
// if download directory was specified via command line parameter overwrite default
if(ops.downloadto)
	DOWNLOAD_DIR = path.normalize(ops.downloadto + path.sep);

var post_data = qs.stringify({
	 sUsername : ops.username,
	 sPassword : ops.password,
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
	path : '/STV/M/obj/archive/JSON/VideoArchiveApi.cfm?bAggregateEntries=false&iEntriesPerPage=100000&iRecordingState=1',
	headers : { 'Accept' : '*/*',
                'Cookie' : ''
	}
}

var downloadUrl_options = {
	hostname : 'www.save.tv',
	path_base : 'https://www.save.tv/STV/M/obj/cRecordOrder/croGetDownloadUrl.cfm',
	path : '',
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

var delete_options  = {
	hostname : 'www.save.tv',
	path_base : 'https://www.save.tv/STV/M/obj/cRecordOrder/croDelete.cfm',
	path : '',
	headers : { 'Accept' : '*/*',
                'Cookie' : ''
	}
}


function download_file_wget(file_url, file_name, callback) {

	var wget_options = { 
			encoding: 'binary',
			maxBuffer: 5000*1024,
	}

    // compose the wget command
    var wget = 'wget -c -O "' + file_name + '" ' + file_url;

    console.log('Downloading to %s from %s', file_name, file_url);
    
    // excute wget using child_process' exec function
    exec(wget, { encoding: 'binary',
			maxBuffer: 5000*1024 } ,function(err, stdout, stderr) {
        if (err) callback(new Error(err));
        else console.log(file_name + ' downloaded.');
        callback();
    });
};



function download_recording(recording, callback){

    downloadUrl_options.path = downloadUrl_options.path_base + '?TelecastId=' 
         + recording.ITELECASTID + '&iFormat=' + RECORDING_FORMAT + '.0&bAdFree=' + ADDFREE;

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
	            var file_name = DOWNLOAD_DIR + recording.STITLE + ' - ' + recording.SSUBTITLE + '.mp4';
				// add a check if the file already exists then most likely there are two recordings of the same show on save.tv
				// and another thread is downloading the fist one. hence we skip downloading that file
				if (!fs.existsSync(file_name)){
				
					download_file_wget(downloadUrl, file_name , function(err) {
						if(err) console.log('An error occured during download ', err);
						else {
							db.insert(recording, function(err, newRecording){});

							if(DEL_REC_AFTER_DOWNLOAD){
								
								delete_options.path =  delete_options.path_base + '?TelecastID=' + recording.ITELECASTID;
								var delete_request = https.request(delete_options, function(res){ 
									
									  var body = '';

									  res.on('data', function(chunk){
										body += chunk;
									  }) 

									  res.on('end', function(){
										console.log('Deleted recording - %s - %s on www.save.tv', recording.STITLE, recording.SSUBTITLE);
									  });

								}).end();
							}
						}
					    callback();
					});
				}

	        } else {
	        	console.log('Error when trying to get the url to the recording %s. The error was: %s', obj.ARRVIDEOURL[0], obj.ARRVIDEOURL[2] );
	        	callback();
	        }
	     });
	});

    downloadUrl_req.end();
}

list_callback = function(res){

    var list = '';
	res.setEncoding('utf8');

	res.on('data', function(chunk){
    	list += chunk;
	});

    res.on('end', function(){

	 	var obj = JSON.parse(list);

    	obj.ARRVIDEOARCHIVEENTRIES.forEach(function(telecast){
			  
			  if(telecast.BISGROUP === false){
			  
    		      var recording = telecast.STRTELECASTENTRY;

	        	  db.findOne({ ITELECASTID : recording.ITELECASTID }, function(err, doc){
		        	  	if (doc === null){
		        	  		// push the recording into the download queue
	                        queue.push(recording);
		        	  		console.log('Found new recording - %s - %s', recording.STITLE, recording.SSUBTITLE);
		        	  	} else {
		        	  		console.log('Recording - %s - %s already downloaded', recording.STITLE, recording.SSUBTITLE);
		        	  	}
	        	  });
			   } else {
			      console.log('Found subgrup with name %s.', telecast.STITLE); 
			   }
        });

    });
}

logon_callback = function(res){

    res.setEncoding('utf8');
 	 
    res.on('data', function(body){
        if(body.indexOf('Login_Succeed') > -1){
          console.log('Login to www.save.tv successful');
          downloadUrl_options.headers.Cookie = list_options.headers.Cookie 
             = logout_options.headers.Cookie = delete_options.headers.Cookie = res.headers['set-cookie'][0].split(';')[0];
	  var list_req = https.request(list_options, list_callback).end(); 
    	} else {
    		console.log('Login to www.save.tv failed');
    	}
    });

}

// create a queue to download recordings simultaneously and queue the rest. The number of
// simultaneous recordings is specified with constant SIMULTANOUS_DOWNLOADS
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

