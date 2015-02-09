var https = require('https');
var qs = require('querystring');
var stdio = require('stdio');
var name_list = [];

var ops = stdio.getopt({
	'username': {key: 'u', args: 1, mandatory: true, description: 'save.tv username'},
	'password': {key: 'p', args: 1, mandatory: true, description: 'save.tv password'}
});

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
				  title_subtitle = recording.STITLE + " " + recording.SSUBTITLE;
				  if(name_list.indexOf(title_subtitle) === -1){
					  name_list.push(title_subtitle);
					  console.log('New recording, %s - %s', recording.STITLE, recording.SSUBTITLE);
				  } else {
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

var logon_req = https.request(logon_options, logon_callback)
logon_req.write(post_data);
logon_req.end();

