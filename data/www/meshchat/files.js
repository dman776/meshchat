var free_space = 0;

$(function() {
    load_files();
    setInterval(function() {
        load_files()
    }, 10000);
    var file = null;
    $('#upload-file').on("change", function(event) {
        file = event.target.files[0];
        console.log(event.target.files[0].size);

        if (event.target.files[0].size > free_space) {
        	ohSnap('Not enough free space for your file, delete some files first and try again', 'red');
        	$('#upload-file').val('');
        	event.preventDefault();
        }
    });
    $("#upload-button").on("click", function(event) {
        event.preventDefault();
        //$('#upload-form').submit();

        var file_data = new FormData();

        if (file == null) return;

        file_data.append('uploadfile', file);
        
        $.ajax({
	        url: '/cgi-bin/meshchat?action=upload_file',
            type: "POST",
            data: file_data,
            dataType: "json",
            context: this,
            cache: false,
            processData: false,
            contentType: false,
            beforeSend: function() {
            	$('progress').removeClass('hidden');
            },
            xhr: function() {
            	var myXhr = $.ajaxSettings.xhr();
	            if(myXhr.upload){
    	            myXhr.upload.addEventListener('progress', upload_progress, false);
        	    }
            	return myXhr;
	        },
    	    success: function(data) 
    	    {
    	    	if (data.status == 200) {
	    	    	ohSnap('File uploaded', 'green');
	    	    } else {
					ohSnap(data.response, 'red');
	    	    }
    	    	load_files();
          	},
          	error: function(data, textStatus, errorThrown)
            {
            	ohSnap('File upload error');
            },
            complete: function(jqXHR, textStatus) {
            	$('progress').addClass('hidden');
            }
	    });		
    });
});

function upload_progress(event) {
	if (event.lengthComputable){
        $('progress').attr({ value: event.loaded, max: event.total});
        console.log(event.loaded);
        console.log(event.total);
    }
}

function load_files() {
    $.getJSON('/cgi-bin/meshchat?action=files', function(data) {
   		console.log(data);
        var html = '';
        for (var i = 0; i < data.files.length; i++) {
            var date = new Date(0);
            date.setUTCSeconds(data.files[i].epoch);
            html += '<tr>';
            html += '<td><a href="http://' + data.files[i].node + ':8080/cgi-bin/meshchat?action=file_download&file=' + encodeURIComponent(data.files[i].file) + '">' + data.files[i].file + '</a></td>';
            html += '<td>' + numeral(data.files[i].size).format('0.0 b') + '</td>';
            html += '<td>' + data.files[i].node + '</td>';
            html += '<td>' + format_date(date) + '</td>';
            if (data.files[i].local == 1) {
	            html += '<td><button class="delete-button button-primary" file-name="' + data.files[i].file + '">Delete</button></td>';
	        } else {
				html += '<td></td>';
	        }
            html += '</tr>';
        }
        $('#files-table').html(html);

        $('#total-bytes').html('Total Storage: ' + numeral(data.stats.allowed).format('0.0 b'));
        $('#free-bytes').html('Free Storage: ' + numeral(data.stats.files_free).format('0.0 b'));

        free_space = data.stats.files_free;

        $(".delete-button").on("click", function(event) {
       		event.preventDefault();

	        $.ajax({
		        url: '/cgi-bin/meshchat?action=delete_file&file=' + encodeURIComponent($(this).attr('file-name')),
        	    type: "GET",
    	    	success: function(data) 
	    	    {
    		    	ohSnap('File deleted', 'green');
    		    	load_files();
          		},
	          	error: function(data, textStatus, errorThrown)
    	        {
        	    	ohSnap('File delete error: ' + data, 'red');
            	}
		    });
    	});
    });
}