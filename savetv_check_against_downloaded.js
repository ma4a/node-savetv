var fs = require('fs');
var path = require('path');
var CHECK_DIR = ".";
var https = require('https');
var qs = require('querystring');

var stdio = require('stdio');
var ops = stdio.getopt({
	'username': {key: 'u', args: 1, mandatory: true, description: 'save.tv username'},
	'password': {key: 'p', args: 1, mandatory: true, description: 'save.tv password'},
	'directory' : {key: 'd', args: 1, description: 'Search directory'}
});
if(ops.directory)
	CHECK_DIR = ops.directory

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
	path : '/STV/M/obj/archive/JSON/VideoArchiveApi.cfm?bAggregateEntries=false&iEntriesPerPage=100000&iRecordingState=0',
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
				  var arrayFound = name_list.filter(function(item){
					  if(item.title === recording.STITLE.trim() && item.subtitle === recording.SSUBTITLE.trim()){
						return item;
					  }
				  });
				  
				  // if we found the recording in the list of files read from the directory we delete it on save.tv
				  if(arrayFound.length > 0){
					  delete_options.path =  delete_options.path_base + '?TelecastID=' + recording.ITELECASTID;
					  var delete_request = https.request(delete_options, function(res){ 
									
					  var body = '';

						  res.on('data', function(chunk){
							body += chunk;
						  }) 

						  res.on('end', function(){
							console.log('Duplicate recording, %s - %s, was deleted on www.save.tv', recording.STITLE, recording.SSUBTITLE);
						 });
					
					}).end();
				  }  else {
				  		 console.log("Recording %s - %s is new", recording.STITLE, recording.SSUBTITLE);
				  }

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

var walk_dir = function(dir, done){
	var results = [];
	fs.readdir(dir, function(err, files){
		if (err) return done(err);
		var pending = files.length;
		if (!pending) return done(null, results);
		files.forEach(function(file){
			file = path.resolve(dir, file);
			fs.stat(file, function(err, stat){
				 if (stat && stat.isDirectory()){ 
					walk_dir(file, function(err, res) {
						results = results.concat(res);
						if (!--pending) done(null, results);
					});
				 } else {
					 file = file.split("\\");
					 var len = file.length;
					 file = file[len-1];
					 if(file.toUpperCase().indexOf("MP4") > -1){
						var fname_split = file.split("-");
						if(fname_split.length === 2){
							var subtitle = fname_split[1].split(".")[0].trim();
							var item = { title: fname_split[0].split("#")[0].trim(), subtitle: subtitle } ;
							results.push(item);							
						}
						if(fname_split.length === 3){
							var subtitle = fname_split[2].split(".")[0].trim();
							var actor = fname_split[1].trim();
							var number = fname_split[0].split(" ")[1].replace("#","");
							var year = fname_split[0].split(" ")[2];
							var item = { title: fname_split[0].split("#")[0].trim(),
							       number: number, year: year, actor: actor, subtitle: subtitle } ;
							results.push(item);
						}	
					 }
					 if (!--pending) done(null, results);
				 }
            
			});
		});
	});
};

// Walk through the directory and subdirectories to find all files with an
// ending of mp4
walk_dir(CHECK_DIR,function(err, results){
	
	name_list = results;
	// console.log(name_list);
	
    // logon to Savetv and start checking agains all programmed recordings
    // if the recording already exists on the local file system delete it from SaveTV	
  	var logon_req = https.request(logon_options, logon_callback);
	logon_req.write(post_data);
	logon_req.end();
});








