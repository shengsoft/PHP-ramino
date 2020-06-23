//console.log("%cWelcome to chat", "color: #1BA3F9; font-size: 4em");

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};
function ago(date) {
    var plurial;
    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);
    if (interval > 0) {
        plurial= (interval>1)?'s':'';
        return sprintf(chatHTML5.traductions.yearsAgo, interval, plurial);
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 0) {
        plurial= (interval>1)?'s':'';
        return sprintf(chatHTML5.traductions.monthsAgo, interval, plurial);
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 0) {
        plurial= (interval>1)?'s':'';
        return sprintf(chatHTML5.traductions.daysAgo, interval, plurial);
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 0) {
        plurial= (interval>1)?'s':'';
        return sprintf(chatHTML5.traductions.hoursAgo, interval, plurial);
    }
    interval = Math.floor(seconds / 60);
    if (interval > 0) {
        plurial= (interval>1)?'s':'';
        return sprintf(chatHTML5.traductions.minutesAgo, interval, plurial);
    }
    return chatHTML5.traductions.now;
}
function detectmob() {
    return (screen.width <= 800);
}


String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10);
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    if (hours   < 10) {hours   = '0'+hours;}
    if (minutes < 10) {minutes = '0'+minutes;}
    if (seconds < 10) {seconds = '0'+seconds;}
    var time = hours+':'+minutes+':'+seconds;
    return time;
};

String.prototype.linkify = function() {
    var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;
    var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

    return this
        .replace(urlPattern, '<a target="_blank"  class="link" href="../$&">$&</a>')
        .replace(pseudoUrlPattern, '$1<a target="_blank" class="link" href="http://$2">$2</a>')
        .replace(emailAddressPattern, '<a target="_blank" href="mailto:$&">$&</a>');
};




var ChatHTML5 = function(room, config, traductions) {
    this.room = room;
    var colors = ['#FF0000','#CC0000','#AA0000','#880000','#440000','#000000','#440000','#880000','#AA0000','#CC0000','#FF0000'];
    var colorsIndex = 0;
    this.timeCounter = 0;
    this.timeCounterInterval = {};
    this.config = config;
    this.users = {};
    this.rooms = {};
    this.muted = {};
    this.jailedUsers = {};
    this.askedPrivate = {};
    this.forbiddenToWatchMe = {};
    this.allowedToWatchMe = {};
    this.news = {};
    this.genders = {};
    this.friendsOnline = {};
    this.currentTalkerid = 0;
    this.forbiddenWords = Array();
    this.privateInvitations = {};
    this.traductions = traductions;
    var tabs = $('#tabs').bootstrapDynamicTabs();
    this.soundMP3 = new Audio();


    $('#webcamsContainer').sortable({cancel:'.webcamClass'});
    $('#webcamsContainer').disableSelection();
    for (var i = 0, len = config.genders.length; i < len; i++) {
        this.genders[config.genders[i].gender] = config.genders[i];
    }

    //factoryjoe.com/projects/emoticons/

    if (typeof $().zabuto_calendar=='function') {
        $('#calendar').zabuto_calendar({
            language: config.langue,
            ajax: {
                show_next: 12,
                url: '/classes/Calendar.php?a=get',
                modal: true
            }
        });
    }

    function removeTags(str) {
        if ((str===null) || (str===''))
        return false;
        else
        str = str.toString();
        return str.replace( /(<([^>]+)>)/ig, '');
     }

    function getParentUrl() {
        var isInIframe = (parent !== window),parentUrl = null;

        if (isInIframe) {
            parentUrl = document.referrer;
        }
        return parentUrl;
    }
    // protection
    if (config.urlProtection) {
        var referer = getParentUrl();
        if (referer && (referer.indexOf(config.urlProtection)==-1 && referer.indexOf('html5-chat')==-1)) {
            //console.log('urlProtection', referer);
            window.location = config.quitUrl;
        }
    }

    $('#smileyButton').click(function(e) {
        $('#smileyContainer').slideToggle(100);
        $('#searchGifInput').focus();
    });


    $('#backgroundBtn').click(function(e) {
        $('#backgroundsContainer').slideToggle(100);
    });

    $('#searchGifInput').keyup(function(e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
            var keyword = $('#searchGifInput').val();
            var limit = 9;
            $('#gifsContent').empty();
            var url = sprintf("https://api.giphy.com/v1/stickers/search?q=%s&api_key=%s&limit=%s&rating=%s", keyword, chatHTML5.config.api_key, limit, chatHTML5.config.gifRating);
            chatHTML5.searchGif(keyword, url, '#gifsContent');

            var url = sprintf("https://api.giphy.com/v1/gifs/search?q=%s&api_key=%s&limit=%s&rating=%s", keyword, chatHTML5.config.api_key, limit, chatHTML5.config.gifRating);
            chatHTML5.searchGif(keyword, url, '#gifsContent');
        }
    });

    $('#closeLightBoxBtn').click(function() {
        $('#lightBox').hide();
        $('#lightBox video').prop('src', '');
    })
    this.showLightBoxImage = function(src) {
        $('#lightBox img').prop('src', src).show();
        $('#lightBox video').hide();
        $('#lightBox').css('display', 'flex');
    }
    this.showLightBoxMP4 = function(src) {
        $('#lightBox video').prop('src', src).show();
        $('#lightBox img').hide();
        $('#lightBox').css('display', 'flex');
    }

    $(document).on('click', 'div.content img.gif', function(e) {
        chatHTML5.scrollActiveChatToBottom();
        $('#lightBox').toggleClass('flexed');
        var src = $(this).prop('src');
        if (src.indexOf('/upload/videos/')>=0)  {
            var n = src.lastIndexOf('.jpg');
            src = src.slice(0, n) + src.slice(n).replace('.jpg', '.mp4');
            if (n==-1) {
                n = src.lastIndexOf('.svg');
                src = src.slice(0, n) + src.slice(n).replace('.svg', '.mp4');
            }
            chatHTML5.showLightBoxMP4(src);
        } else {
            var n = src.lastIndexOf('_thumb');
            src = src.slice(0, n) + src.slice(n).replace('_thumb', '');
            chatHTML5.showLightBoxImage(src);
        }
    });

    $('#uploadImageFile').on('change', function(e) {
        var file = this.files[0];
        if (file.type.match('image/jpeg') || file.type.match('image/png') || file.type.match('image/gif')) {
            var maxSize = parseInt(chatHTML5.config.maxSizeUpload);
            if (file.size>maxSize * 1024){
                bootbox.alert(sprintf(chatHTML5.traductions.MaximumSizeAllowed , maxSize));
                return;
            }
            //
            var form_data = new FormData();
            form_data.append('file', file);
            form_data.append('a', 'uploadImage');
            $('#smileyContentLoader').show();

            $.ajax({
                url: chatHTML5.config.ajax, // point to server-side PHP script
                dataType: 'text',  // what to expect back from the PHP script, if anything
                cache: false,
                contentType: false,
                processData: false,
                data: form_data,
                type: 'post',
                xhr: function () {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.onprogress = function e() {
                        if (e.lengthComputable) {
                            var percentage = parseInt(e.loaded * 100 / e.total);
                            $('#progressUploadPicture').css('width', percentage+'%');
                        }
                    };
                    xhr.upload.onprogress = function (e) {
                        if (e.lengthComputable) {
                            var percentage = parseInt(e.loaded * 100 / e.total);
                            $('#progressUploadPicture').css('width', percentage+'%');
                        }
                    };
                    return xhr;
                },
                success: function(urlOfThumb) {
                    $('#progressUploadPicture').css('width', '0%');
                    $('#smileyContentLoader').hide();
                    $('#smileyContainer').slideToggle(100);
                    chatHTML5.setEndOfContenteditable();
                    var html = sprintf('<img class="gif" src="%s" >',  urlOfThumb);
                    chatHTML5.emojiArea[0].emojioneArea.setHTML(html);
                }
            });

        } else {
            bootbox.alert('Invalid Image type');
        }
    });

    function _loadAllImages(callback){
        var img = new Image();
        $(img).attr('src',imgArr[imagesLoaded]);
        if (img.complete || img.readyState === 4) {
            imagesLoaded++;
            if(imagesLoaded == imgArr.length) {
                callback();
            } else {
                _loadAllImages(callback);
            }
        } else {
            $(img).load(function(){
                imagesLoaded++;
                if(imagesLoaded == imgArr.length) {
                    callback();
                } else {
                    _loadAllImages(callback);
                }
            });
        }
    };

    this.searchGif = function(keyword,  url, gifElement) {
        $('#smileyContentLoader').show();
        var xhr = $.get(url);
        function _loadimages(imgArr,callback) {
            var imagesLoaded = 0;
            _loadAllImages(callback);
        }
        var images = Array();
        xhr.done(function(data) {

            for(var index=0; index<data.data.length; index++) {
                var src = data.data[index].images.fixed_height_small.url;
                var title = data.data[index].title;
                var el = sprintf('<img class="gifAnimated" src="%s" title="%s">', src, title);
                images.push(src);
                $(gifElement).append(el);
            }
            $('#gifContainer').show();
            $('#smileyContentLoader').hide();
        });
    }

    /*this.parseSmileysArray = function(ar) {
     var res = array();
     var temp = document.createElement('textarea');
     var emojiTemp = $(temp).emojioneArea({saveEmojisAs:'image', recentEmojis: false, autocomplete: false});

     for (var i=0;i<ar.length; i++) {
     var text = ar[i];
     text = text.replace(/\[\[(.*?)\]\]/ig, '<img class="gif" src="$1">');
     emojiTemp[0].emojioneArea.setText(text);
     res.push((emojiTemp[0].emojioneArea.getText()));
     }
     emojiTemp.remove();
     return res;
     };*/

    this.parseSmileys = function(text) {
        text = text.replace(/\[\[(.*?)\]\]/ig, '<img class="gif" src="$1">');
        if (!window.emojiTemp) {
            var tempParser = document.createElement('textarea');
            window.emojiTemp = $(tempParser).emojioneArea({
                standalone: true,
                saveEmojisAs: 'image',
                recentEmojis: false,
                autocomplete: false,
            });
        }
        window.emojiTemp[0].emojioneArea.setText(text);
        var res =  (window.emojiTemp[0].emojioneArea.getText());
        if (res==undefined) {
            res = text;
        }

        return res;
    };

    this.isPerformerOnline = function() {
        var res = false;
        for(var index in chatHTML5.users) {
            var user = chatHTML5.users[index];
            if (user.role=='performer') {
                res = true;
                break;
            }
        }
        return res;
    }

    this.getDefaultUser = function() {
        var gender;
        if (chatHTML5.myUser && chatHTML5.myUser.gender) {
            gender = chatHTML5.myUser.gender
        } else {
            gender = (chatHTML5.genders[Object.keys(chatHTML5.genders)[0]] || {}).gender;
        }
        var randomAvatar = chatHTML5.getUserAvatar(gender);
        var username = 'guest' + Math.round(Math.random()*1000);
        var defaultUser = {id:new Date().getTime(), username:username, isGuest:true, image: randomAvatar, gender:gender};
        if (chatHTML5.myUser && chatHTML5.myUser.country) {
            defaultUser.country = chatHTML5.myUser.country;
        }
        defaultUser.agent = navigator.userAgent.toLowerCase();
        defaultUser.hasFlash = 	(typeof swfobject!='undefined' && swfobject.hasFlashPlayerVersion('10.0.0'));
        defaultUser.hasWebcam = defaultUser.hasFlash;
        var hasWebrtc = Boolean(navigator.mediaDevices || navigator.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
        defaultUser.hasWebrtc = hasWebrtc;
        defaultUser.room = chatHTML5.room;
        defaultUser.webcam = false;
        defaultUser.status = chatHTML5.traductions.online;
        defaultUser.webcamPublic = (chatHTML5.config.webcamPublic==='1');
        defaultUser.privateOnlyOnInvitation = !$(this).prop('checked');
        return defaultUser;
    };


    $('#loginBtn').click(function(e) {
        var usernameLogin = $('#usernameLogin').val();
        var passwordLogin = $('#passwordLogin').val();
        if ($('#stayConnectedCheckbox').prop('checked')) {
            localStorage.setItem('usernameLogin', usernameLogin);
            localStorage.setItem('passwordLogin', passwordLogin);
        } else {
            localStorage.removeItem('usernameLogin');
            localStorage.removeItem('passwordLogin');
        }
        chatHTML5.login(usernameLogin, passwordLogin);
    });
    $('#loginModal').on('keydown','input', function(e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
            $('#loginBtn').click();
        }
    });

    $('#forgottenBtn').click(function(e) {
        bootbox.prompt(chatHTML5.traductions.enterYourEmail, function(email) {
            if (!email) {
                return;
            }
            $.post(chatHTML5.config.ajax, {a:'forgottenUser', email:email}, function(res) {
                if (res==='ok') {
                    bootbox.alert(chatHTML5.traductions.emailWithPasswordHasBeenSent);
                } else {
                    bootbox.alert(chatHTML5.traductions.emailNotFoundInDatabase);
                }
            });
        });
    });
    $('#loginRegisterBtn').click(function(e) {
        $('#registerModal').modal('show');
    });

    $('#roomPrivateRadio').click(function(e) {
        $('#divPasswordRoomCreate').show();
    })
    $('#roomPublicRadio').click(function(e) {
        $('#divPasswordRoomCreate').hide();
    })

    $('#enterAsGuestLoginBtn').click(function() {
        $('#loginModal').modal('hide');
        $("#loginGuestModal").modal('show');
    })


    $('#createNowRoomBtn').click(function() {
        var myMaxNumberCreation = parseInt((chatHTML5.roles[chatHTML5.myUser.role] || {}).canCreateDynamicRoomNumber);
        if (chatHTML5.getRoomsIOweNumber()>=myMaxNumberCreation) {
            bootbox.alert(chatHTML5.traductions.maxNumberOfRoomCreatedReached);
            return;
        }
        var nameRoom = $('#roomNewNameInput').val();
        if (nameRoom==='') {
            return;
        }
        var reservedToGenderid = $('#reservedToGenderid').val();
        var reservedToRoles = $('#reservedToRoles').val();
        var password = $('#roomPrivateRadio').prop('checked')?$('#roomNewPassword').val():'';
        var newRoom = {webmasterid:chatHTML5.myUser.webmasterid, name:nameRoom, password:password, reservedToGenderid:reservedToGenderid, isprivate:true, reservedToRoles:reservedToRoles};
        $('#roomCreateModal').modal('hide');
        chatHTML5.socket.emit('createRoom', newRoom, function(roomCreated) {
            if (!roomCreated || roomCreated=='false') {
                bootbox.alert(chatHTML5.traductions.errorCreatingRoom);
                return;
            }
            chatHTML5.rooms[roomCreated.id] = roomCreated;
            chatHTML5.closeAllTabs();
            chatHTML5.changeRoom(roomCreated.id);
        });
    })


    this.start = function(myuser) {
        console.log('start html5-chat.com ');
        chatHTML5.getForbiddenWords();
        if (chatHTML5.config.chatType=='conference') {
            if (myuser.image && myuser.image.indexOf('/')==-1) {
                myuser.image = '/upload/thumbs/' + myuser.image;
            }
            myuser.performerid = parseInt(myuser.startRoom) - myuser.webmasterid*10000;
        }
        if (chatHTML5.config.chatType=='roulette') {
            $('#chatAndUserContainer').append($('#footer'))
        }
        if ((chatHTML5.room || {}).webcam==='0') {
            $('#webcamBtn').parent().hide();
        } else {
            $('#webcamBtn').parent().show();
        }

        if ((chatHTML5.room || {}).colorPicker==='0') {
            $('#colorPickerContainer').hide();
        } else {
            $('#colorPickerContainer').show();
        }
        this.initPushToTalk();

        // check role !
        if (myuser && myuser.role=='admin') {
            $.post(chatHTML5.config.ajax, {a:'loginWebmaster', email:myuser.email, password: myuser.password, jwt:myuser.jwt}, function(res) {
                if (res==='ko') {
                    chatHTML5.redirectUrl('/');
                } else {
                    myuser = jQuery.extend(JSON.parse(res) , myuser);
                    chatHTML5.enterAsAdmin(myuser);
                }
            });
            return;
        }
        // pre-filled user : autologin
        if (myuser && myuser.username) {
            chatHTML5.myUser = {};
            chatHTML5.myUser.gender = chatHTML5.getGenderById(myuser.genderid);

            chatHTML5.myUser = chatHTML5.getDefaultUser();
            jQuery.extend(chatHTML5.myUser , myuser);
            var gender = chatHTML5.myUser.gender || (chatHTML5.genders[Object.keys(chatHTML5.genders)[0]] || {}).gender;
            if (chatHTML5.myUser.image=='') {
                chatHTML5.myUser.image = chatHTML5.getUserAvatar(gender);
            }

            $('#myAvatar img').prop('src', chatHTML5.myUser.image).prop('title', removeTags(chatHTML5.myUser.username));
            //$('.menuUserItem[data-action="avatar"]').hide();
            chatHTML5.loggedOn();
            if ((myuser.free || myuser.expired) && parseInt(myuser.entries)>120) {
                bootbox.alert(chatHTML5.traductions['PleaseRegisterYoGetYourOwnCopy']);
            }
            return;
        }
        chatHTML5.myUser = myuser;
        if (this.config.enterChatMode === '1') {
            $('#loginGuestModal').modal('show');

        } else {
            if (chatHTML5.config.wp_login_url) {
                window.top.location.href = chatHTML5.config.wp_login_url;
                return;
            }
            $('#loginModal').modal('show');
            $('#usernameLogin').focus();
        }

        if ((myuser.free || myuser.expired) && parseInt(myuser.entries)>120) {
            bootbox.alert(chatHTML5.traductions['PleaseRegisterYoGetYourOwnCopy']);
        }
    };

    this.enterAsAdmin = function(myuser) {
        chatHTML5.myUser = {};
        var defaultUser = chatHTML5.getDefaultUser();

        jQuery.extend(chatHTML5.myUser , defaultUser);
        jQuery.extend(chatHTML5.myUser , myuser);
        chatHTML5.myUser.role = 'admin';

        if (!chatHTML5.myUser.image) {
            chatHTML5.myUser.image = '/img/avatars/admin.svg';
        }
        chatHTML5.loggedOn();
        $('#myAvatar img').prop('src', chatHTML5.myUser.image).prop('title', removeTags(chatHTML5.myUser.username));
        //$('.menuUserItem[data-action="avatar"]').hide();

    };


    this.stripHTML = function(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return (div.textContent || div.innerText || '');
    };

    this.clearChat = function() {
        $('#chat').empty();
    };

    this.test = function() {
        $('#overlayRegister').slideToggle();
    };

    this.clearLocal = function() {
        localStorage.removeItem('username');
        localStorage.removeItem('privateConfig');
        localStorage.removeItem('soundConfig');
        localStorage.removeItem('notificationConfig');
        localStorage.removeItem('hasWebcam');
    };


    this.getCurrentTab = function() {
        return tabs.getCurrent();
    };

    this.getTabById = function(id) {
        return tabs.getById(id);
    }

    this.scrollActiveChatToBottom = function(duration) {
        var temp = sprintf('.tab-pane.active');
        var $chat = $(temp);
        if ($chat && $chat[0]) {
            if (duration>0) {
                $chat.animate({scrollTop: $chat[0].scrollHeight}, duration);
            }
            $chat.perfectScrollbar('update');
        }
    }

    this.filterBadWord = function(str) {
        if (str.length>512) {
            return str;
        }
        if (!chatHTML5.forbiddenWords.length) {
            return str;
        }
        var regex = new RegExp(chatHTML5.forbiddenWords.join('|'), 'gi');
        switch (chatHTML5.config.actionOnForbiddenWord) {
            case 'nothing':
                return str;
            case 'hide':
                return str.replace(regex, '*');
            case 'kick':
                if (str.match(regex)) {
                    chatHTML5.kicked(chatHTML5.traductions.youHaveBeenKicked);
                    return false;
                } else {
                    return str;
                }
        }
    };

    this.showUsersMenu = function() {
        $('#usersListMenu').empty();
        for(var index in chatHTML5.users) {
            var user = chatHTML5.users[index];
            var el = sprintf('<div data-id="%s">%s</div>', user.id, removeTags(user.username));
            $('#usersListMenu').append(el)
        }
        $('#usersListMenu').show();
    }

    this.getForbiddenWords = function() {
        $.post(chatHTML5.config.ajax, {a:'getForbiddenWords'}, function(forbiddenWords) {
            if (!forbiddenWords) return;
            forbiddenWords = JSON.parse(forbiddenWords);
            for(var index in forbiddenWords) {
                var forbiddenWord = forbiddenWords[index];
                chatHTML5.forbiddenWords.push(forbiddenWord.word);
            }
        });
    };

    this.addPrivateChat = function(id, username) {
        if (!chatHTML5.users[id]) {
            return;
        }
        if (chatHTML5.config.chatType==='window') {
            var temp = sprintf('div.jsPanel#%s', id);
            if ($(temp).length) {
                return;
            } else {
                var content = sprintf('\
				<div class="windowChat"></div>\
				<div class="windowInputContainer">\
					<input type="text" class="windowInputChat" placeHolder="%s">\
					<i class="fa fa-eraser windowEraser" title="%s"></i>\
				</div>\
				', sprintf(chatHTML5.traductions.chatPrivateWith, username), chatHTML5.traductions.cleanChat);
                var user = chatHTML5.users[id];

                var header = sprintf('<span><img src="%s" class="userAvatar"> %s</span>', user.image, username);
                $.jsPanel({
                    selector: '#tabs',
                    headerTitle: header,
                    position: 'center',
                    content:  content,
                    toolbarHeader: [{item: header}],
                    id: id.toString()
                });
            }
        } else {
            //tab
            if  ($('.nav-tabs:not(.nav-tabs-clone)').find('li').find('a[href="#' + id + '"]').length) {
                return;
            }
            var image = sprintf('<img src="%s" class="userTabAvatar">', chatHTML5.users[id].image);
            var title = sprintf('%s %s <div class="unread" title="%s"></div>&nbsp;&nbsp;', image, username,  chatHTML5.traductions.unreadMessages);
            tabs.addTab({id: id, title: title, closable: true, room:false, label:username, selected:false});
            $('#'+id).perfectScrollbar();

        }

    };

    this.addOrSelectPrivateChat = function(user, selected) {
        var id = user.id;
        var username = removeTags(user.username);
        selected = typeof selected !== 'undefined' ? selected : false;
        if (chatHTML5.config.chatType==='window') {
            var temp = sprintf('#chatContainer div.jsPanel[data-id="%s"]', id);
            //console.log(temp);
            if ($(temp).length) {
                $(temp).click();
            } else {
                var content = sprintf('\
				<div class="windowChat"></div>\
				<div class="windowInputContainer">\
					<input type="text" class="windowInputChat" placeHolder="%s">\
					<i class="fa fa-eraser windowEraser" title="%s"></i>\
				</div>\
				', sprintf(chatHTML5.traductions.chatPrivateWith, username), chatHTML5.traductions.cleanChat);

                var header = sprintf('<span><img src="%s" class="userAvatar"> %s</span>', user.image, username);
                //console.log('id', id, 'panel:', 'panel'+id);
                $.jsPanel({
                    selector: '#tabs',
                    headerTitle: header,
                    position: 'center',
                    content:  content,
                    toolbarHeader: [{item: header}],
                    id:id.toString()
                });
            }
        } else {
            //tab
            var myRole = chatHTML5.roles[chatHTML5.myUser.role] || {};
            var buttonWebcam =(myRole.canCall1To1=='1') ?'<button class="webcamSmall"><i class="fa fa-video-camera"></i></button>':'';
            var image = sprintf('<img src="%s" class="userTabAvatar">%s', (user || {}).image, buttonWebcam);
            var title = sprintf('%s %s <div class="unread" title="%s"></div>&nbsp;&nbsp;', image, username, chatHTML5.traductions.unreadMessages );
            tabs.addTab({id: id, title: title, closable: true, room:false, label:username, selected:selected});
            $('#' + id).perfectScrollbar();
            if (chatHTML5.config.chatType=='roulette') {
                var templateMessage = sprintf('<div class="serverMessage rouletteMessage">%s</div>', sprintf(chatHTML5.traductions['youAreConnectedWith'], username));
                $chat = chatHTML5.$getChat(id);
                $chat.empty();
                $(templateMessage).hide().appendTo($chat).fadeIn(500);
            }
        }
    };

    $(document).on('click', '#tabs button.webcamSmall', function(e) {
        var userid = $(this).parents().closest("a[data-id]").data('id');
        chatHTML5.call1to1(userid);
    });

    $(document).on('tabChanged', function(e, _room) {
        var temp = sprintf("a[data-id='%s'] div.unread", chatHTML5.getCurrentTab().id);
        $(temp).empty();
        if (_room.room) {
            temp = sprintf(chatHTML5.traductions.enterYourTextHereInRoom, _room.label);
            $('div.emojionearea-editor').attr('placeholder', temp);

            if (chatHTML5.config.multiRoomEnter=='1') {
                if (Object.keys(chatHTML5.rooms).length) {
                    var room = chatHTML5.rooms[_room.roomid];
                    chatHTML5.myUser.room = room;
                }
                console.log('TabCHanged');
                chatHTML5.socket.emit('getUsers', _room.roomid);
            }
        } else {
            // private chat tab

            if (chatHTML5.config.multiRoomEnter=='1') {
                $('#userList').empty();
                chatHTML5.socket.emit('getUser', _room.id, function(user) {
                    chatHTML5.addUser(user, false, '#userList', true);
                    chatHTML5.updateNumberUsersDisplay();
                });
            }
            temp = sprintf(chatHTML5.traductions.chatPrivateWith, _room.label);
            $('div.emojionearea-editor').attr('placeholder', temp);
        }
        var len = $('.nav.nav-tabs li').not('.ui-sortable-placeholder').length;
        if (!isMobile()) {
            var len = $('.nav.nav-tabs li').not('.ui-sortable-placeholder').length;
            if (len<=1) {
                try {
                    $('div#tabs').find('.nav.nav-tabs').sortable('destroy');
                } catch(e) {
                }
            } else {
                try {
                    $('div#tabs').find('.nav.nav-tabs').sortable();
                } catch(e) {

                }
            }
        }
    });


    $(document).on('jspanelclosed', function closeHandler(event, id) {
        if (chatHTML5.config.privateClosesWhenOneUserClosesPrivate=='1') {
            chatHTML5.socket.emit('privateClosed', id);
        } else {

        }
    });

    this.isMobile = function() {
        var check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    };


    this.sendText = function() {
        if (chatHTML5.amIMuted()) {
            return;
        }
        if (chatHTML5.roles[chatHTML5.myUser.role] && chatHTML5.roles[chatHTML5.myUser.role]['canSend']=='0') {
            if (chatHTML5.roles[chatHTML5.myUser.role]['explanationIfDisabled']) {
                bootbox.alert(chatHTML5.roles[chatHTML5.myUser.role]['explanationIfDisabled'])
            }
            return;
        }
        var timeSpent = (Date.now()-chatHTML5.lastSend);
        //console.log('timeSpent', timeSpent);
        if (timeSpent<parseInt(chatHTML5.config.timerUserCanSendAgain)) {
            return;
        }
        if (!chatHTML5.checkAllowed('canSend')) {
            return;
        }

        var plainText = removeTags(chatHTML5.emojiArea[0].emojioneArea.getText());
        console.log("plainText1");
        console.log(plainText);
        if (plainText==='' || plainText.trim()==='') {
            return;
        }
        var currentTab = chatHTML5.getCurrentTab();

        chatHTML5.emojiArea[0].emojioneArea.setText('');
        var color = ($('#colorPicker').val())?$('#colorPicker').val():(chatHTML5.roles[chatHTML5.myUser.role] || {}).colorText || '#000000';
        var extras = {color:color, bold:$('#boldDiv').hasClass('fontSelected'), italic: $('#italicDiv').hasClass('fontSelected'),
            underline:$('#underlineDiv').hasClass('fontSelected'), date:Date.now()};

        if (currentTab.room) {
            plainText = chatHTML5.filterBadWord(plainText);
            /*var regex = /#(\S+)/g;
             var destinataire;
             var res = regex.exec(plainText);
             if (res) {
             var destintaireUsername = res[1];
             destinataire = chatHTML5.getUserByUsername(destintaireUsername);
             }*/
            var destinataire;
            var destinatireid = $('#privateOrMentionContainer:visible').data('userid');
            var action = $('#privateOrMentionContainer:visible').data('action');
            if (destinatireid) {
                destinataire = chatHTML5.users[destinatireid];
            }
            if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canWhisper=='0') {
                destinataire = false;
            }
            //selectUserAndTextChatPrivate
            if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).selectUserAndTextChatPrivate=='1') {
                var destinatireid = $('#userList div.selectedUser').data('id');
                if (!destinatireid) {
                    bootbox.alert(chatHTML5.traductions['youMustSelectAnUser']);
                    return;
                } else {
                    destinataire = chatHTML5.users[destinatireid];
                    action = 'whisper';
                }
            }

            if (destinataire && action=='whisper') {
                extras.whisper = true;
                extras.userid =  destinataire.id;
                if (!chatHTML5.checkMinorAllowed(destinataire.id)) {
                    return;
                }
                chatHTML5.socket.emit('whisper', destinataire.id,  plainText, extras);
                chatHTML5.receiveText(chatHTML5.myUser, plainText, extras);
            }
            else if (destinataire && action=='mention') {
                extras.mention = 1;
                extras.userid =  destinataire.id;
                chatHTML5.socket.emit('send', this.myUser, plainText, extras);
            }
            else {
                chatHTML5.socket.emit('send', this.myUser, plainText, extras);
            }
        } else {
            if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canSendPrivate=='0') {
                return;
            }
            plainText = chatHTML5.filterBadWord(plainText);
            chatHTML5.socket.emit('sendPrivate', this.myUser, plainText, currentTab.id, extras);
            var destinationUser = jQuery.extend(true, {}, chatHTML5.myUser);
            destinationUser.id = currentTab.id;
            chatHTML5.receivePrivate(destinationUser, plainText, extras);
        }
        $('#chatInput').prop('disabled', true);
        chatHTML5.lastSend = Date.now();
        if (chatHTML5.myUser.isMobile) {
            chatHTML5.hideKeyboard();
        }
        if (chatHTML5.config.keepCusrorOnPrivateAfterPrivateSent=='1') {
            //chatHTML5.emojiArea[0].emojioneArea.setText('#' + destintaireUsername  + ' :');
            //chatHTML5.setEndOfContenteditable();
        } else {
            $('#footer').removeClass('activeMention').removeClass('activeWhisper');
        }

    }

    $('#snpashotlabel').click(function() {
        if (typeof MediaRecorder=='undefined') {
            bootbox.alert(chatHTML5.traductions.notAvaibleInBrowser);
            return;
        }
        if (!chatHTML5.myUser.webcam) {
            bootbox.alert(chatHTML5.traductions['youMustSwitchYourWebcam']);
            return;
        }
        $('#snapshotModal').modal('show');
    })

    this.welcome = function() {
        var welcomeMessage = chatHTML5.myUser.room.welcome || '';
        if (!welcomeMessage )  {
            return;
        }
        var image = (chatHTML5.myUser.room.image!=='')?sprintf('<img class="roomImage" src="/upload/rooms/%s">', chatHTML5.myUser.room.image):'';
        welcomeMessage = welcomeMessage.replace(/{{username}}/g, removeTags(chatHTML5.myUser.username)).replace(/{{room}}/g, chatHTML5.myUser.room.name).replace(/{{image}}/g, image);
        localStorage.setItem('username', removeTags(this.myUser.username));
        this.serverMessage(welcomeMessage, 'welcome');
    };

    this.serverMessageCurrentTab = function(texte, className) {
        var $chat = $('#tabs div.tab-pane.active');
        $chat && $chat.append(sprintf('<div class="serverText %s">%s</div>',  className, texte));
        if ($("#lockScrollBtn i:eq(1)").css('display') == 'none') {
            $chat && $chat.animate({scrollTop: $chat[0].scrollHeight}, 200);
        }
    };

    this.serverMessage = function(texte, className, userid) {
        if (!texte) {
            return;
        }
        var roomid = sprintf('room_%s', chatHTML5.myUser.room.id);
        if (userid) {
            $chat = chatHTML5.$getChat(userid);
            $chat && $chat.append(sprintf('<div class="serverMessage %s">%s</div>', className, texte));
            if ($('#lockScrollBtn i:eq(1)').css('display') == 'none') {
                $chat && $chat[0] && $chat.animate({scrollTop: $chat[0].scrollHeight}, 200);
            }
        }
        chatHTML5.scrollActiveChatToBottom();
        if ($($chat).length) {
            return;
        }
        var $chat = chatHTML5.$getChat(roomid);
        $chat && $chat.append(sprintf('<div class="serverMessage %s">%s</div>', className, texte));
        if ($('#lockScrollBtn i:eq(1)').css('display') == 'none') {
            $chat && $chat[0] && $chat.animate({scrollTop: $chat[0].scrollHeight}, 200);
        }
        chatHTML5.scrollActiveChatToBottom();
    };

    this.serverInfoMessageThatDiseappears = function(texte, className, roomid) {
        if (chatHTML5.config.showMessageServer=='0') {
            return;
        }
        if (roomid) {
            roomid = sprintf('room_%s', roomid);
        } else {
            roomid = sprintf('room_%s', chatHTML5.myUser.room.id);
        }
        var $chat = chatHTML5.$getChat(roomid);
        var seconds = parseInt(chatHTML5.config.hideMessageServerAfterNseconds) * 1000;
        $chat && $chat.append(sprintf('<div data-time="%s" class="serverText %s">%s</div>',  Date.now() + seconds, className, texte));
        if ($("#lockScrollBtn i:eq(1)").css('display') == 'none') {
            $chat && $chat[0] && $chat.animate({scrollTop: $chat[0].scrollHeight}, 200);
        }
        chatHTML5.scrollActiveChatToBottom();
    };

    this.getOffsetX = function() {
        return - 20 + Math.ceil(Math.random()*20);
    };

    this.getOffsetY = function() {
        return - 10 + Math.ceil(Math.random()*40);
    };

    $('#youtubeDisableCheckbox').change(function() {
        localStorage.setItem('youtubeDisable', $(this).prop('checked'));
    });


    $('#soundCheckBox').change(function() {
        try{
            if (!$('#soundCheckBox').prop('checked')) {
                if (document.getElementById('pushToTalkSWF')) {
                    document.getElementById('pushToTalkSWF').stopAudio();
                }
            } else {
                if (chatHTML5.currentTalkerid) {
                    if (document.getElementById('pushToTalkSWF')) {
                        document.getElementById('pushToTalkSWF').playAudio(chatHTML5.currentTalkerid);
                    }
                }
            }
        } catch(e) {
        }
    });
    this.playMP3 = function(mp3file, loop) {
        if (!mp3file || !$('#soundCheckBox').prop('checked')) {
            return;
        }
        if (loop == 'undefined') {
            loop = false;
        }
        try {
            if (chatHTML5.soundMP3.paused) {
                chatHTML5.soundMP3.src = mp3file;
                chatHTML5.soundMP3.loop = loop;
                try {
                    chatHTML5.soundMP3.play().catch(function() {

                    });
                } catch(e) {

                }
            }
        } catch(e) {
        }
    };

    this.getUserByUsername = function(username) {
        var resultat = false;
        $.each(chatHTML5.users, function( id, user ) {
            if (removeTags(user.username)==username) {
                resultat =  user;
            }
        });
        return resultat;
    }

    this.removeFirstLine = function() {
        $('div.tab-pane.active div.message:first').remove();
    }

    this.getUserColor = function(user) {
        var res = '#000';
        if (user.gender && chatHTML5.genders[user.gender]) {
            res = chatHTML5.genders[user.gender].color;
        }

        if (chatHTML5.roles[user.role] && chatHTML5.roles[user.role]['color']) {
            res = chatHTML5.roles[user.role]['color'];
        }
        return res;
    }
    this.int2ip = function (ipInt) {
        return ( (ipInt>>>24) +'.' + (ipInt>>16 & 255) +'.' + (ipInt>>8 & 255) +'.' + (ipInt & 255) );
    }
    this.ip2int = function (ip) {
        return ip.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;
    }


    this.getMyIp = function() {
        chatHTML5.socket.emit('getMyIp', {}, function(ip) {
            chatHTML5.myUser.ip = ip;
        })
    }

    this.receiveText = function(user, message, extras) {
        var receiveTextFromArr = (((chatHTML5.roles[chatHTML5.myUser.role] || {}).receiveTextFrom) || '').split(',');
        if (user.role!=undefined && user.id!=chatHTML5.myUser.id && receiveTextFromArr.indexOf(user.role)==-1) {
            return;
        }

        if (chatHTML5.amIMinor() && user.adult=='1') {
            return;
        }

        if (this.muted[user.id]) {
            return;
        }
        if (message.length<512) {
            message = message.replace(/(?:\r\n|\r|\n)/g, '<br />');
        }
        // semi private message ?
        var classePrivate = '';
        var date = (extras.date===undefined) ?  new Date().toLocaleTimeString() : new Date(extras.date).toLocaleTimeString();

        message = chatHTML5.parseSmileys(message);
        var classeWhisper = (extras.whisper)?'whisper':'';

        var color = chatHTML5.getUserColor(user);
        var userStyle = 'color:' + color;

        var boldClasse = (extras.bold===true || extras.bold==='true')?'boldClasse':'';
        var italicClasse = (extras.italic===true || extras.italic==='true')?'italicClasse':'';
        var underlineClasse = (extras.underline===true || extras.underline==='true')?'underlineClasse':'';

        var rx = /.*@([\w\.]+)/;
        /*var match = (message && message.length<512) ?rx.exec(message):false;*/

        if (message && extras.mention==1 && chatHTML5.users[extras.userid]) {
            var userReceiver = chatHTML5.users[extras.userid] || {};
            //extras.color = '#111e2c';
            classePrivate = 'addPrivateMessage';
            if (user.username==chatHTML5.myUser.username && chatHTML5.config.senderMessageFloatRight=='1') {
                classePrivate = classePrivate + ' myMessage';
            }
            //message = sprintf("<b>%s %s</b>", userReceiver.username || '', message);
            message = sprintf("<b>%s</b>", message);

            var templateMessage = sprintf('\
                <div class="message flex-property %s %s">\
                    <img src="%s" alt="%s" class="userItem" >\
                        <div class="flex-property flex-center name-time" data-username="%s" data-id="%s">\
                            <div class="userItem" style="%s" title="%s" data-id="%s" data-username="%s" data-ip="%s">%s @ %s</div>\
                            <div class="timeStamp" data-date="%s">%s</div>\
                            <div class="content %s %s %s" style="color:%s"> %s</div>\
                        </div>\
                    </div>',
                classePrivate, classeWhisper,
                user.image, removeTags(user.username),
                removeTags(user.username), user.id,
                userStyle, removeTags(user.username), user.id, removeTags(user.username), user.ip, removeTags(user.username), userReceiver.username,
                extras.date, chatHTML5.getDateAgo(extras.date),
                boldClasse, italicClasse, underlineClasse, extras.color,
                message);
        } else {
            if (user.username==chatHTML5.myUser.username && chatHTML5.config.senderMessageFloatRight=='1') {
                classePrivate = classePrivate + ' myMessage';
            }

            var extraWhisper = '';
            if  (extras.whisper) {
                var userReceiver = chatHTML5.users[extras.userid] || {};
                extraWhisper = ' # ' + userReceiver.username;
            }
            var templateMessage = sprintf('\
                <div class="message flex-property msg-box %s %s">\
                    <img src="%s" alt="%s" class="userItem" >\
                      <div class="flex-property message-info">\
                        <div class="flex-property flex-center name-time">\
                            <div class="userItem" style="%s" title="%s" data-id="%s" data-username="%s" data-ip="%s">%s %s</div>\
                            <div class="timeStamp" data-date="%s">%s</div>\
                        </div>\
                        <div class="content %s %s %s" style="color:%s">\
                          <div class="arrow-chat" style="display:none"></div>\
                          %s</div>\
                      <div>\
                    </div>',
                classePrivate, classeWhisper,
                user.image, removeTags(user.username),
                userStyle, removeTags(user.username), user.id, removeTags(user.username), user.ip, removeTags(user.username), extraWhisper,
                extras.date, chatHTML5.getDateAgo(extras.date),
                boldClasse, italicClasse, underlineClasse, extras.color,
                message);
        }

        var roomidString = (user.room) ? sprintf('room_%s', user.room.id)  : sprintf('room_%s', chatHTML5.myUser.room.id);
        var $chat = chatHTML5.$getChat(roomidString);
        if ($chat) {
            var animationTime = (extras.doNotAnimate)?0:100;
            if ($("#lockScrollBtn i:eq(1)").css('display') == 'none') {
                try {
                    $chat.animate({scrollTop: $chat[0].scrollHeight}, animationTime);
                } catch(e) {

                }
            }

            if (chatHTML5.config.linkifyUrl=='1') {
                var regex = /(https?:&#x2F;&#x2F;.*?)(?=[<\s])/gi;
                templateMessage = templateMessage.replace(regex, function(correspondance, part1) {
                    if (correspondance.indexOf('giphy.com') != -1) {
                        return correspondance;
                    }
                    if (chatHTML5.config.screenshotUrl=='1') {
                        var filtered = correspondance.replace(/&amp;/g, '&').replace(/&#x2F;/g,'/');
                        b64 = btoa(filtered);
                        res = `<a target='_blank' data-screenshot="${b64}" href='${correspondance}'>${correspondance}</a>`;
                    } else {
                        res = `<a target='_blank' href='${correspondance}'>${correspondance}</a>`;
                    }
                    return res;
                })
            }

            $(templateMessage).hide().appendTo($chat).fadeIn(500);
            var keepMaxHistoryChat = parseInt(chatHTML5.config.keepMaxHistoryChat);
            var $messages = $('div.tab-pane.active div.message');
            var total = $messages.length;
            if (keepMaxHistoryChat && total>keepMaxHistoryChat) {
                $messages.eq(0).remove();
            }
            chatHTML5.playMP3(chatHTML5.config.soundMessageReceived);
            chatHTML5.scrollActiveChatToBottom();
        }

        var roomid = (user.room) ? user.room.id : -1;
        var temp = sprintf("a[data-roomid=%s] div.unread", roomid);
        if (roomid==chatHTML5.myUser.room.id && chatHTML5.getCurrentTab().room) {
            $(temp).empty();
        } else {
            var value = $(temp).text();
            if 	(value==='') {
                value = 1;
            } else {
                value = (parseInt(value)+1);
            }
            $(temp).text(value);
        }
    };

    this.addRandomMessages = function() {
        var roomidString = sprintf('room_%s', chatHTML5.myUser.room.id);
        var $chat = chatHTML5.$getChat(roomidString);
        for (var i=0;i<50;i++) {
            var text=sprintf('<div class="message flex-property msg-box" >%s</div>', Math.random()*10000);
            text = chatHTML5.parseSmileys(text);
            $(text).hide().appendTo($chat).fadeIn(0);
        }
    };

    this.addRandomUsers = function() {
        for (var i=0;i<50;i++) {
            var user = {username:'user_'+i, id:i*1000, gender:'visiteur', status:chatHTML5.traductions.online, webcam:false, room:{}, image:chatHTML5.pickupRandomAvatar()};
            chatHTML5.addUser(user, false, '#userList', true);

        }
    };

    this.incrementPointsQuiz = function(userid) {
        var temp = sprintf('div.userItem[data-id=%s] div.pointsQuiz', userid);
        var points = parseInt($(temp).text());
        if (isNaN(points)) points = 0;
        points++;
        $(temp).text(points).removeClass('hidden');
    };

    this.isMyFriendApproved = function(userid) {
        return (chatHTML5.myUser.friends[userid] && chatHTML5.myUser.friends[userid].friendStatus=='friendsApproved');
    }
    this.isMyFriendIRequested = function(userid) {
        return (chatHTML5.myUser.friends[userid] && chatHTML5.myUser.friends[userid].friendStatus=='friendsIRequested');
    }
    this.isMyFriendIneedToApprove = function(userid) {
        return (chatHTML5.myUser.friends[userid] && chatHTML5.myUser.friends[userid].friendStatus=='friendsIneedToApprove');
    }
    this.isMyFriend = function(userid) {
        return (chatHTML5.myUser.friends[userid]);
    }
    this.sendFriendRequest = function(friendid, username) {
        bootbox.confirm(sprintf(chatHTML5.traductions.resendUserRequest, username), function (res) {
            if (res) {
                chatHTML5.socket.emit('requestFriend', friendid);
                chatHTML5.getMyFriends();
            }
        })
    };

    $('#friendsContainer2').on('click', '.friendActionBtn', function(e) {
        e.stopImmediatePropagation();
        var friendid = $(this).closest('.userItem').data('id');
        var username = $(this).closest('.userItem').data('username');
        //console.log(friendid, username);
        if (chatHTML5.isMyFriendApproved(friendid)) {
            bootbox.confirm(sprintf(chatHTML5.traductions.removeUserFromFriends, username), function(res) {
                if (res) {
                    chatHTML5.socket.emit('deleteFriend', friendid);
                }
            })
        } else if(chatHTML5.isMyFriendIRequested(friendid)){
            chatHTML5.sendFriendRequest(friendid, username);
        } else if(chatHTML5.isMyFriendIneedToApprove(friendid)){
            bootbox.confirm(sprintf(chatHTML5.traductions.acceptUserAsFriends, username), function(res) {
                if (res) {

                }
            })
        }
    })

    this.addUser = function(user, playSound, domUserList, forceDisplay) {
        if (typeof(forceDisplay)=='undefined') {
            forceDisplay = false;
        }

        var myRoomid = (chatHTML5.getCurrentTab() || {}).roomid;
        var hisRoomid = parseInt((user.room || []).id);
        if (!hisRoomid || hisRoomid<=0) return;
        if (!forceDisplay && (myRoomid!=hisRoomid)) {
            return;
        }
        if (chatHTML5.getCurrentTab().room===false && !forceDisplay) {
            return;
        }
        if (!domUserList) {
            domUserList = '#userList';
        }
        var temp = sprintf('#userList div[data-id="%s"]', user.id);
        if ($(temp).length && domUserList=='#userList') {
            return;
        }
        var classeFriend = '';
        var buttonFriend = '';

        if (domUserList=='#friendsList') {
            if (!chatHTML5.isMyFriend(user.id)) {
                return;
            }
            if (chatHTML5.isMyFriendApproved(user.id)) {
                classeFriend = 'friendApproved';
                buttonFriend = sprintf('<div class="friendAction"><button title="%s" class="friendActionBtn"></button></div>', chatHTML5.traductions.removeFriend);
            } else if(chatHTML5.isMyFriendIRequested(user.id)){
                classeFriend = 'friendIRequested';
                buttonFriend = sprintf('<div class="friendAction"><button title="%s" class="friendActionBtn"></button></div>', chatHTML5.traductions.resendFriend);
            } else if(chatHTML5.isMyFriendIneedToApprove(user.id)){
                classeFriend = 'friendIneedToApprove';
                buttonFriend = sprintf('<div class="friendAction"><button title="%s" class="friendActionBtn"></button></div>', chatHTML5.traductions.classeFriend);
            }
            //console.log(user.username, 'classeFriend:', classeFriend);
        }

        //console.log("addUser", user);
        var webcamClass = (user.webcam)?'visible':'hidden';
        if (!user.streamid || chatHTML5.myUser.room.webcam=='0') {
            webcamClass = 'hidden';
        }

        chatHTML5.users[user.id] = user;
        console.log('enter user', removeTags(user.username));
        if (chatHTML5.amIMinor() && user.adult=='1') {
            return;
        }
        var webcamLock = (user.webcamPublic)?'<i class="fa lock fa-unlock"></i>':'<i class="lock fa fa-lock"></i>';
        var color = chatHTML5.getUserColor(user);
        var genderStyle = 'color:' + color;

        if (!user.image) {
            user.image = chatHTML5.pickupRandomAvatar();
        }

        var classStatus = 'online';
        if (user.status===chatHTML5.traductions.offline) {
            classStatus = 'offline';
        }
        if (user.status===chatHTML5.traductions.busy) {
            classStatus = 'busy';
        }
        if ((user.status || '').toLowerCase()===chatHTML5.traductions.invisible.toLowerCase() && (chatHTML5.myUser.role!='admin' || chatHTML5.myUser.role!='moderator') ) {
            return;
        }

        var classPoints = (user.points>0)?'visible':'hidden';
        var divIsMobile = (user.isMobile)?'<div class="isMobile" title="on Phone"><img title="on Phone" src="img/mobile.svg"></div>':'';

        //console.log('genderStyle', genderStyle);
        var disableClass = (user.username===chatHTML5.myUser.username)?'Xdisabled myUser':'';
        //var handClasse = (chatHTML5.config.chatType==='conference')?'':'hidden';
        var creditsClass = ( chatHTML5.config.chatType==='conference')?'':'hidden';

        var eyeClasse = (chatHTML5.config.webcamPublic=='1') ? "fa fa-eye fa-2x hidden" : "fa fa-eye-slash fa-2x hidden";
        if (chatHTML5.myUser.webcam) {
            eyeClasse = (chatHTML5.config.webcamPublic=='1') ? "fa fa-eye fa-2x visible" : "fa fa-eye-slash fa-2x visible";
        }
        var srcImageRole = (chatHTML5.roles[user.role] || {}).image;
        var imageRole = (srcImageRole)?sprintf('<img src="/upload/roles/%s" title="%s" class="imageRole">', srcImageRole, user.role):'<img class="imageRole">';

        var flagClass = (chatHTML5.config.showCountryFlag=='1')?sprintf("flag flag-%s", (user.country || '').toLowerCase()):'';

        var mutedClass = (chatHTML5.muted || [])[user.id]?'muted':'';

        if (mutedClass=='') {
            mutedClass = (chatHTML5.jailedUsers || [])[user.id]?'muted':'';
        }

        var ageEl = (user.hideAge!=1 && parseInt(user.age)>0 && chatHTML5.config.displayAge=='1')?sprintf('<span class="age">%s:%s</span>', chatHTML5.traductions.Age, user.age):'';
        var broadcastClass = (user.broadcast) ?'broadcastUser':'';
        if (user.credits==undefined) {
            user.credits = 0;
        }
        var webcamIcon  = (user.audio && !user.video)?'fa-volume-down':'fa-video-camera'
        var itemTemplate = sprintf('\
        <div data-id=%s data-username="%s" data-gender="%s" data-webcam="%s" data-status="%s" class="online-user-item userItem %s %s %s %s" style="%s">\
			<i class="fa fa-microphone microphoneTalking"></i>\
			<i class="fa fa-hand-o-up raiseHand"></i>\
			<img src="%s" alt="%s" class="avatarUser">\
            <div class="broadcast %s"></div>\
			<img src="css/blank.gif" class="%s" title="%s"  >\
			<div class="status %s"></div>\
			%s\
			%s\
			<div class="pointsQuiz %s" title="points Quiz">%s</div>\
			<div class="creditsUser %s" title="credits">%s</div>\
			<div class="userLabel">%s</div> %s\
      <div class="info-icons flex-property">\
            %s\
			<div class="eye-icon"><i class="%s" title="%s"></i></div>\
			<div class="keyboard" title="%s"><i class="fa fa-keyboard-o"></i></div>\
            <div class="webcamBtn %s"><i class="fa %s fa-2x"></i>%s</div>\
      </div>\
		</div>',
            user.id, removeTags(user.username), user.gender, user.hasWebcam, user.status, mutedClass, disableClass, classeFriend, mutedClass, genderStyle,
            user.image, removeTags(user.username),
            broadcastClass,
            flagClass, user.country,
            classStatus,
            divIsMobile,
            imageRole,
            classPoints, user.points,
            creditsClass, user.credits,
            removeTags(user.username), ageEl,
            buttonFriend,
            eyeClasse, chatHTML5.traductions.watchesMe,
            chatHTML5.traductions.isWriting,
            webcamClass, webcamIcon, webcamLock);
        let hisRole = chatHTML5.roles[user.role] || {};

        if (user.talks) {
            chatHTML5.talks(user);
        }
        if (user.invisible=='0') {
            user.invisible=false;
        }
        if (hisRole.predictiveReading=='1' && chatHTML5.predictiveReadingUsers.indexOf(user.id)==-1 && user.id!=chatHTML5.myUser.id) {
            chatHTML5.predictiveReadingUsers.push(user.id);
        }
        if (!user.invisible || user.id==chatHTML5.myUser.id) {
            var pos = chatHTML5.getUserPositionInList(user);
            //$("#userList").children().eq(pos).after(itemTemplate)
            //console.log(user.username, pos);
            $(domUserList).insertAt(pos, itemTemplate);


            chatHTML5.updateNumberUsersDisplay();
            try {
                var callBackName = (chatHTML5.roles[user.role] || {}).JScallbackWhenEnter;
                if (callBackName) {
                    window[callBackName](user);
                }
            } catch(e) {
            }
        }
        if (user.broadcast && user.id!=chatHTML5.myUser.id) {
            setTimeout(function() {
                chatHTML5.addWebcam(user.id, removeTags(user.username), user.broadcast);
                console.log(user.id, removeTags(user.username), user.broadcast);
            }, 1000);
        }
        chatHTML5.searchUsers();
        //console.log(user.username, user.ip, domUserList);
        if (Object.keys(chatHTML5.users).length==2) {
            var soundWhenFirstUserEnters = (chatHTML5.roles[chatHTML5.myUser.role] || {}).soundWhenFirstUserEnters;
            if (soundWhenFirstUserEnters!='') {
                chatHTML5.playMP3(soundWhenFirstUserEnters);
            }
        }
        if (playSound && (chatHTML5.roles[user.role] || {}).isVisible=='1') {
            chatHTML5.playMP3(chatHTML5.config.soundUserEntersChat);
        }
    };
    this.getUserPositionInList = function(user) {
        if (chatHTML5.showOnTopofUserList(user)) {
            return 0;
        }
        var sortWebcam = $('#sortWebcamtBtn').hasClass('selected');
        var sortUsernames = $('#sortBtn').hasClass('selected');
        if (!sortWebcam && !sortUsernames) {
            return -1;
        }
        if (sortWebcam) {
            return 0
        } else {
            return -1;
        }
    };

    jQuery.fn.insertAt = function(index, element) {
        var lastIndex = this.children().length;
        if (index < 0) {
            index = Math.max(0, lastIndex + 1 + index);
        }
        this.append(element);
        if (index < lastIndex) {
            this.children().eq(index).before(this.children().last());
        }
        return this;
    }


    this.showOnTopofUserList = function(user) {
        var res = ((chatHTML5.genders[user.gender] || {}).showOnTopofUserList == '1') || chatHTML5.roleShowOnTopofUserList(user.role);
        return res;
    };

    $(document).on('click','a[target="_blank"]', function(e) {
        var url = $(this).prop('href');
        var part = url.split('v=');
        var videoid = (part.length>1)? part[1].substring(0, 11):'';
        if (videoid) {
            chatHTML5.playYoutube(videoid, (chatHTML5.config.userYoutubeLinkDisplayInChat=='1'));
            e.preventDefault();
            return;
        }
        if (chatHTML5.config.screenshotUrl=='1') {
            var b64 = $(this).data('screenshot');
            e.preventDefault();
            var $link = $(this);
            $link.addClass('disabled');
            $.post(chatHTML5.config.ajax, {a:'screenshot', b64:b64}, function (res) {
                $link.removeClass('disabled');
                if (res) {
                    if (res=='error') {
                        bootbox.alert('Error');
                        return;
                    }
                    var source = `<div style="text-align: center">
                                    <a href="${url}" target="_new"><img class="screenshot" src=${res}>
                                        <div>${url}</div>
                                    </a>
                                  </div>`;
                    bootbox.alert(source);
                } else {
                }
            });
            return;
        }

    });

    $(document).on('click', '.hand', function(e) {
        e.stopPropagation();
        var value = $(this).hasClass('handActive');
        var id = $(this).parent().data('id');
        $('.hand').removeClass('handActive');
        var user = chatHTML5.users[id];
        if (!user) {
            return;
        }
        if (value) {
            $(this).removeClass('handActive');
            chatHTML5.playConference(user, false);
        } else {
            $(this).addClass('handActive');
            chatHTML5.playConference(user, true);
        }
    });

    this.updateNumberUsersDisplay = function() {
        var number = $('#usersContainer #userList div[data-id]').length;

        $('span[data-role=usersOnlineCounter]').text(number);
        $('#usersContainer #onlineCounter').text(number);
    };

    this.initPushToTalk = function() {
    };

    this.addPushToTalkSWF = function(user) {
        chatHTML5.currentTalkerid = user.id;
        if (chatHTML5.muted[user.id]) {
            return;
        }
        try {
            if ($('#soundCheckBox').prop('checked')) {
                if (document.getElementById('pushToTalkSWF')) {
                    try {
                        document.getElementById('pushToTalkSWF').playAudio(user.id);
                    } catch (e) {
                    }
                }
            }
        }
        catch(e) {
        }
    };

    this.talks = function(user) {
        $('#pushTalkBtn').css('pointer-events', 'auto').css('display', 'none');
        if (user.username!=chatHTML5.myUser.username) {
            this.addPushToTalkSWF(user);
            $('#pushToTalkFreeHand').css('display', 'none');
        }
        if (user && user.username) {
            var temp = sprintf('#userList div.userItem[data-username="%s"] i.microphoneTalking', removeTags(user.username));
            $(temp).show();
        }
        chatHTML5.addWebcam(user.id, removeTags(user.username), true, true);

    }

    this.stopTalks = function(user) {
        chatHTML5.currentTalkerid = 0;
        $('#pushTalkBtn').css('pointer-events', 'auto').css('display', 'block');
        $('#pushToTalkFreeHand').css('display', 'block');
        if (chatHTML5.notice ) {
            chatHTML5.notice.remove();
        }
        if (user && user.username) {
            var temp = sprintf('#userList div.userItem[data-username="%s"] i.microphoneTalking', removeTags(user.username));
            $(temp).hide();
            chatHTML5.removeWebcam(user.id);
        }
    };

    this.stopTalk = function() {
        chatHTML5.myUser.wantsToTalk = false;
        chatHTML5.changeMyStatus();
        chatHTML5.myUser.talks = false;
        $('#pushTalkBtn').css('pointer-events', 'auto');
        if (chatHTML5.notice ) {
            chatHTML5.notice.remove();
        }
        chatHTML5.socket.emit('stopTalks');
        setTimeout(function() {
            $('#pushTalkBtn').css('pointer-events', 'auto');
        }, parseInt(chatHTML5.config.timeoutBeforeTalkAgain));
    };

    $('#pushTalkBtn').on('mouseup mouseout', function(e){
        if ($('#pushToTalkFreeHand').prop('checked')) {
            return;
        }
        chatHTML5.stopTalk();
    });

    $('#pushToTalkFreeHand').click(function() {
        if ($('#pushToTalkFreeHand').prop('checked')) {
            $('#pushTalkBtn').trigger('mousedown');
        } else {
            chatHTML5.stopTalk();
        }
    })

    $('#pushTalkBtn').on('mousedown', function(e){
        if (!chatHTML5.checkAllowed('canPushToTalk')) {
            return;
        }
        if (chatHTML5.myUser.pushToTalk=='0') {
            $('#pushToTalkFreeHand').prop('checked', false);
            return;
        }
        if (!chatHTML5.myUser.webcam) {
            bootbox.alert(chatHTML5.traductions.youNeedToEnableYourWebcamToPushToTalk);
            $('#pushToTalkFreeHand').prop('checked', false);
            return;
        }
        chatHTML5.myUser.talks = true;
        chatHTML5.socket.emit('talks');
        var message = sprintf(chatHTML5.traductions.youAreTalking);
        console.log('mousedown');
        chatHTML5.notice = new PNotify({
            title: chatHTML5.traductions.pushToTalk,
            text: message,
            type: 'success',
            styling:'bootstrap3',
            hide:false
        });

        if (chatHTML5.config.pushToTalkFreeHand=='0') {
            setTimeout(function() {
                chatHTML5.stopTalk();
            }, parseInt(chatHTML5.config.pushToTalkMax));
        }
    })

    $('#sortWebcamtBtn').click(function() {
        $(this).toggleClass('selected');
        if ($(this).hasClass('selected')) {
            chatHTML5.sortUsersWebcam();
        }
    });

    $('#sortBtn').click(function() {
        $(this).toggleClass('selected');
        if ($(this).hasClass('selected')) {
            chatHTML5.sortUsersAZ();
        }

        /*if ($(this).data('sort')==0) {
            $(this).data('sort', 1);
            chatHTML5.sortUsersZA();
            $(this).find('i').removeClass('fa-sort-alpha-asc').addClass('fa-sort-alpha-desc');
        } else {
            $(this).find('i').removeClass('fa-sort-alpha-desc').addClass('fa-sort-alpha-asc');
            $(this).data('sort', 0);
            chatHTML5.sortUsersAZ();
        }

         */
    })

    this.sortUsers = function() {
        chatHTML5.users.sort(function(user1, user2){
            return user1.avatar < user2.avatar;
        });
    };

    jQuery.fn.sortDomElements = (function() {
        return function(comparator) {
            return Array.prototype.sort.call(this, comparator).each(function(i) {
                this.parentNode.appendChild(this);
            });
        };
    })();

    this.sortUsersWebcam = function() {
        try {
            $('#userList').children().sortDomElements(function(a,b){
                var akey = $(a).data('webcam');
                var bkey = $(b).data('webcam');
                if (akey == bkey) return 0;
                if (akey < bkey) return 1;
                if (akey > bkey) return -1;
            })
        }catch(e) {
        }
    };

    this.sortUsersAZ = function() {
        try {
            $('#userList').children().sortDomElements(function(a,b){
                var akey = $(a).data('username');//.toLowerCase();
                var bkey = $(b).data('username');//.toLowerCase();
                if (akey == bkey) return 0;
                if (akey < bkey) return -1;
                if (akey > bkey) return 1;
            })
        }catch(e) {
            return -1;
        }
    };
    this.sortUsersZA = function() {
        try {
            $('#userList').children().sortDomElements(function(a,b){
                var akey = $(a).data('username').toLowerCase();
                var bkey = $(b).data('username').toLowerCase();
                if (akey == bkey) return 0;
                if (akey < bkey) return 1;
                if (akey > bkey) return -1;
            })
        } catch (e) {

        }
    }
    this.closeAllTabs = function() {
        if (chatHTML5.config.multiRoomEnter=='0') {
            tabs.closeAll();
        }
    };

    this.getCaretPosition = function (editableDiv) {
        var caretPos = 0, sel, range;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.rangeCount) {
                range = sel.getRangeAt(0);
                if (range.commonAncestorContainer.parentNode == editableDiv) {
                    caretPos = range.endOffset;
                }
            }
        } else if (document.selection && document.selection.createRange) {
            range = document.selection.createRange();
            if (range.parentElement() == editableDiv) {
                var tempEl = document.createElement("span");
                editableDiv.insertBefore(tempEl, editableDiv.firstChild);
                var tempRange = range.duplicate();
                tempRange.moveToElementText(tempEl);
                tempRange.setEndPoint("EndToEnd", range);
                caretPos = tempRange.text.length;
            }
        }
        //console.log('getCaretPosition', caretPos);
        return caretPos;
    }

    this.setCaretPosition = function(el) {
        var range = document.createRange();
        var sel = window.getSelection();
        range.setStart(el.childNodes[0], 5);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }


    $(document).on('click', 'button.raiseHandBtn', function(e) {
        $(this).remove();
        chatHTML5.socket.emit('raiseHand', chatHTML5.myUser);
        chatHTML5.myUser.wantsToTalk = true;
        chatHTML5.changeMyStatus();
    });

    $(document).on('click', '.gifAnimated', function(e) {
        var src = $(this).prop('src');
        $('#smileyContainer').slideToggle(100);
        var temp = sprintf('<img class="gif" src="%s">', src);
        chatHTML5.setEndOfContenteditable();
        chatHTML5.emojiArea[0].emojioneArea.setHTML(temp);
    })


    this.setEndOfContenteditable = function()
    {
        var contentEditableElement = document.getElementsByClassName('emojionearea-editor')[0];
        var range,selection;
        if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
        {
            range = document.createRange();//Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            selection = window.getSelection();//get the selection object (allows you to change selection)
            selection.removeAllRanges();//remove any selections already made
            selection.addRange(range);//make the range you have just created the visible selection
        }
        else if(document.selection)//IE 8 and lower
        {
            range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
            range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            range.select();//Select the range (make it the visible selection
        }
    }

    $(document).ready(function(e) {
        chatHTML5.emojiArea = $('#chatInput').emojioneArea({
            pickerPosition: 'top',
            tones: false,
            shortnames:true,
            saveEmojisAs:'shortname',
            autocomplete: true,
            recentEmojis: false,
            inline: false,
            hidePickerOnBlur: true,
            placeholder: chatHTML5.traductions.enterYourTextHere,
            beforeDisplayUsers: getLastUsersMenu,
            events: {
                paste: function (editor, event) {
                    //event.stopImmediatePropagation();
                    //event.preventDefault();
                    //console.log('event:paste');
                },
                'focus':function (editor, event) {
                    if (chatHTML5.isMobile()) {
                        $("div.jsPanel.ui-draggable.ui-resizable").hide();
                    }
                },
                'blur': function (editor, event) {
                    if (chatHTML5.isMobile()) {
                        $("div.jsPanel.ui-draggable.ui-resizable").show();
                    }
                },
                'keyup': function (editor, event) {
                    editor.focus();
                },
                'keydown':function (editor, event) {

                    if ($('.emojionearea-picker').css('display')!=='none') {
                        $('.emojionearea-button-close').click();
                    }
                    keyPressedFunction(event);
                },
            }
        });

        $(document).on('autoCompleteUserChoosed', function(e, data) {
            var user = chatHTML5.users[data.id];
            if (!user) {
                return;
            }
            if (data.action=='mention') {
                chatHTML5.addUserToMention(user);
            } else {
                chatHTML5.addUserToWhisper(user);
            }
            chatHTML5.emojiArea[0].emojioneArea.setText('');
        });

        $('#privateOrMentionContainer').click(function() {
            $('#footer').removeClass('activeMention').removeClass('activeWhisper');
        })


        function getLastUsersMenu() {
            var arr = $.map(chatHTML5.users, function(user) {
                if(user.username!=chatHTML5.myUser.username && (chatHTML5.roles[user.role] && chatHTML5.roles[user.role]['isVisible']=='1')) {
                    return {id:user.id, username:user.username, image:user.image};
                }
            });
            return arr;
        }

        $(document).on('keyup', function(e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode ==27 && $('#lightBox').is(':visible')) {
                $('#lightBox').click();
                return;
            }
            if (keyCode == 27 && $("ul.textcomplete-dropdown").css('display')=='none') {
                chatHTML5.emojiArea[0].emojioneArea.setText('');
                return;
            }
        });


        $(document).on('keypress', '.windowInputChat', function(e) {
            if (chatHTML5.amIMuted()) {
                return;
            }

            var input = this;
            var keyCode = e.keyCode || e.which;

            if (keyCode === 13) {
                var plainText = removeTags($(input).val());
                console.log("plainText2");
                console.log(plainText);
                $(input).val('');
                var userid = $(input).parent().parent().parent().prop('id');
                plainText = chatHTML5.filterBadWord(plainText);
                var extras = {color:$('#colorPicker').val(), date:Date.now(), bold:$('#boldDiv').hasClass('fontSelected'), italic: $('#italicDiv').hasClass('fontSelected'), underline:$('#underlineDiv').hasClass('fontSelected')};
                if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canSendPrivate=='0') {
                    return;
                }

                chatHTML5.socket.emit('sendPrivate', chatHTML5.myUser, plainText, userid, extras);
                var destinationUser = jQuery.extend(true, {}, chatHTML5.myUser);
                destinationUser.id = userid;
                chatHTML5.receivePrivate(destinationUser, plainText, extras);
            }
        });
    });
    this.addUserToMention = function(user) {
        if(!$('#footer').hasClass('activeMention')){
            $('#footer').addClass('activeMention');
        }
        $('#texteCaption').text(chatHTML5.traductions.mentionText);
        $('#privateOrMentionContainer').css('background-image', 'url("' + user.image + '")').prop('title', user.username).data('userid', user.id).data('action', 'mention');
    }

    this.addUserToWhisper = function(user) {
        if(!$('#footer').hasClass('activeWhisper')){
            $('#footer').addClass('activeWhisper');
        }
        $('#texteCaption').text(chatHTML5.traductions.whisperText);
        $('#privateOrMentionContainer').css('background-image', 'url("' + user.image + '")').prop('title', user.username).data('userid', user.id).data('action', 'whisper');
    }

    this.redirectUrl = function(url) {
        if (!url) {
            window.location.reload();
        } else {
            try {
                window.location = url;
                top.document.location.href = url;
            } catch(e) {

            }
        }
    }

    $(document).on('click', '.windowEraser', function(e) {
        $(this).parent().parent().find('.windowChat').empty();
    });

    function keyPressedFunction(e) {
        if (!e) {
            e = window.event;
        }
        var plainText = chatHTML5.emojiArea[0].emojioneArea.getText();
        var keyCode = e.keyCode || e.which;
        if (keyCode==8 && plainText=='') {
            if($('#footer').hasClass('activeMention') || $('#footer').hasClass('activeWhisper')){
                $('#footer').removeClass('activeMention').removeClass('activeWhisper');
            }
        }

        if (keyCode === 13  && $(".dropdown-menu.textcomplete-dropdown").is(':visible')) {
            e.preventDefault();
            e.stopImmediatePropagation;
            return;
        }
        // tester si maxLenthMessage ou


        var maxLengthMessage = parseInt(chatHTML5.config.maxLenthMessage);
        if (maxLengthMessage && plainText.length>maxLengthMessage) {
            e.preventDefault();
            e.stopImmediatePropagation;
            var keepText = plainText.substr(0, maxLengthMessage-1);
            chatHTML5.emojiArea[0].emojioneArea.setText(keepText);
            chatHTML5.setEndOfContenteditable();
            return;
        }
        var maxLinesMessages = parseInt(chatHTML5.config.maxLinesMessages);
        var numberOfOccurenciesOfReturn = (plainText.match(/\n/g) || []).length;
        if (maxLinesMessages && numberOfOccurenciesOfReturn>maxLinesMessages) {
            e.preventDefault();
            e.stopImmediatePropagation;
            var keepText = plainText.substr(0, plainText.length-1);
            chatHTML5.emojiArea[0].emojioneArea.setText(keepText);
            chatHTML5.setEndOfContenteditable();
            return;
        }
        if (!chatHTML5.myUser.isWriting) {
            if ((chatHTML5.config.chatType==='tab' || chatHTML5.config.chatType==='window' || chatHTML5.config.chatType==='tabAndWindow' || chatHTML5.config.chatType==='conference') && chatHTML5.getCurrentTab().room) {
                if (plainText.trim()=='') {
                    return;
                }
                chatHTML5.myUser.isWriting = true;
                chatHTML5.socket.emit('writes', plainText);
            }
            var timeout = (chatHTML5.predictiveReadingUsers.length)?1000:4000;
            setTimeout(function() {
                chatHTML5.myUser.isWriting = false;
                newPlainText = chatHTML5.emojiArea[0].emojioneArea.getText();
                if (newPlainText!=plainText && newPlainText) {
                    chatHTML5.socket.emit('writes', newPlainText);
                }
            }, timeout);
        }
        if (keyCode === 13 && e.shiftKey) {
            return;
        }



        if (keyCode === 13 ) {
            e.preventDefault();
            if ($(e.target).parent().parent().attr('id')==='chatInputContainer') {
                chatHTML5.sendText();
            }
        }
    }


    setInterval(function() {
        chatHTML5.displayDateAgo();
        // delete
        $('div.tab-pane.active div.message.flex-property.msg-box:lt(80)');
    }, 10000);

    this.getDateAgo = function(date) {
        var date = new Date(date).getTime();
        return ago(date);
    }

    this.displayDateAgo = function() {
        $('#chatContainer .timeStamp').each(function(index, element) {
            var date = $(element).data('date');
            $(element).text(chatHTML5.getDateAgo(date));
        });
        $('div.windowChat .timeStamp').each(function(index, element) {
            var date = $(element).data('date');
            $(element).text(chatHTML5.getDateAgo(date));
        });
    };

    setInterval(function() {
        chatHTML5.removeServerMessages();
    }, 2000);

    this.removeServerMessages = function() {
        if (chatHTML5.config.hideMessageServerAfterNseconds=='0') {
            return;
        }
        $('div.serverText').each(function( index) {
            if ($(this).data('time') && $(this).data('time')>1 && Date.now()>$(this).data('time')) {
                $(this).remove();
            }
        });
    }

    $('#searchInput').keydown(function(e) {
        if (e.keyCode>105) {
            e.preventDefault();
        }
    });

    $('input#searchInputRoom').keyup(function(e) {
        chatHTML5.searchRooms();
    });
    $('#adultRoomCheckBox').change(function() {
        chatHTML5.searchRooms();
    });
    $('#adultRoomCheckBox2').change(function() {
        chatHTML5.searchRooms2();
    });
    $('input#searchInputRoom2').keyup(function(e) {
        chatHTML5.searchRooms2();
    });

    this.searchRooms = function() {
        $('#tableRoomBody2 tr').show();
        $('#tableRoomBody2 tr').each(function(index, element) {
            if (!$('#adultRoomCheckBox').prop('checked')) {
                var adult = ($(element).data('adult') == '1');
                if (adult) {
                    $(element).hide();
                }
            }
        })
        var searchRoom = $('#searchInputRoom').val();
        if (!searchRoom) {
            return;
        }
        var temp = sprintf("#tableRoomBody2 tr:not([data-name*='%s' i])", searchRoom);
        $(temp).hide();
    };

    this.searchRooms2 = function() {
        $('#tableRoomBody tr').show();
        $('#tableRoomBody tr').each(function(index, element) {
            if (!$('#adultRoomCheckBox2').prop('checked')) {
                var adult = ($(element).data('adult') == '1');
                if (adult) {
                    $(element).hide();
                }
            }
        })
        var searchRoom = $('#searchInputRoom2').val();
        if (!searchRoom) {
            return;
        }
        var temp = sprintf("#tableRoomBody tr:not([data-name*='%s' i])", searchRoom);
        $(temp).hide();
    };

    $('#searchInput').keyup(function(e) {
        chatHTML5.searchUsers();
    });


    this.searchUsers = function() {
        if (!chatHTML5.getCurrentTab().room) {
            return;
        }
        $('#userList div.userItem').show();
        $('input[data-gender]').each(function(index, element) {
            if (!$(element).prop('checked')) {
                var gender = $(element).data('gender');
                //console.log('hide', sprintf("#userList .userItem[data-gender='%s']", gender));
                $(sprintf("#userList .userItem[data-gender='%s']", gender)).hide();
            }
        });

        var searchUsername = $('#searchInput').val();
        if (!searchUsername) {
            return;
        }
        var temp = sprintf("#userList .userItem:not([data-username*='%s' i])", searchUsername);
        $(temp).hide();
    };

    $('.filtergenderItem').click(function(e) {
        chatHTML5.searchUsers();
    });

    this.loginConference = function(username, password) {
    }
    this.login = function(username, password) {
        username = username.replace(/<(?:.|\n)*?>/gm, '');
        username = username.replace(/["();']/g, '');
        var nameRegex = /^[^'"\s]*$/;

        if (!username.match(nameRegex)) {
            bootbox.alert(chatHTML5.traductions.badLoginOrPassword);
            return;
        }
        if (chatHTML5.config.chatType=='conference') {
            //chatHTML5.loginConference(username, password);
        }

        $.post(chatHTML5.config.ajax, {a:'loginJWT', username:username, password:password, webmasterid:chatHTML5.config.webmasterid, chatType:chatHTML5.config.chatType, startRoom:chatHTML5.myUser.startRoom}, function (user) {
            user = JSON.parse(user);
            if (user.result==='ko') {
                bootbox.alert(user.message);
                return;
            }
            if (user.jwt && user.redirectUrl) {
                document.location = user.redirectUrl;
                return;
            }

            chatHTML5.myUser = chatHTML5.getDefaultUser();
            jQuery.extend(chatHTML5.myUser, user);
            if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canPostYouTube=='1') {
                $('#djButtonContainer').show();
            } else {
                $('#djButtonContainer').hide();
            }
            chatHTML5.loggedOn();
            $('#myAvatar img').prop('src', chatHTML5.myUser.image).prop('title', chatHTML5.myUser.username);
        });
    };

    this.loginAsGuest = function(username, gender) {
        username = username.replace(/<(?:.|\n)*?>/gm, '');
        username = username.replace(/["();']/g, '');
        var nameRegex = /[^;\\\/\$\^\`~\:\!\.\,\%\=\)\(\[\]]{2,}/;
        if (!username.match(nameRegex) || username.toLowerCase()=='admin') {
            bootbox.alert(chatHTML5.traductions.badLoginOrPassword);
            return;
        }
        if (chatHTML5.config.forbiddenWordsApplyToUsername=='1' && chatHTML5.forbiddenWords.length) {
            var regex = new RegExp(chatHTML5.forbiddenWords.join('|'), 'gi');
            if (username.match(regex)) {
                bootbox.alert(chatHTML5.traductions.invalidUsername);
                return;
            }
        }
        var defaultUser = chatHTML5.getDefaultUser();
        jQuery.extend(chatHTML5.myUser , defaultUser);
        chatHTML5.myUser.username = removeTags(username);
        chatHTML5.myUser.gender = gender;
        chatHTML5.myUser.credits = 0;

        var randomAvatar = chatHTML5.getUserAvatar(gender);
        chatHTML5.myUser.image = randomAvatar;
        chatHTML5.loggedOn();
        $('#myAvatar img').prop('src', chatHTML5.myUser.image).prop('title', chatHTML5.myUser.username);
        // hide upload avatar
        //$('.menuUserItem[data-action="avatar"]').hide();
    };


    this.getUserAvatar = function(gender) {
        if (chatHTML5.config.showRandomAvatarsForGuests==='0') {
            for (var i = chatHTML5.config.genders.length;i--;){
                var agender = chatHTML5.config.genders[i];
                if (agender.gender === gender && agender.image) {
                    return '/upload/genders/' + agender.image;
                }
            }
        } else {
            return chatHTML5.pickupRandomAvatar(gender);
        }
    };


    $(document).on('click', '.registerNow', function(e) {
        $('#overlayRegister').slideToggle();
    });

    this.$getChat = function(tabid) {
        var temp = sprintf('.tab-content div.tab-pane#%s', tabid);
        return $(temp);
    };

    this.getLastChats = function(maxChats, roomid) {
        $.post(chatHTML5.config.ajax, {a: 'getChatMessages', maxChats:maxChats, roomid:roomid}, function (chats) {
            chats = JSON.parse(chats);
            chats = chats.reverse();
            for (var id in chats) {
                var chat = chats[id];
                var extras = JSON.parse(chat.extras);
                extras.doNotAnimate = true;
                //extras.date = chat.date;
                var user = JSON.parse(chat.user);
                user.username = removeTags(chat.username);
                if (chat.message) {
                    chatHTML5.receiveText(user, chat.message, extras);
                }
            }
            chatHTML5.displayDateAgo();

        });
    };

    this.getRoomsIOwe = function() {
        var myRooms = {};
        $.each(chatHTML5.rooms, function( id, room ) {
            if ( parseInt(room.ownerid) == chatHTML5.myUser.id) {
                myRooms[id] = room;
            }
        });
        return myRooms;
    };

    this.getRoomsIOweNumber = function() {
        var myRooms = chatHTML5.getRoomsIOwe();
        return Object.keys(myRooms).length;
    };

    this.isMyRoom = function(roomid) {
        var myRooms = chatHTML5.getRoomsIOwe();
        return Boolean(myRooms[roomid]);
    };

    this.warningAdultRoom = function(room) {
        return new Promise(function(resolve, reject) {
            if (room.isAdult=='0') {
                resolve(true);
            }
            if (chatHTML5.config.adultRoomAction=='showWarning' &&  room.isAdult=='1') {
                bootbox.confirm(chatHTML5.traductions.warningAdultRoom, function(res) {
                    resolve(res);
                })
            } else {
                resolve(true);
            }
        })
    };


    this.changeRoom = function(roomid) {
        var room = chatHTML5.rooms[roomid];
        chatHTML5.myUser.startRoom = 0;
        this.warningAdultRoom(room).then(function(canEnter) {
            var room = chatHTML5.rooms[roomid];
            if (!canEnter) {
                return;
            }

            if (chatHTML5.config.multiRoomEnter=='1') {
                chatHTML5.myUser.room = room;
                $('#roomsModal').modal('hide');
                chatHTML5.myUser.enterChatMode = (chatHTML5.config.enterChatMode>='1');
                chatHTML5.socket.emit('enterRoom', chatHTML5.myUser);
                return;
            } else {
                chatHTML5.stopTalks();
                var room = chatHTML5.rooms[roomid];
                chatHTML5.myUser.room = room;
                chatHTML5.socket.disconnect();
                chatHTML5.users = {};
                chatHTML5.loggedOn();
                if (room.webcam==='0') {
                    $('#webcamBtn').parent().hide();
                } else {
                    $('#webcamBtn').parent().show();
                }
                if (room.colorPicker==='0') {
                    $('#colorPickerContainer').hide();
                } else {
                    $('#colorPickerContainer').show();
                }
            }
        })
    };

    this.roleShowOnTopofUserList = function (myrole) {
        var res = false;
        $.each(chatHTML5.roles, function( index, role ) {
            if (myrole==role.role && role.showOnTopofUserList =='1') {
                res = true;
                return res;
            }
        });
        return res;
    }

    this.roleWebcamAutoStart = function (myrole) {
        var res = false;
        $.each(chatHTML5.roles, function( index, role ) {
            if (myrole==role.role && role.webcamAutoStart =='1') {
                res = true;
                return res;
            }
        });
        return res;
    };

    this.startUpWebcam = function() {
        if (chatHTML5.genders[chatHTML5.myUser.gender] && chatHTML5.genders[chatHTML5.myUser.gender].canBroadcast=='1' && (!chatHTML5.isMobile() || chatHTML5.config.webrtcServer!='')) {
            $('#broadcastContainer').show();
        }
        if (chatHTML5.roles[chatHTML5.myUser.role] && chatHTML5.roles[chatHTML5.myUser.role]['canBroadcast']=='1') {
            $('#broadcastContainer').show();
        }
        if (chatHTML5.config.webrtcServer=='mediasoup') {
            if ((chatHTML5.genders[chatHTML5.myUser.gender] || {}).webcamAutoStart=='1' || chatHTML5.roleWebcamAutoStart(chatHTML5.myUser.role)) {
                $('#webcamBtn').prop('checked', true).change();
                chatHTML5.displayMyWebcam(true);
            } else {

            }
        }
        else {
            if (chatHTML5.config.webcamAutoStart == '1' || (chatHTML5.genders[chatHTML5.myUser.gender] || {}).webcamAutoStart=='1' || chatHTML5.roleWebcamAutoStart(chatHTML5.myUser.role)) {
                $('#webcamBtn').prop('checked', true);
                $('#webcamBtn').prop('checked', true).change()
            }
        }
    }

    this.prepareConference = function() {
        if ( (chatHTML5.roles[chatHTML5.myUser.role] || {}).canBroadcast!='1') {
            $('#usersContainer.conference  #slide_block').hide();
            if (!chatHTML5.isMobile()) {
                var minSize = 640;
                var porcent1 = parseInt((minSize / window.innerWidth) * 100);
                var porcent2 = 100 - porcent1;
                Split(['#chatContainer', '#usersContainer'], {
                    sizes: [porcent1, porcent2],
                    minSize: minSize
                });
            }
        }
    };

    this.loggedOn = function() {
        if (chatHTML5.config.webrtcServer=='mediasoup') {
            //debugger;
            //connectMS(chatHTML5.config.webrtcServerUrl, chatHTML5.myUser.id, chatHTML5.config.VIDEO_CONSTRAINTS);
        }
        if (chatHTML5.config.webrtcServer=='janus') {
            var is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (is_safari) {
                startJanus(chatHTML5.config.webrtcServerUrl, chatHTML5.myUser, {
                    urls: chatHTML5.config.coturnUrl,
                    username: chatHTML5.config.coturnUsername,
                    credential: chatHTML5.config.coturnPassword
                });
            } else {
                startJanus(chatHTML5.config.webrtcServerUrl, chatHTML5.myUser);
            }
        }
        var myrole = chatHTML5.roles[chatHTML5.myUser.role] || {};
        $(document).ready(function(e) {
            chatHTML5.emojiArea[0].emojioneArea.canPaste = myrole.canPaste=='1';
        });
        var adTimer =  parseInt(myrole.adTimer) * 1000;
        if (adTimer) {
            setInterval(function () {
                    chatHTML5.serverMessage(myrole.adContent)
                },
                adTimer);
        }
        var timeoutOffline = parseInt(chatHTML5.config.timeoutOffline) * 1000;
        if (timeoutOffline) {
            $(document).idle({
                onIdle: function(){
                    if (chatHTML5.myUser.status!='invisible') {
                        chatHTML5.myUser.oldStatus = chatHTML5.myUser.status;
                        chatHTML5.myUser.status = 'offline';
                        chatHTML5.changeMyStatus();
                    }
                },
                onActive: function(){
                    if (chatHTML5.myUser.status!='invisible') {
                        chatHTML5.myUser.status = chatHTML5.myUser.oldStatus;
                        chatHTML5.changeMyStatus();
                    }
                },
                idle: timeoutOffline
            })
        }
        var timeoutLogout = parseInt(chatHTML5.config.timeoutLogout) * 1000;
        if (timeoutLogout) {
            $(document).idle({
                onIdle: function(){
                    chatHTML5.redirectUrl(config.quitUrl);
                },
                idle: timeoutLogout
            })
        }
        var originalColor = (localStorage.getItem('color'))?localStorage.getItem('color'):(chatHTML5.roles[chatHTML5.myUser.role] || {}).colorText || '#000000';

        if (!$('div.colorPicker-picker').length) {
            try {
                $('#colorPicker').colorPicker({
                    colors: chatHTML5.config.colorsPicker.replace(/['"]+/g, '').split(','),
                    pickerDefault: originalColor,
                    onColorChange: function (id, newValue) {
                        localStorage.setItem('color', newValue);
                    }
                });
            } catch (e) {
            }
        }

        var currentYear = (new Date()).getFullYear();
        var age = parseInt(chatHTML5.myUser.birthyear);
        (age) ?  chatHTML5.myUser.age = (currentYear - age) : 0;

        if (chatHTML5.config.chatType==='conference') {
            this.prepareConference();

        }

        this.getNews();
        this.getRSS();
        $('.myUsername').text(chatHTML5.myUser.username);
        $('#webcamsContainer').empty().hide();
        //$('#tabs').css('height', 'calc(100% - 120px)');
        $('.modal').modal('hide');
        $('#chat').empty();
        $('#chatInput').val('');
        localStorage.setItem('username', chatHTML5.myUser.username);
        localStorage.setItem('password', chatHTML5.myUser.password);
        $('#myAvatar').prop('src', this.myUser.avatar).prop('title', this.myUser.username);
        if (typeof serverWebrtc != 'undefined') {
            this.myUser.myStreamName = serverWebrtc.myStreamName;
        }
        chatHTML5.welcomedRoom = 0;
        chatHTML5.connectToServer();

        chatHTML5.getMutedUsers().then(function(mutedUsers) {
            chatHTML5.muted = (mutedUsers || []);
        })

        chatHTML5.getJailedUsers().then(function(jailedUsers) {
            chatHTML5.jailedUsers = (jailedUsers || []);
        })

        //
        setTimeout(function() {
            chatHTML5.startUpWebcam();
        }, 1500)


    };
    this.rouletteNextUser = function() {
        var html = '<i class="fa fa-circle-o-notch fa-spin fa-fw" aria-hidden="true"></i>' + chatHTML5.traductions['Searching'];
        $('#chatRouletteBtn').html(html).attr('disabled', true);
        // close tabs with id user !
        var privateWithId = chatHTML5.getCurrentTab().id || 0;
        if (privateWithId && chatHTML5.isAlreadyInPrivateWith(privateWithId)) {
            chatHTML5.socket.emit('privateClosed', privateWithId);
        }
        chatHTML5.socket.emit('rouletteNextUser', chatHTML5.myUser);
    }

    $('#chatRouletteBtn').click(function() {
        if (chatHTML5.config.chatType=='roulette') {
            //tabs.closeActive();
            chatHTML5.rouletteNextUser();
            return;

        } else {
            var users = [];
            for(var userid in chatHTML5.users) {
                if (chatHTML5.users[userid].hasWebcam && chatHTML5.users[userid].webcamPublic) {
                    users.push(chatHTML5.users[userid]);
                }
            }
            var randomUser = users[Math.floor(Math.random()*users.length)];
            if (randomUser) {
                chatHTML5.addWebcam(randomUser.id, removeTags(randomUser.username));
            }
        }


    })
    $('#broadcastCheckBox').change(function(event) {
        if(!event) {
            return;
        }
        var url = (window.location != window.parent.location)
            ? document.referrer
            : document.location.href;
        var username = removeTags(chatHTML5.myUser.username);
        if (!$('#broadcastCheckBox').prop('checked')) {
            bootbox.confirm(chatHTML5.traductions.ConfirmBroadcast, function(res) {
                if (res) {
                    $('#broadcastCheckBox').data('canceled', false);
                    $('#broadcastCheckBox').bootstrapToggle('disable');
                    chatHTML5.socket.emit('broadcast', true, chatHTML5.myUser);
                    chatHTML5.myUser.broadcast = true;

                    if (chatHTML5.config.recordBroadcast=='1' && typeof startRecordVideo=='function') {
                        chatHTML5.myUser.filename = 'record' + Date.now();
                        startRecordVideo(chatHTML5.myUser.filename);
                    }
                    if (chatHTML5.config.jsCallBackStartBroadcast) {
                        var js = sprintf("%s(%s)", chatHTML5.config.jsCallBackStartBroadcast, username);
                        eval(js);
                    }
                    setTimeout(function() {
                        $('#broadcastCheckBox').bootstrapToggle('enable');
                    }, 5000);
                    var res = {event:'broadcastStarted', userid:chatHTML5.myUser.id, username:chatHTML5.myUser.username};
                    window.parent.postMessage(res, url)
                } else {
                    $('#broadcastCheckBox').data('canceled', true);
                    $('#broadcastCheckBox').prop('checked', true).change();
                }
            })
        } else {
            if ($('#broadcastCheckBox').data('canceled')) {
                return;
            }

            if (chatHTML5.config.jsCallBackStopBroadcast) {
                var js = chatHTML5.config.jsCallBackStopBroadcast.replace('{username}', username);
                eval(js);
            }
            chatHTML5.myUser.broadcast = false;
            chatHTML5.socket.emit('broadcast', false, chatHTML5.myUser);

            if (chatHTML5.config.recordBroadcast=='1' && typeof stopRecordVideo=='function') {
                stopRecordVideo();
                $.post(chatHTML5.config.recordUrl, {filename: chatHTML5.myUser.filename, codec:chatHTML5.config.codec}, function (resultRecord) {
                    resultRecord = JSON.parse(resultRecord);
                    if (!resultRecord.error) {
                        $.post(chatHTML5.config.ajax, {a: 'saveBroadcast', filename:resultRecord.filename, videourl:resultRecord.videourl, thumburl:resultRecord.thumburl, duration:resultRecord.duration}, function (res) {
                            resultRecord.userid = chatHTML5.myUser.id;
                            resultRecord.username = removeTags(chatHTML5.myUser.username);
                            resultRecord.event = 'broadcastStopped';
                            window.parent.postMessage(resultRecord, url);
                            console.log('resultRecord',resultRecord);
                        });
                    }
                });
            } else {
                var res = {userid : chatHTML5.myUser.id, username:chatHTML5.myUser.username, event :'broadcastStopped'};
                window.parent.postMessage(res, url);
            }
        }
    });

    $(document).on('click', '.clickToRegisterBtn', function(e) {
        $('#overlayRegister').slideToggle();
    });

    this.inviteWebcamChat = function(id, username) {
    };

    this.startTimer = function() {
        chatHTML5.timeCounter = 0;
        chatHTML5.timeCounterInterval = setInterval(chatHTML5.updateTimer,1000);
    };
    this.updateTimer = function() {
        chatHTML5.timeCounter++;
        $('#timeCounter').text(chatHTML5.timeCounter.toString().toHHMMSS());
    };

    this.stopTimer = function() {
        clearInterval(chatHTML5.timeCounterInterval);
    };

    this.amIMinor = function() {
        var age = parseInt(chatHTML5.myUser.birthyear);
        if (chatHTML5.myUser.role=='guest') {
            return true;
        }
        if (age) {
            var currentYear = (new Date()).getFullYear();
            return (currentYear - age)<18;
        } else {
            return false;
        }
    };

    this.isMinor = function(userid) {
        try {
            var res = true;
            var user = (chatHTML5.users[userid] || {});
            var age = parseInt(user.birthyear);
            if (age) {
                var currentYear = (new Date()).getFullYear();
                return (currentYear - age)<18;
            }
            return res;
        } catch(e) {
            return false;
        }
    };

    this.checkMinorAllowed = function(userid) {
        var res = true;
        try {
            if (chatHTML5.config.minorCanContactAdult=='0' && chatHTML5.isMinor(userid)) {
                bootbox.alert(chatHTML5.traductions.actionForbiddenToMinors, function(res) {
                });
                return false;
            }
            return res;

        }catch (e) {
            return true;
        }
    };

    this.checkAllowed = function(action) {
        if ((chatHTML5.roles[chatHTML5.myUser.role] || [])[action]=='0') {
            bootbox.alert(chatHTML5.traductions.guestTrialMessage + ':' + action, function() {
                if (chatHTML5.config.guestTrialUrlWhenForbidden) {
                    chatHTML5.redirectUrl(chatHTML5.config.guestTrialUrlWhenForbidden);
                }
            })
            return false;
        } else {
            return true;
        }
    }


    this.getGenderById = function(genderid) {
        var res = '';
        $.each(chatHTML5.config.genders, function( id, gender ) {
            if (genderid==gender.id) {
                res =  gender.gender;
            }
        });
        return res;
    }
    this.getGenderId = function(genderLabel) {
        var res = 0;
        $.each(chatHTML5.config.genders, function( id, gender ) {
            if (genderLabel==gender.gender) {
                res =  gender.id;
            }
        });
        return res;
    }




    this.pickupRandomAvatar = function(gender) {
        if (chatHTML5.config.genders) {
            chatHTML5.config.genders.forEach(genderElement =>{
                if (genderElement.gender==gender) {
                    gender = genderElement.mappedGender;
                }
            });
        }
        gender = (gender || 'male');
        gender = gender.toLowerCase();
        if (gender=='female') {
            return '/img/avatars/f/' + Math.ceil(Math.random()*8) + '.svg';
        }
        if (gender=='couple' || gender=='cpl') {
            return '/img/avatars/c/' + Math.ceil(Math.random()*2) + '.svg';
        }
        return '/img/avatars/m/' + Math.ceil(Math.random()*22) + '.svg';
    }

    this.addPrivateMessage = function (fromUser, toUser, message) {
        var activeUser;
        var fromTo;
        if (chatHTML5.myUser.username==fromUser.username){
            activeUser = toUser;
            fromTo = '@' + activeUser.username;
        } else {
            activeUser = fromUser;
            fromTo = activeUser.username + '@';
        }

        var temp = sprintf("<b>\
        <img src='%s' alt='%s'>\
        <span data-id='%s' data-username='%s' class='userItem'>%s</span> </b> %s",
            activeUser.image, removeTags(activeUser.username),
            activeUser.id, removeTags(activeUser.username), fromTo, message);

        chatHTML5.serverMessage(temp, 'addPrivateMessage');
    }

    this.getMyFriends = function() {
        chatHTML5.socket.emit('getFriends', chatHTML5.myUser.webmasterid, function(friendsOnline) {
            chatHTML5.myUser.friends = friendsOnline;
            var playSound = false;
            var dom = '#friendsList';
            $(dom).empty();
            for (var userid in friendsOnline) {
                var aFriend = friendsOnline[userid];
                chatHTML5.addUser(aFriend, playSound, dom, true);
            }
            chatHTML5.updateFriendsOnlineNumber();
        });
    };

    this.saveState = function() {
        // webcam ouvertes
        // salons ouverts
        // chat privés ouverts
    };

    this.connectToServer =  async function() {
        chatHTML5.myUser.isMobile = chatHTML5.isMobile();
        if (chatHTML5.myUser.role=='undefined' || !chatHTML5.myUser.role) {
            chatHTML5.myUser.role = 'guest';
        }
        if (chatHTML5.myUser.role == 'guest' && chatHTML5.roles['guest'].canChangeAvatar=='1') {
            chatHTML5.myUser.fingerprint = await chatHTML5.getFingerPrint();
            $.post(chatHTML5.config.ajax, {a:'getAvatarGuest', webmasterid:chatHTML5.myUser.webmasterid, fingerprint:chatHTML5.myUser.fingerprint}, function(image) {
                chatHTML5.myUser.image = `upload/fingerprint/${image}`;
                $('#myAvatar img').prop('src', chatHTML5.myUser.image);
            });
        }
        this.socket = io.connect(chatHTML5.config.node , {'force new connection': false,  transports: ['websocket'],  query:chatHTML5.myUser });
        this.socket.on('quickPrivateMessage', function(user, message) {
            chatHTML5.addPrivateMessage(user, chatHTML5.myUser, message);
        });
        this.socket.on('rouletteNextUser', function(user, isCaller) {
            if (user) {
                var html = '<i class="fa fa-random" aria-hidden="true"></i>' + chatHTML5.traductions['playRandomCam'];
                $('#chatRouletteBtn').html(html).attr('disabled', false);
                $('#middleContainer video').remove();
                chatHTML5.addWebcam(user.id, removeTags(user.username), false);
                if (isCaller) {
                    chatHTML5.socket.emit('privateRequest', user.id);
                }
            } else {
                // try again
                setTimeout(function() {
                    chatHTML5.rouletteNextUser();
                }, 8000);
            }
        });

        this.socket.on('call1to1', function(user) {
            if (chatHTML5.muted[user.id]) {
                return;
            }
            if ($('#acceptPrivateCheckBox').prop('checked')===false) {
                return;
            }
            var message = sprintf('\
                %s\
                <div class="call1to1request" data-id="%s">\
                    <button data-id="%s" data-username="%s" class="acceptCall1to1Btn btn btn-success" >\
                        <i class="fa fa-phone"></i> %s\
                    </button>\
                    <button data-id="%s" data-username="%s" class="denyCall1to1Btn btn btn-warning" >\
                        <i class="fa fa-times"></i> %s\
                    </button>\
                    <button data-id="%s" data-username="%s" class=" muteBtn btn btn-danger" >\
                        <i class="fa fa-microphone-slash"></i> %s\
                    </button>\
                </div>',
                sprintf(chatHTML5.traductions.Incoming1to1From, removeTags(user.username)),
                user.id,
                user.id, removeTags(user.username),
                chatHTML5.traductions.accept,
                user.id, removeTags(user.username),
                chatHTML5.traductions.deny,
                user.id, removeTags(user.username),
                chatHTML5.traductions.mute
            );
            chatHTML5.serverMessageCurrentTab(message, 'privateRequested', user.id);
            chatHTML5.playMP3(chatHTML5.config.soundPrivateRequested);
            setTimeout(function() {
                var temp = sprintf('div.call1to1request[data-id=%s]', user.id);
                $(temp).remove();
            }, parseInt(chatHTML5.config.call1to1TimeOut)*1000)
        });

        this.socket.on('call1to1Ended', function(user, timeOut) {
            chatHTML5.call1to1Ended(user, timeOut);
        });

        this.socket.on('call1to1Cancelled', function(user) {
            var temp = sprintf('div.call1to1request[data-id=%s]', user.id);
            $(temp).remove();
        });

        this.socket.on('call1to1Refused', function(user) {
            clearInterval(chatHTML5.myUser.calling1to1Interval);
            chatHTML5.soundMP3.pause();
            $('#lightBox1to1').hide();
            $('#myVideo').appendTo(chatHTML5.webcamContainer);
            bootbox.alert(sprintf(chatHTML5.traductions.call1to1Refused, removeTags(user.username)));
        });

        $(document).on('dblclick', '#myVideo', function() {
            chatHTML5.addWebcamJanus(chatHTML5.myUser.id, removeTags(chatHTML5.myUser.username), false);
        })

        this.socket.on('call1to1Accepted', function(user) {
            //console.log('call1to1Accepted', user);
            var dom = $('#hisVideo1to1Container');
            if (chatHTML5.config.webrtcServer=='janus') {
                playStream(user.id, dom, false);
            } else if (chatHTML5.config.webrtcServer=='mediasoup') {
                var mutedString = '';
                var remoteid = sprintf("remotevideo%s", user.id);
                var temp = sprintf('<video id="%s" autoplay="autoplay" width="100%%" height="100%%" playsinline="" controls  data-id="%s" %s/>',
                    remoteid, user.id, mutedString);
                dom.append(temp);
                var streamid = (user.streamid)?user.streamid:user.id;
                playStream(streamid, $('#' + remoteid));
            }

            $('#waitingCall').hide(1000);
            $('#lightBox1to1 img').hide(1000);
            clearInterval(chatHTML5.myUser.calling1to1Interval);
            chatHTML5.myUser.status = 'busy';
            chatHTML5.changeMyStatus();
        });

        this.socket.on('voteContest', function(userid, username, alreadyVoted) {
            console.log('voteContest', userid, username);
            if (alreadyVoted) {
                bootbox.alert(chatHTML5.traductions["already Voted"]);
                return;
            }
            if (userid == chatHTML5.myUser.id) {
                new PNotify({
                    delay:4000,
                    title: chatHTML5.traductions.vote,
                    text: sprintf(chatHTML5.traductions["Thanks for voting"], username),
                    type: 'success',
                    styling: 'bootstrap3'
                });
            } else  {
                new PNotify({
                    delay:4000,
                    title: chatHTML5.traductions.vote,
                    text: sprintf(chatHTML5.traductions["User X has voted for you"], username),
                    type: 'success',
                    styling: 'bootstrap3'
                });
            }
        });

        this.socket.on('notification', function(notification) {
            new PNotify({
                delay:4000,
                title: notification.title,
                text: notification.text,
                type: notification.type,
                styling: 'bootstrap3'
            });
        });

        this.socket.on('createRoom', function(room) {
            chatHTML5.socket.emit('getRooms');
        });

        this.socket.on('inviteUserPrivateRoom', function(roomid, user) {
            if (chatHTML5.muted[user.id]) {
                return;
            }
            var room = (chatHTML5.rooms[roomid] || {});
            var texte = sprintf('\
            <div data-roomid="%s">%s</div>\
            <div>\
                <button data-roomid="%s" data-userid="%s" data-username="%s" class="acceptRoomJoinBtn btn btn-success"><i class="fa fa-comment"></i> %s</button>\
                <button data-roomid="%s" data-userid="%s" data-username="%s" class="denyRoomJoinBtn btn btn-warning"><i class="fa fa-times"></i> %s</button>\
                <button data-roomid="%s" data-userid="%s" data-username="%s" class="muteBtn btn btn-danger"><i class="fa fa-microphone-slash"></i> %s</button>\
            </div>',
                roomid, sprintf(chatHTML5.traductions.userWouldLikeToInviteToHisPrivateRoom, removeTags(user.username, room.name)),
                roomid, user.id, removeTags(user.username), chatHTML5.traductions.accept,
                roomid, user.id, removeTags(user.username), chatHTML5.traductions.deny,
                roomid, user.id, removeTags(user.username), chatHTML5.traductions.mute
            );
            chatHTML5.serverInfoMessageThatDiseappears(texte, 'privateRequested inviteUserPrivateRoom');
        });

        this.socket.on('deleteRoom', function(roomid) {
            //console.log('deleteRoom', roomid);
            var room = chatHTML5.rooms[roomid];
            new PNotify({
                delay:4000,
                title: chatHTML5.traductions.roomDeleted,
                text: sprintf(chatHTML5.traductions.roomWasDeleted, room.name),
                type: 'error',
                styling: 'bootstrap3'
            });
            //chatHTML5.socket.emit('userLeaveRoom', room.id);
            tabs.closeById('room_' + room.id);
            // ferme t on l'unique room ?
            if (!chatHTML5.getTabs().find('li').length) {
                var roomid = Object.keys(chatHTML5.rooms)[0];
                chatHTML5.changeRoom(roomid);
            }
            chatHTML5.socket.emit('getRooms');

        });

        this.socket.on('deleteFriend', function(user) {
            new PNotify({
                delay:4000,
                title: chatHTML5.traductions.UserDeleted,
                text: sprintf(chatHTML5.traductions.UserIsNotYourFriendAnyMore, removeTags(user.username)),
                type: 'error'
            });
            chatHTML5.getMyFriends();
        });

        this.socket.on('acceptFriend', function(user) {
            new PNotify({
                delay:4000,
                title: chatHTML5.traductions.UserAccepted,
                text: sprintf(chatHTML5.traductions.YouAreNowFriendWith, removeTags(user.username)),
                type: 'success'
            });
            chatHTML5.getMyFriends();
        });

        this.socket.on('refuseFriend', function(user) {
            new PNotify({
                delay:4000,
                title: chatHTML5.traductions.UserRefused,
                text: sprintf(chatHTML5.traductions.UserRefusedToBeYourFriend, removeTags(user.username)),
                type: 'error',
                styling: 'bootstrap3'
            });
            chatHTML5.getMyFriends();
        });

        this.socket.on('refresh', function(question) {
            chatHTML5.redirectUrl();
        });
        this.socket.on('gotIP', function(IP) {
            bootbox.prompt({
                size: 'small',
                title: 'IP address',
                value:IP,
                callback: function(result){
                    /* result = String containing user input if OK clicked or null if Cancel clicked */
                }
            });

        });
        this.socket.on('changeUsername', function(newUsername) {
            chatHTML5.myUser.username = newUsername;
        });

        this.socket.on('removeFriend', function(friendid) {
            //console.log('REMOVED form friends', friendid);
        });

        this.getRoomById = function(roomid, rooms) {
            var res = false;
            for (var index in rooms) {
                var room = rooms[index];
                if (room.id == roomid) {
                    return room;
                }
            }
            return res;
        };
        this.socket.on('connect_error', function(err) {
            var message = `Error connection ${err.message}`;
            chatHTML5.serverMessage(message, 'question');
        });

        this.socket.on('connected', function() {
            chatHTML5.predictiveReadingUsers = [];
            chatHTML5.myUser.friends = {};
            if (chatHTML5.config.chatType==='conference' ) {
                $.post(chatHTML5.config.ajax, {a:'getMainRoom', webmasterid:chatHTML5.myUser.webmasterid}, function (room) {
                    room = JSON.parse(room);
                    if (!chatHTML5.myUser.startRoom) {
                    }
                    room.id = chatHTML5.myUser.startRoom;

                    chatHTML5.myUser.room = room;
                    chatHTML5.socket.emit('enterRoom', chatHTML5.myUser);
                    if (chatHTML5.config.friendsManagment == '1') {
                        chatHTML5.getMyFriends();
                    }
                });
                return;
            }
            if (chatHTML5.config.displayRoomsChoiceWhenEnterChat=='1') {
                chatHTML5.config.displayRoomsChoiceWhenEnterChat = 0;

                if (chatHTML5.isMobile() && $('#slide_block').hasClass('opened')) {
                    $('#slide_block').click();
                }
                $('#roomsModal').modal('show');
                //console.log('chatHTML5.socket.connected', chatHTML5.socket.connected);
                chatHTML5.socket.emit('getRooms');
                /*chatHTML5.fillRooms(function(rooms) {
                    $('#roomsModal').modal('show');
                });*/

            }
            // dynamic rooms by roomName
            chatHTML5.restoreState();
            if (parseInt(chatHTML5.myUser.startRoom)) {
                $.post(chatHTML5.config.ajax, {a:'getRooms', webmasterid:chatHTML5.myUser.webmasterid}, function (rooms) {
                    rooms = JSON.parse(rooms);
                    chatHTML5.myUser.room = chatHTML5.getRoomById(chatHTML5.myUser.startRoom, rooms);
                    if (chatHTML5.myUser.room.image) {
                        chatHTML5.myUser.room.image = `/upload/rooms/${chatHTML5.myUser.room.image}`;
                    }
                    if (!chatHTML5.myUser.room) {
                        // pickup lobby room

                        chatHTML5.myUser.room = rooms[0];
                        //bootbox.alert('ERROR: Bad Start Room');return;
                    }
                    if (chatHTML5.config.friendsManagment == '1') {
                        chatHTML5.getMyFriends();
                    }
                    chatHTML5.socket.emit('enterRoom', chatHTML5.myUser);

                });
            } else {
                if (chatHTML5.config.friendsManagment == '1') {
                    chatHTML5.getMyFriends();
                }
                if (chatHTML5.config.enterFirstRoomIfChoiceAuto=='1') {
                    chatHTML5.socket.emit('enterRoom', chatHTML5.myUser);
                }
            }

        });

        this.socket.on('deleteUserMessages', function(username) {
            var temp = sprintf("div.message div.userItem[data-username='%s']", removeTags(username));
            $(temp).parent().parent().parent().remove();
            var MaxChats = (chatHTML5.config.displayPastChatHistoryNumber || 4);
            chatHTML5.getLastChats(MaxChats, chatHTML5.myUser.room.id);
            chatHTML5.scrollActiveChatToBottom(100);
        });

        $('div#usersContainer a[data-toggle="tab"]' ).on( 'shown.bs.tab', function(event) {
            var activeTab = $(event.target).data('role');
            var oldTab = $(event.relatedTarget).data('role');
            //console.log(activeTab, oldTab);

            if (activeTab=='rooms') {
                chatHTML5.socket.emit('getRooms');
            }
            if (activeTab=='friends') {
                chatHTML5.getMyFriends();
            }
        });

        this.getMyFavouritRooms = function() {
            var rooms = new Array();;
            return new Promise(function(resolve, reject) {
                if (chatHTML5.myUser.role=='guest') {
                    resolve(rooms);
                }
                if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canAddRoomToFavori=='0') {
                    resolve(rooms);
                }
                if (chatHTML5.myUser.myFavouriteRooms.length) {
                    resolve(chatHTML5.myUser.myFavouriteRooms);
                }
                $.post(chatHTML5.config.ajax, {a: 'getMyFavoris', webmasterid:chatHTML5.myUser.webmasterid, userid: chatHTML5.myUser.id }, function (res) {
                    res = JSON.parse(res);
                    for(var index in res) {
                        rooms.push(parseInt(res[index].roomid));
                    }
                    resolve (rooms);
                });
            });
        }

        this.addRoomToFavorite = function(roomid, value) {
            $.post(chatHTML5.config.ajax, {a: 'addRoomToFavorite', roomid:roomid, userid:chatHTML5.myUser.id, webmasterid:chatHTML5.myUser.webmasterid, value:value}, function (res) {
                chatHTML5.redrawRooms(chatHTML5.rooms);
            });
        }

        $(document).on('click', '#roomsContainer2 td i.favoriteStar, #roomContainer td i.favoriteStar', function() {
            var roomid = $(this).parent().parent().find('button').data('id');
            if ($(this).hasClass('fa-star')) {
                $(this).removeClass('fa-star').addClass('fa-star-o');
                chatHTML5.myUser.myFavouriteRooms.splice( chatHTML5.myUser.myFavouriteRooms.indexOf(roomid), 1 );
                chatHTML5.addRoomToFavorite(roomid, false);
            } else {
                $(this).removeClass('fa-star-o').addClass('fa-star');
                chatHTML5.myUser.myFavouriteRooms.push(roomid);
                chatHTML5.addRoomToFavorite(roomid, true);
            }
            console.log('chatHTML5.myUser.myFavouriteRooms', chatHTML5.myUser.myFavouriteRooms);
        })


        this.socket.on('gotRooms', function(rooms) {
            chatHTML5.myUser.myFavouriteRooms = new Array();
            chatHTML5.getMyFavouritRooms().then(function(myFavouriteRooms) {
                chatHTML5.myUser.myFavouriteRooms = myFavouriteRooms;
                // any invisible user in rooms ?
                for (var i=0;i<rooms.length;i++) {
                    if (rooms[i].id == chatHTML5.myUser.room.id) {
                        //debugger;
                        rooms[i].users = rooms[i].users - chatHTML5.getNumberInvisibleUsersInCurrentRoom();

                    }
                }
                chatHTML5.redrawRooms(rooms);
            }, function(err) {
                console.log(err); // Error: "It broke"
            });


        });
        this.getNumberInvisibleUsersInCurrentRoom = function() {
            try {
                var count = 0;
                var keys = Object.keys(chatHTML5.users);
                for (var i = 0; i < keys.length; i++) {
                    if (chatHTML5.users[keys[i]].invisible) {
                        count++;
                    }
                }
            } catch(e) {
                count = 0;
            }
            return count;//(Object.keys(chatHTML5.users).length - $('#userList div[data-username]').length);
        }

        this.reportRoom = function(roomNameProblem, email, description, reportReason) {
            bootbox.confirm(chatHTML5.traductions.confirm, function(res){
                if (!res) {
                    return;
                }
                $.post(chatHTML5.config.ajax, {a:'reportRoom', roomNameProblem:roomNameProblem, usernameAuthor:chatHTML5.myUser.username,  email:email, description: description, reportReason:reportReason}, function(res) {
                    console.log('res', res);
                    bootbox.alert(chatHTML5.traductions['Report Send to Admin']);
                    $('#reportRoomDescription').val('');
                    $('#reportRoomEmail').val('')
                });
            })
        };

        $('#reportRoomBtn').click(function(e) {
            var email = $('#reportRoomEmail').val();
            var description = $('#reportRoomDescription').val();
            if (description.length<5 || !validateEmail(email))  {
                return false;
            }
            var reportRoomReason = $('#reportRoomReason').val();
            chatHTML5.reportRoom(chatHTML5.roomNameProblem, email, description, reportRoomReason);
        });

        $(document).on('click', 'td i.reportRoomBtn', function(e) {
            chatHTML5.roomNameProblem = $(this).data('name');
            $('#reportRoomModal').modal('show');
        })

        this.redrawRooms = function(rooms) {
            chatHTML5.rooms = {};
            $('#tableRoomBody').empty();
            $('#tableRoomBody2').empty();
            var passwordProtected;
            var trClass;
            var year = (new Date()).getFullYear();
            var myAge = (year) - (chatHTML5.myUser.birthyear || year);
            for(var index in rooms) {
                var room = rooms[index];
                if (room.isAdult=='1' && (chatHTML5.myUser.showAdultrooms=='0' || (chatHTML5.config.adultRoomAction=='hideForMinors' && myAge<18))) {
                    continue;
                }
                chatHTML5.rooms[room.id] = room;
                var isInFavorit = false;
                var favoriteDiv = '';
                if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canAddRoomToFavori=='1') {
                    if(chatHTML5.myUser.myFavouriteRooms.indexOf(parseInt(room.id))!=-1) {
                        isInFavorit = true;
                        favoriteDiv = '<i class="favoriteStar fa fa-star"></i>';
                    }  else {
                        favoriteDiv = '<i class="favoriteStar fa fa-star-o"></i>';
                    }
                }
                passwordProtected = (room.isPasswordProtected==='1')?passwordProtected = ' <i class="fa fa-unlock-alt"></i> ':passwordProtected = '';
                trClass = (room.id===(chatHTML5.myUser.room || {}).id)?'activeRoom':'';

                var button = sprintf('<button type="button" data-id="%s" class="btn btn-success roomJoinBtn pull-right">%s<i class="fa fa-sign-in"></i> %s</button>',
                    room.id, passwordProtected, chatHTML5.traductions.join);
                if (room.image && room.image.indexOf('//')==-1) {
                    room.image = "/upload/rooms/" + room.image;
                }
                var image = (room.image) ? sprintf('<img src="%s">', room.image): '';
                var reportBtn = ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canReportRoom=='1')
                    ?sprintf('<i data-name="%s" title="Report room" class="reportRoomBtn pull-right fa fa-exclamation-circle"></i>', room.name)
                    :'';
                var description = sprintf("<div class='roomDescription'>%s</div>", room.description);
                var row = sprintf('\
                <tr data-id="%s" data-name="%s" class="%s" data-adult="%s" title="%s">\
                    <td>%s %s %s %s %s</td>\
                    <td>%s</td>\
                    <td>%s</td>\
                </tr>',
                    room.name, room.name, trClass, room.isAdult, room.description,
                    favoriteDiv, image, room.name, reportBtn, description,
                    room.users,
                    button);
                if (isInFavorit) {
                    $('#tableRoomBody').prepend(row);
                    $('#tableRoomBody2').prepend(row);
                } else {
                    $('#tableRoomBody').append(row);
                    $('#tableRoomBody2').append(row);
                }
            }
            $('span[data-role="roomsOnlineCounter"]').text($("#tableRoomBody2 tr").length);
            chatHTML5.adjustMyRole();
            $('#roomsContainer2 [title]').tooltip({
                placement:'auto',
                html:true,
                container: 'body'
            });
        }

        this.socket.on('broadcast', function(value, user) {
            if (value) {
                chatHTML5.addWebcam(user.id, removeTags(user.username), true);
            } else {
                chatHTML5.removeWebcam(user.id);
                var temp = sprintf('#userList div[data-id=%s] div.broadcast', user.id);
                $(temp).removeClass('broadcastUser');

            }
        });

        this.socket.on('quiz', function(question) {
            $('div.question').remove();
            $('#youtubeQuiz').empty();
            if (question.question.indexOf('youtube.com/watch')>0) {
                var message = sprintf('<i class="fa fa-question-circle"></i> %s <p><i>%s</i>: %s</p>', chatHTML5.traductions.whoSings, chatHTML5.traductions.Clue, question.answer);
                chatHTML5.serverMessage(message, 'question');
                question.question = question.question.replaceAll('<p>','').replaceAll('</p>', '');
                chatHTML5.playYoutubeByURL(question.question);

                return;
            }
            var message = sprintf('<i class="fa fa-question-circle"></i> %s <p><i>%s</i>: %s</p>', question.question, chatHTML5.traductions.Clue, question.answer);
            chatHTML5.serverMessage(message, 'question');
        });

        this.playYoutubeByURL = function(url) {
            var videoid = url.split("v=")[1].substring(0, 11);
            //console.log(videoid);
            if (!$('#soundCheckBox').prop('checked')) {
                return;
            }
            try {
                //chatHTML5.playYoutube(videoid);
                //playerQuizYoutube.cueVideoById(videoid);
                //playerQuizYoutube.playVideo();
                chatHTML5.playYoutubeQuiz(videoid);
            } catch(e) {

            }
        }

        this.socket.on('quizBadAnswer', function() {
            return;
            var message = sprintf(chatHTML5.traductions.quizBadAnswer);
            chatHTML5.serverMessage(message, 'quizBadAnswer');
        });

        this.amIMuted = function() {
            return chatHTML5.myUser.mutedUntil>Date.now();
        };

        this.socket.on('quizGoodAnwser', function(user, answer) {
            var rnd = 1 + Math.floor(Math.random()*5);
            var goodMessage = chatHTML5.traductions['quizGoodAnswer' + rnd];
            var message = sprintf(goodMessage, removeTags(user.username), answer);
            chatHTML5.serverMessage(message, 'quizGoodAnswer animated slideInUp');
            chatHTML5.incrementPointsQuiz(user.id);
        });

        this.socket.on('reconnect', () => {
            console.log('reconnect...');
            if (chatHTML5.config.reconnect=='0') {
                return;
            }
            var currentRoomid = parseInt(chatHTML5.myUser.room.id);
            (chatHTML5.myUser.roomsIn || []).forEach(function(roomid) {
                if (roomid!=currentRoomid) {
                    chatHTML5.myUser.room = chatHTML5.rooms[roomid];
                    setTimeout(function() {
                        chatHTML5.socket.emit('renterRoom', roomid);
                    }, 200)

                }
            })
            chatHTML5.myUser.room = chatHTML5.rooms[currentRoomid];
            chatHTML5.socket.emit('enterRoom', chatHTML5.myUser);
        })

        this.socket.on('connect', function() {
            chatHTML5.users = {};
            if (!chatHTML5.myUser.image) {
                chatHTML5.myUser.image = chatHTML5.pickupRandomAvatar();
            }
            chatHTML5.myUser.enterChatMode = (chatHTML5.config.enterChatMode>='1');
        });

        this.socket.on('maxUsersReached', function(numberUsersInRoom, maxUsers) {
            bootbox.alert(chatHTML5.traductions["Maxumum number of users in room reached. Pick another room"], function() {
                $('#roomsModal').modal('show');
            });
        });

        this.socket.on('kicked', function(user) {
            debugger;
            if (user.username===chatHTML5.myUser.username) {
                var message = sprintf(chatHTML5.traductions.youHaveBeenKickedByUser, removeTags(user.username));
                chatHTML5.kicked(message);
            } else if((chatHTML5.roles[chatHTML5.myUser.role] || {}).canSeeKickMessage=='1') {
                var message = sprintf(chatHTML5.traductions.userHasBeenKicked, removeTags(user.username));
                chatHTML5.serverMessage(message, 'serverMessageKick');
            }
        });

        this.socket.on('kickedFromRoom', function(user, roomid) {
            if (user.username===chatHTML5.myUser.username) {
                var message = sprintf(chatHTML5.traductions.youHaveBeenKickedByUser, removeTags(user.username));
                chatHTML5.kickedFromRoom(message, roomid);
            } else if((chatHTML5.roles[chatHTML5.myUser.role] || {}).canSeeKickMessage=='1') {
                var message = sprintf(chatHTML5.traductions.userHasBeenKicked, removeTags(user.username));
                chatHTML5.serverMessage(message, 'serverMessageKick');
            }
        });

        this.socket.on('banned', function(user, minutes, reason) {
            if (user.username===chatHTML5.myUser.username) {
                localStorage.setItem('banned', true);
                createCookie('banned', true, 1);
                bootbox.alert(sprintf(chatHTML5.traductions.youHaveBeenBannedFromChat, minutes, reason), function () {
                    chatHTML5.redirectUrl(config.bannedUrl);
                });
                setTimeout(function () {
                    chatHTML5.redirectUrl(config.bannedUrl);
                }, 5000)
                chatHTML5.socket.disconnect();
            } else if((chatHTML5.roles[chatHTML5.myUser.role] || {}).canSeeBanMessage=='1') {
                var message = sprintf(chatHTML5.traductions.userHasBeenBanned, removeTags(user.username));
                chatHTML5.serverMessage(message, 'serverMessageBan');
            }
        });

        this.socket.on('muteWebcam', function(userid) {
            chatHTML5.removeWebcam(userid);
        });

        this.socket.on('muted', function(user, minutes, description, warnUserOfMute) {
            var myRole = (chatHTML5.roles[chatHTML5.myUser.role] || {});
            if (user.username===chatHTML5.myUser.username) {
                minutes = parseInt(minutes);
                if (warnUserOfMute) {
                    bootbox.alert(sprintf(traductions.youHaveBeenMutedForMinutes, minutes, description));
                }
                var d = new Date();
                var v = new Date();
                chatHTML5.myUser.mutedUntil = v.setMinutes(d.getMinutes() + minutes);
            } else if(myRole.canSeeMutePrisonMessage=='1') {
                var message = sprintf(chatHTML5.traductions.userHasBeenMutedBanned, removeTags(user.username));
                chatHTML5.serverMessage(message, 'serverMessageMute');
            }
            if (myRole.canMutePrison=='1') {
                $(sprintf('div.userItem[data-id=%s]', user.id)).addClass('muted');
            }
        });


        this.socket.on('disconnectDouble', function() {
            chatHTML5.kicked(chatHTML5.traductions.doubleConnect);
        });

        this.socket.on('togglePushToTalk', function(user) {
            chatHTML5.myUser.pushToTalk = user.pushToTalk;
            chatHTML5.stopTalk();
        });

        this.socket.on('talks', function(user) {
            chatHTML5.talks(user);
        });

        this.socket.on('stopTalks', function(user) {
            chatHTML5.stopTalks(user);
        });

        this.unProtectUser = function() {
            Object.defineProperty(chatHTML5.myUser, 'role', {  writable: true });
        }

        this.protectUser = function() {
            Object.defineProperty(chatHTML5.myUser, 'username', {  writable: false });
            Object.defineProperty(chatHTML5.myUser, 'role', { writable: false });
        }

        this.getRoomsIamIn = function() {
            var res = Array();
            $('#chatContainer ul.nav a[data-room="true"]').each(function(index, el) {
                res.push($(el).data('roomid'));
            })
            return res;
        }

        this.socket.on('getUsers', function(usersInRoom, _roomid) {
            chatHTML5.protectUser();
            chatHTML5.socket.emit('getRooms');
            var privateChatWith = parseInt(chatHTML5.myUser.call1to1);
            if (Object.keys(chatHTML5.users).length && privateChatWith) {
                var user = chatHTML5.users[privateChatWith];
                if (user) {
                    bootbox.confirm(sprintf(chatHTML5.traductions.areYouSureToCall1to1, removeTags(user.username)), function(res) {
                        if (res) {
                            chatHTML5.sendPrivateInvitation(user.id, removeTags(user.username));
                        }
                    })
                }
            }
            chatHTML5.users = {};
            chatHTML5.displayRSSinCurrentRoom();
            $('#userList').empty();
            var playSound = false;
            for (var userid in usersInRoom) {
                var anuser = usersInRoom[userid];
                anuser.invisible = ((chatHTML5.roles[anuser.role] || {}).isVisible=='0');
                if (chatHTML5.amIMinor() && anuser.seenByAdultOnly==1) {
                    anuser.invisible = true;
                }
                if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canSeeInvisibleUsers=='1') {
                    anuser.invisible = false;
                }
                var forceDisplay = true;
                chatHTML5.addUser(anuser, playSound, '#userList', forceDisplay);
            }
            // create room tab
            if (chatHTML5.config.orderUsersOnRoomEnter=='1') {
                chatHTML5.sortUsersAZ();
            }

            var roomid = sprintf('room_%s', chatHTML5.myUser.room.id);
            var roomSrc = (chatHTML5.myUser.room.image)?chatHTML5.myUser.room.image:'/img/home.svg';
            var roomName = sprintf('<img class="home-tab" src="%s"> %s<div class="unread" title="%s"></div>', roomSrc, chatHTML5.myUser.room.name, chatHTML5.traductions.unreadMessages);

            var tab = chatHTML5.getTabById(_roomid);

            if (!tab.length) {
                var closable = (chatHTML5.config.multiRoomEnter=='1');
                tabs.addTab({id: roomid, title: roomName, closable: closable, room:true, roomid:chatHTML5.myUser.room.id, label: chatHTML5.myUser.room.name,
                    istemp:chatHTML5.myUser.room.isTemporary=='1'});
                if (chatHTML5.config.displayPastChatHistory=='1') {
                    var MaxChats = (chatHTML5.config.displayPastChatHistoryNumber || 4);
                    chatHTML5.getLastChats(MaxChats, _roomid);
                }

                $('#' + roomid).perfectScrollbar();
                if (chatHTML5.welcomedRoom!=chatHTML5.myUser.room.id) {
                    chatHTML5.welcome();
                    chatHTML5.welcomedRoom = chatHTML5.myUser.room.id;
                }
            }
            if (localStorage.getItem('background') && !chatHTML5.myUser.gotBackground) {
                var originalSrc = localStorage.getItem('background');
                $('div.tab-pane').css('background-image', originalSrc);
            }
            $('#youtubeDisableCheckbox').prop('checked', localStorage.getItem('youtubeDisable')=='true');
            chatHTML5.myUser.gotBackground = true;
            chatHTML5.myUser.roomsIn = chatHTML5.getRoomsIamIn();
            chatHTML5.scrollActiveChatToBottom(100);
            if (chatHTML5.config.chatType=='conference' && chatHTML5.myUser.role=='user' && chatHTML5.config.conference_UserCanEnterWhenModelOffline == '0' && !chatHTML5.isPerformerOnline()) {
                window.top.location.href = chatHTML5.config.conference_redirectOtherUsersUrlWhenPrivateStarts;
            }
        });

        this.getPerformer = function() {
            var res = {};
            for(var index in chatHTML5.users) {
                var user = chatHTML5.users[index];
                if (user.role=='performer') {
                    return user;
                    break;
                }
            }
            return res;
        }

        $('#purchseCreditsBtn').click(function(e) {
            if (chatHTML5.config.userCanRegister=='1') {
                e.preventDefault();
                $('#ppvPurchaseModal').modal('show');
            }
        });

        $('#askPrivateConferenceBtn').click(function() {
            if (chatHTML5.myUser.isInPrivateShow) {
                chatHTML5.socket.emit('endPrivateShow');
                return;
            }
            if (chatHTML5.myUser.credits<10) {
                bootbox.alert(chatHTML5.traductions.sorryYouDontHaveEnoughCredits, function() {
                    window.location = chatHTML5.config.conferencePrivatePaymentUrl;
                });
                //$('#purchseCreditsBtn').click();
                return;
            }
            var  performer =  chatHTML5.getPerformer();

            var message = sprintf(chatHTML5.traductions.AreYouSureToRequestPrivateChatWithModel, removeTags(performer.username), performer.ppv_pricePerMinute);
            bootbox.confirm(message, function(res) {
                if (!res) {
                    return;
                }
                chatHTML5.socket.emit('requestPrivateShow');
            })
        })

        this.socket.on('playYoutube', function(videoid) {
            chatHTML5.playYoutube(videoid, (chatHTML5.config.userYoutubeLinkDisplayInChat=='1'));
        });

        this.socket.on('promotedRole', function(role) {
            new PNotify({
                delay:4000,
                title: chatHTML5.traductions.promoteUser,
                text: sprintf(chatHTML5.traductions.youHaveBeenPromotedto, role),
                type: 'success',
                styling: 'bootstrap3'
            });
            chatHTML5.unProtectUser();
            chatHTML5.myUser.role = role;
            chatHTML5.protectUser();
            chatHTML5.socket.emit('changeUser', chatHTML5.myUser);
        });


        this.socket.on('userChanged', function (user) {
            chatHTML5.changeUser(user);
        });

        this.getUserByStreamId = function(streamid) {
            var resultat = false;
            $.each(chatHTML5.users, function( id, user ) {
                if (user.streamid==streamid) {
                    resultat =  user;
                }
            });
            return resultat;
            //chatHTML5.users[1557297606610].streamid
            return false;
        }
        this.changeUser = function(user) {
            //console.log('changeUser', user.status);
            if (!user.webcam && chatHTML5.myUser.id!=user.id) {
                chatHTML5.removeWebcam(user.id);
            }
            // did he opened his cam ?

            var oldWebcam = (chatHTML5.users[user.id] || {}).webcam;
            if (chatHTML5.config.notifyWhenUserStartsWebcam=='1' && user.webcam && !oldWebcam) {
                var message = sprintf(chatHTML5.traductions.XhasTurnedOnHisCam,
                    sprintf("<div class=\"userItem\"  title=\"%s\" data-id=\"%s\" data-username=\"%s\">%s </div>", removeTags(user.username), user.id, removeTags(user.username), removeTags(user.username)));
                chatHTML5.serverMessage(message, 'serverText webcamOpened');
            }

            // user change: update his view !
            chatHTML5.users[user.id] = user;
            var userItem = sprintf('#userList div.userItem[data-id=%s]', user.id);
            var $userItem = $(userItem);
            //$userItem.data('status', );
            $userItem.attr('data-status', user.status);
            $userItem.data('webcam', user.hasWebcam);
            $userItem.find("img[alt]").attr('src', user.image);

            //temp = sprintf('.userItem[data-id=%s] div.status', user.id);
            var classStatus = 'online';

            if (user.status==='offline') {
                classStatus = 'offline';
            } else if (user.status==='busy') {
                classStatus = 'busy';
            }
            $userItem.find('div.status').removeClass('online').removeClass('offline').removeClass('busy').addClass(classStatus);

            //temp = sprintf('.userItem[data-id=%s] div.userLabel', user.id);
            $userItem.find('div.userLabel').text(user.username);

            temp = sprintf('.userItem[data-id=%s] .info-icons div.webcamBtn', user.id);
            $temp = $(temp);
            var webcamClass = (user.webcam)?'visible':'hidden';
            if (chatHTML5.myUser.room.webcam=='0') webcamClass = 'hidden';

            $temp.removeClass('online').removeClass('hidden').removeClass('visible').addClass(webcamClass);
            $temp.find('i.fa-2x').remove();
            if(user.audio && !user.video) {
                $temp.prepend('<i class="fa fa-2x fa-volume-down"></i>');
            } else {
                $temp.prepend('<i class="fa fa-2x fa-video-camera"></i>');
            }

            var classLock = (user.webcamPublic)?'fa-unlock':'fa-lock';
            //temp = sprintf('.userItem[data-id=%s] div i.lock', user.id);
            $userItem.find("div i.lock").removeClass('fa-lock').removeClass('fa-unlock').addClass(classLock);

            //temp = sprintf('#userList div.userItem[data-id=%s]', user.id);
            $userItem.removeClass('displayNone');
            if (user.status == 'invisible') {
                $userItem.addClass('displayNone');
            }
            //temp = sprintf('.userItem[data-id=%s] i.raiseHand', user.id);

            if (user.wantsToTalk) {
                $userItem.find('i.raiseHand').show();
            } else {
                $userItem.find('i.raiseHand').hide();
            }
            if (chatHTML5.config.chatType==='conference') {
                if (user.role=='user' && user.webcam) {
                    chatHTML5.serverMessage(sprintf(chatHTML5.traductions.UserOpenHisWebcam, removeTags(user.username)), 'privateClosed');
                }
            }
            // role update
            chatHTML5.adjustUserRoleImage(user.id, user.role);
        }


        $(document).on('click', '.fa-eye-slash.fa-2x', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            var id = $(this).closest('.userItem').data('id');
            //console.log('allowWatch', id);
            chatHTML5.socket.emit('allowWatch', id);
            $(this).addClass('fa-eye').removeClass('fa-eye-slash').removeClass('isWatching')
        })

        $(document).on('click', 'button.createRoomBtn', function(e) {
            $('#roomCreateModal').modal('show');
            $('#roomNewNameInput').val('');
            $('#roomNewPassword').val('');
        });

        $(document).on('click', '.fa-eye.fa-2x', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            var id = $(this).closest('.userItem').data('id');
            var user = chatHTML5.users[id] || {};
            if ((chatHTML5.roles[user.role] || {}).canOpenAnyWebcam=='1') {
                return;
            }
            //console.log('forbidWatch', id);
            chatHTML5.socket.emit('forbidWatch', id);
            $(this).removeClass('fa-eye').addClass('fa-eye-slash').removeClass('isWatching')
        })

        this.socket.on('closeCams', function(user1id, user2id) {
            if (chatHTML5.myUser.id!=user1id &&chatHTML5.myUser.id!=user2id) {
                chatHTML5.removeWebcam(user1id);
                chatHTML5.removeWebcam(user2id);
            }
        })

        this.socket.on('watched', function(user, value) {
            var temp = sprintf("div.userItem[data-id=%s] i.fa-eye, div.userItem[data-id=%s] i.fa-eye-slash", user.id, user.id);
            //console.log(temp);
            if (value) {
                $(temp).removeClass('fa-eye-slash').removeClass('fa-eye').addClass('fa-eye')
                $(temp).addClass('isWatching');
            } else {
                //$(temp).removeClass('fa-eye-slash').removeClass('fa-eye').addClass('fa-eye')
                $(temp).removeClass('isWatching');
            }
            //console.log('watched');
            if (chatHTML5.config.webrtcServer=='janus' && !chatHTML5.myUser.janusPublished && chatHTML5.config.streamIfWatched=='1') {
                var publish = {request: 'configure', audio: true, video: true};
                sfu.send({message: publish, jsep: chatHTML5.myUser.jsep});
                chatHTML5.myUser.janusPublished = true;
            }
            chatHTML5.updateWatchingAtMeTotal();
        });

        this.socket.on('webcamAccepted', function(user) {
            chatHTML5.serverMessage(sprintf(chatHTML5.traductions.youAreNowWatchingUser, removeTags(user.username)), 'webcamRequested', user.id);
            chatHTML5.addWebcam(user.id, removeTags(user.username));
        });

        this.socket.on('privateClosed', function(user) {
            if (chatHTML5.config.closePrivateTabIfOtrherPartyClosesTab=='1') {
                tabs.closeById(user.id);
                chatHTML5.getPanelById(user.id).remove();

            } else {

            }
            chatHTML5.serverMessage(sprintf(chatHTML5.traductions.userHasClosedPrivateChat, removeTags(user.username)), 'privateClosed');
        });


        this.socket.on('conferenceStarted', function(user1id, user2id) {
            if (chatHTML5.myUser.id!=user1id && chatHTML5.myUser.id!=user2id) {
                bootbox.alert(chatHTML5.traductions["Private chat has Started Please Leave"]);
                setTimeout(function() {
                    window.location = chatHTML5.config.conference_redirectOtherUsersUrlWhenPrivateStarts;
                }, 3000)
            } else {
                chatHTML5.serverMessage(texte, 'privateStarted');
            }
        });

        this.socket.on('privateAccepted', function(user, selectTab) {
            if (chatHTML5.config.chatType==='roulette') {
                chatHTML5.addOrSelectPrivateChat(user, true);
                return;
            }
            if (chatHTML5.config.chatType!=='conference') {
                chatHTML5.addOrSelectPrivateChat(user, selectTab);
            }
        });

        this.socket.on('refresh', function() {
            chatHTML5.redirectUrl();
        });

        this.socket.on('requestFriend', function(user) {
            if (chatHTML5.muted[user.id]) {
                return;
            }
            var message = sprintf('\
			<i class="fa fa-handshake-o"></i> <b>%s</b> :  %s\
			<div>\
				<button data-id="%s" data-username="%s" class="acceptFriendBtn btn btn-success" >\
					<i class="fa fa-plus-circle"></i> %s\
				</button>\
				<button data-id="%s" data-username="%s" class="refuseFriendBtn btn btn-warning" >\
					<i class="fa fa-times"></i> %s\
				</button>\
				<button data-id="%s" data-username="%s" class=" muteBtn btn btn-danger" >\
					<i class="fa fa-microphone-slash"></i> %s\
				</button>\
			</div>',
            removeTags(user.username), chatHTML5.traductions.FriendRequested,
                user.id, removeTags(user.username),
                chatHTML5.traductions.accept,
                user.id, removeTags(user.username),
                chatHTML5.traductions.deny,
                user.id, removeTags(user.username),
                chatHTML5.traductions.mute);
            chatHTML5.serverMessage(message, 'privateRequested friendRequested');
            chatHTML5.playMP3(chatHTML5.config.soundPrivateRequested);
        });

        this.socket.on('requestPrivateShow', function(user) {
            if (chatHTML5.muted[user.id]) {
                return;
            }
            var message = sprintf(chatHTML5.traductions.doYouAcceptPrivateShow, removeTags(user.username));
            bootbox.confirm(message, function(res) {
                if (res) {
                    chatHTML5.socket.emit('startPrivateShow', user);
                } else {
                    chatHTML5.socket.emit('privateShowRefused', user.id);
                }
            })
        });
        this.socket.on('privateShowRefused', function() {
            bootbox.alert(chatHTML5.traductions.privateShowRefused);
        });

        this.socket.on('startPrivateShow', function(performerid, userid) {
            if (chatHTML5.myUser.id!=performerid && chatHTML5.myUser.id!=userid) {
                $('#fullMainContainer').remove();
                window.location = chatHTML5.config.conference_listingUrl;
                return;
            } else {
                chatHTML5.myUser.status = 'busy';
                chatHTML5.changeMyStatus();
                chatHTML5.myUser.isInPrivateShow = true;
                chatHTML5.serverMessage(chatHTML5.traductions.privateShowStarted, 'privateRequested animated flash');
                $('#askPrivateConferenceBtn').text(chatHTML5.traductions.endPrivateShow);
                if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).conference_canUsersShowWebcamInPrivate=='1') {
                    $('#webcamBtn').parent().parent().removeClass('hidden');
                }

            }
        });
        this.socket.on('endPrivateShow', function() {
            chatHTML5.endPrivateShow();
        });
        this.socket.on('inviteWatchCam', function(user) {
            if (chatHTML5.muted[user.id]) {
                return;
            }
            if ($('#acceptPrivateCheckBox').prop('checked')===false) {
                return;
            }
            var invitationMessage = sprintf(chatHTML5.traductions.userInvitedToWatchHisCam, removeTags(user.username));
            var message = sprintf('\
                    <i class="fa fa-comment"></i> %s \
                    <div>\
                        <button data-id="%s" data-username="%s" class="acceptWatchHisWebcam btn btn-success" >\
                            <i class="fa fa-comment"></i> %s\
                        </button>\
                        <button data-id="%s" data-username="%s" class="denyWatchHisWebcamBtn btn btn-warning" >\
                            <i class="fa fa-times"></i> %s\
                        </button>\
                        <button data-id="%s" data-username="%s" class="muteBtn btn btn-danger" >\
                            <i class="fa fa-microphone-slash"></i> %s\
                        </button>\
                    </div>',
                invitationMessage,
                user.id, removeTags(user.username),
                chatHTML5.traductions.accept,
                user.id, removeTags(user.username),
                chatHTML5.traductions.deny,
                user.id, removeTags(user.username),
                chatHTML5.traductions.mute
            );
            chatHTML5.serverMessage(message, 'privateRequested');
            chatHTML5.playMP3(chatHTML5.config.soundPrivateRequested);
        })

        this.socket.on('privateRequested', function(user) {
            if (chatHTML5.muted[user.id]) {
                return;
            }
            if (chatHTML5.config.chatType==='roulette') {
                chatHTML5.socket.emit('privateAccepted', user.id, chatHTML5.config.chatType);
                return;
            }

            if ($('#acceptPrivateCheckBox').prop('checked')===false) {
                return;
            }
            if (chatHTML5.config.privateOnlyOnInvitation=='1') {
                var message = sprintf('\
                    <i class="fa fa-comment"></i> %s %s.\
                    <div>\
                        <button data-id="%s" data-username="%s" class="acceptPrivateBtn btn btn-success" >\
                            <i class="fa fa-comment"></i> %s\
                        </button>\
                        <button data-id="%s" data-username="%s" class="denyBtn btn btn-warning" >\
                            <i class="fa fa-times"></i> %s\
                        </button>\
                        <button data-id="%s" data-username="%s" class="muteBtn btn btn-danger" >\
                            <i class="fa fa-microphone-slash"></i> %s\
                        </button>\
                    </div>',
                    removeTags(user.username), chatHTML5.traductions.requestAPrivateChat,
                    user.id, removeTags(user.username),
                    chatHTML5.traductions.accept,
                    user.id, removeTags(user.username),
                    chatHTML5.traductions.deny,
                    user.id, removeTags(user.username),
                    chatHTML5.traductions.mute
                );
                chatHTML5.serverMessage(message, 'privateRequested');
                chatHTML5.playMP3(chatHTML5.config.soundPrivateRequested);
            } else {
                chatHTML5.socket.emit('privateAccepted', user.id, chatHTML5.config.chatType);
            }
        });


        this.socket.on('webcamRequested', function(user) {
            if ($('#acceptPrivateCheckBox').prop('checked')===false) {
                return;
            }
            if (chatHTML5.muted[user.id]) {
                return;
            }
            var message = sprintf('\
			<i class="fa fa-video-camera"></i> %s %s.\
			<div>\
				<button data-id="%s" data-username="%s" class="acceptBtn btn btn-success" >\
					<i class="fa fa-check"></i> %s\
				</button>\
				<button data-id="%s" data-username="%s" class=" denyBtn btn btn-warning" >\
					<i class="fa fa-times"></i> %s\
				</button>\
				<button data-id="%s" data-username="%s" class=" muteBtn btn btn-danger" >\
					<i class="fa fa-microphone-slash"></i> %s\
				</button>\
			</div>',
            removeTags(user.username), chatHTML5.traductions.requestsAVideoChat,
                user.id, removeTags(user.username),
                chatHTML5.traductions.accept,
                user.id, removeTags(user.username),
                chatHTML5.traductions.deny,
                user.id, removeTags(user.username),
                chatHTML5.traductions.mute);
            chatHTML5.serverMessage(message, 'webcamRequested', user.id);
        });

        this.socket.on('receiveText', function (user, message, extras) {
            if (chatHTML5.interval) {
                clearInterval(chatHTML5.interval);
            }
            chatHTML5.receiveText(user, message, extras);
            if (chatHTML5.predictiveReadingUsers && (chatHTML5.roles[chatHTML5.myUser.role] || {}).predictiveReading =='1') {
                chatHTML5.removePredictiveBubble(user.id);
            }
        });

        this.socket.on('whisper', function (user, message, extras) {
            chatHTML5.receiveText(user, message, extras);
        });

        this.socket.on('privateDenied', function(user) {
            chatHTML5.serverMessage(sprintf(chatHTML5.traductions.userDeniedPrivateChat, removeTags(user.username)), 'webcamRequested', user.id);
        });
        this.socket.on('watchHisWebcamDenied', function(user) {
            chatHTML5.serverMessage(sprintf(chatHTML5.traductions.userDeniedWatchCam, removeTags(user.username)), 'webcamRequested', user.id);
        });
        this.socket.on('allowWatch', function(user) {
            //console.log('allowWatch');
            delete (chatHTML5.forbiddenToWatchMe[user.id]);
            chatHTML5.allowedToWatchMe[user.id] = user;
            // fa-lock : change

            var temp = sprintf('#userList div[data-id=%s] div.webcamBtn i.lock', user.id);
            $(temp).removeClass('fa-lock').addClass('fa-unlock')

        });

        this.socket.on('forbidWatch', function(user) {
            //console.log('forbidWatch');
            chatHTML5.removeWebcam(user.id);
            chatHTML5.forbiddenToWatchMe[user.id] = user;
            delete (chatHTML5.allowedToWatchMe[user.id]);

            // fa-lock : change
            //var temp = sprintf('#userList div[data-id=1519809131281] div.webcamBtn i.lock', user.id);
            //$(temp).addClass('fa-lock').removeClass('fa-unlock')

        });

        this.socket.on('writes', function (userid, text) {
            var temp = sprintf('div.userItem[data-id="%s"] .keyboard', userid);
            $(temp).fadeTo(1000, 1);
            //$(temp).css('opacity', 1);
            setTimeout(function() {
                //$(temp).css('opacity', 0);
                $(temp).fadeTo(1000, 0);
            },3000);
            if (chatHTML5.predictiveReadingUsers && chatHTML5.roles[chatHTML5.myUser.role].predictiveReading =='1') {
                chatHTML5.displayPredictiveBubble(userid, text)
            }

        });
        this.displayPredictiveBubble = function(userid, text) {
            var $userlistEl = $(`#usersContainer #userList div[data-id=${userid}]`);
            var $bubbleEl = $userlistEl.find('div.speech-bubble');
            if ($bubbleEl.length) {
                $bubbleEl.css('opacity', 1).text(text);
                setTimeout(function() {
                    $bubbleEl.remove();
                }, 5000)
            } else {
                var el = `<div class="speech-bubble blink2">${text}</div>`;
                $userlistEl.append(el);
            }
        }

        this.removePredictiveBubble = function(userid) {
            $userlistEl = $(`#userList div[data-id=${userid}] div.speech-bubble`).remove();
        }


        this.sendPrivateInvitation = function(id, username) {
            if (!chatHTML5.checkMinorAllowed(id)) {
                return;
            }
            if (!chatHTML5.checkAllowed('canAskPrivate') || chatHTML5.amIMuted()) {
                return;
            }
            if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canAskPrivate=='0') {
                return;
            }

            // check if not send already : antiflood
            if (chatHTML5.users[id]) {
                setTimeout(function(id) {
                    delete chatHTML5.askedPrivate[id];
                }, 10000, id);
                if (chatHTML5.askedPrivate[id]) {
                    bootbox.alert(chatHTML5.traductions.youAlreadyAskedForPrivate);
                    return;
                }

                chatHTML5.serverMessage(sprintf('<i class="fa fa-comment"></i> %s %s ', chatHTML5.traductions.youRequestedAPrivateChatWith, username), 'privateRequest');
                chatHTML5.socket.emit('privateRequest', id);
                chatHTML5.askedPrivate[id] = id;
            } else {
                var user = chatHTML5.users[id];
                chatHTML5.addOrSelectPrivateChat(user, true);
            }
        }

        $(document).on('click', '.userLink', function() {
            var id = $(this).data('id');
            var username = $(this).data('username');
            chatHTML5.askPrivateInvitation(id, removeTags(username));
        });


        this.hideKeyboard = function() {
            if (this.isIOS()) {
                //document.activeElement.blur();
                //$("input").blur();
                return;
            }
            //this set timeout needed for case when hideKeyborad
            //is called inside of 'onfocus' event handler
            setTimeout(function() {
                //creating temp field
                var field = document.createElement('input');
                field.setAttribute('type', 'text');
                //hiding temp field from peoples eyes
                //-webkit-user-modify is nessesary for Android 4.x
                field.setAttribute('style', 'position:absolute; top: 0px; opacity: 0; -webkit-user-modify: read-write-plaintext-only; left:0px;');
                document.body.appendChild(field);
                //adding onfocus event handler for out temp field
                field.onfocus = function(){
                    //this timeout of 200ms is nessasary for Android 2.3.x
                    setTimeout(function() {

                        field.setAttribute('style', 'display:none;');
                        setTimeout(function() {
                            document.body.removeChild(field);
                            document.body.focus();
                        }, 14);

                    }, 200);
                };
                //focusing it
                field.focus();
            }, 50);
        }

        $('#sendTipBtn').click(function() {
            $('#tipsModal').modal('show');
        })

        this.sendCredits = function(credits) {
            if (chatHTML5.myUser.credits<credits) {
                bootbox.alert(chatHTML5.traductions.sorryYouDontHaveEnoughCredits);
                return;
            }
            chatHTML5.socket.emit('sendCredits', credits, function(res) {
                if (res=='ko') {
                    bootbox.alert(chatHTML5.traductions.sorryYouDontHaveEnoughCredits);
                    return;
                }
            });
        }

        this.receivePrivate = function(user, message, extras) {
            var extras = extras ||{};
            if (!user || !user.id || this.muted[user.id]) {
                return;
            }
            if (localStorage.getItem('soundConfig')!=='false') {
                chatHTML5.playMP3(chatHTML5.config.receiveMP3);
            }
            chatHTML5.addPrivateChat(user.id, removeTags(user.username));
            message = message.replace(/(?:\r\n|\r|\n)/g, '<br />');
            message = chatHTML5.parseSmileys(message);
            //message = message.linkify();
            var date = new Date().toLocaleTimeString();
            var $chat;
            var templateMessage;
            chatHTML5.playMP3(chatHTML5.config.soundPrivateMessageReceived);
            if (chatHTML5.config.chatType==='window') {
                var classe = (user.receiver)?'bubbleReceive':'bubbleSend';
                var classe2 = (user.receiver)?'receive':'sent';
                templateMessage = sprintf('\
			    <div class="messageWindowPrivate %s">\
                    <span class="timeStamp" data-date="%s">%s</span>\
					<div class="%s">%s</div>\
				</div>',
                    classe2, extras.date, chatHTML5.getDateAgo(extras.date),
                    classe, message);

                var $panel = chatHTML5.getPanelById(user.id)

                $chat = $panel.find('.windowChat');
                if ($panel.data('status')=='minimized') {
                    $('#_window_'+user.id+'-min').addClass('blink');
                }
                if ($("#lockScrollBtn i:eq(1)").css('display') == 'none') {
                    $chat.animate({scrollTop: $chat[0].scrollHeight}, 200);
                }
                $(templateMessage).hide().appendTo($chat).fadeIn(500);
            }

            var boldClasse = (extras.bold===true || extras.bold==='true')?'boldClasse':'';
            var italicClasse = (extras.italic===true || extras.italic==='true')?'italicClasse':'';
            var underlineClasse = (extras.underline===true || extras.underline==='true')?'underlineClasse':'';

            if (chatHTML5.config.chatType==='tab' || chatHTML5.config.chatType==='tabAndWindow' || chatHTML5.config.chatType==='conference' || chatHTML5.config.chatType==='roulette') {
                templateMessage = sprintf('\
                <div class="message flex-property msg-box">\
                    <img src="%s" alt="%s" class="userItem" >\
                        <div class="flex-property message-info">\
                          <div class="flex-property flex-center name-time">\
                            <div class="userLink" title="%s %s" data-id="%s" data-username="%s">%s</div>\
                            <div class="timeStamp" data-date="%s">%s</div>\
                          </div>\
                          <div class="content %s %s %s" style="color:%s">\
                            <div class="arrow-chat"></div>\
                            %s</div>\
                        </div>\
                    </div>\
                ', user.image, removeTags(user.username),
                    chatHTML5.traductions.privateWith, removeTags(user.username), user.id, removeTags(user.username), removeTags(user.username),
                    extras.date, chatHTML5.getDateAgo(extras.date),
                    boldClasse, italicClasse, underlineClasse, extras.color,
                    message);

                $chat = chatHTML5.$getChat(user.id);
                var temp = sprintf("a[data-id='%s'] div.unread", user.id);
                if (chatHTML5.getCurrentTab().id===user.id) {
                    $(temp).empty();
                } else {
                    var value = $(temp).text();
                    (value=='')?value = 1:value = (parseInt(value)+1);
                    $(temp).text(value);
                    console.log('2834', value);
                }
                if (!$chat) {
                    return;
                }

                $(templateMessage).hide().appendTo($chat).fadeIn(500);
                if ($("#lockScrollBtn i:eq(1)").css('display') == 'none') {
                    $chat.animate({scrollTop: $chat[0].scrollHeight}, 200);
                    chatHTML5.scrollActiveChatToBottom();
                }

            }
        };

        this.socket.on('receivePrivate', function (user, message, extras) {
            chatHTML5.receivePrivate(user, message, extras);
        });

        this.socket.on('creditsSent', function (credits, username) {
            var message = sprintf(chatHTML5.traductions.userSentCredits, removeTags(username), credits);
            chatHTML5.serverMessage(message, 'privateRequested animated flash');
        });

        this.socket.on('updateCredits', function (credits, displayInChat, data) {
            console.log('updateCredits', credits);
            chatHTML5.myUser.credits = credits;
            $('[data-role="credits"]').text(credits);
            if (data) {
                if (displayInChat) {
                    var message = sprintf(chatHTML5.traductions.userSentYouTips, removeTags(data.user.username), data.user.credits);
                    chatHTML5.serverMessage(message, 'privateRequested animated flash');
                }
                //update user's credtis
                var temp = sprintf("div.userItem[data-id='%s'] div.creditsUser", data.user.id);
                $(temp).text(data.user.credits);
                //update model's credits

                temp = sprintf("div.userItem[data-id='%s'] div.creditsUser", chatHTML5.myUser.id);
                $(temp).text(chatHTML5.myUser.credits);
            }
            credits = parseInt(credits);
            if (credits<=0) {
                chatHTML5.endPrivateShow();
            }
        });

        this.socket.on('videoChatClosed', function () {
            chatHTML5.closeVideoChat();
        });

        this.socket.on('disconnected', function () {
            $('html').css('opacity', 0.1);
            window.close();
        });

        this.socket.on('error', function (errorMessage) {
            //console.log(errorMessage);
        });

        this.socket.on('addUser', function(user) {
            if ((chatHTML5.roles[user.role] || {}).isVisible=='0') {
                user.invisible = '1'
            } else {
                if (chatHTML5.config.displayEnterChatMessage=='1') {
                    var temp = sprintf(chatHTML5.traductions['XhasJoinedTheChat'], removeTags(user.username));
                    chatHTML5.serverInfoMessageThatDiseappears(temp, 'leave', user.room.id);
                }
            }
            if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canSeeInvisibleUsers=='1') {
                user.invisible = false;
            }

            chatHTML5.addUser(user, true, '#userList');
            if (chatHTML5.config.friendsManagment=='1') {
                chatHTML5.addUser(user, true, '#friendsList');
            }
            chatHTML5.updateFriendsOnlineNumber();
        });

        this.socket.on('removeUser', function(user, disconnects) {
            chatHTML5.removeUser(user, disconnects);
        });
    };

    this.updateFriendsOnlineNumber = function() {
        $('span[data-role="friendsOnlineCounter"]').text($("#friendsList div.userItem").length);
    }


    this.swfReady = function() {
    };

    $('#privateWebcamBtn').change(function(e) {
        chatHTML5.myUser.webcamPublic = false;
        chatHTML5.changeMyStatus();
    });

    $('#publicWebcamBtn').change(function(e) {
        chatHTML5.myUser.webcamPublic = true;
        chatHTML5.changeMyStatus();
    });

    this.getPanelById = function(id) {
        try {
            return $('#' + id.toString());
        } catch(e) {
        }
    };

    this.webrtcAvailable = function(callBackSuccess) {
        var mediaOptions = { audio: true, video: true };
        if (!(navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)) {
            return false;
        }
        navigator.getUserMedia(mediaOptions, success, function(e) {
            return false;
        });
        function success(stream){
            callBackSuccess(stream);
        }
    };

    this.displayMyWebcamKurento = function(value) {
        if (value) {
            chatHTML5.webrtcAvailable(function(stream) {
                $('#myWebcamContainer').show(100);
                var video = $('<video />', {
                    id: serverWebrtc.myStreamName,
                    autoplay:'autoplay',
                    width:'100%',
                    height:(chatHTML5.config.myWebcamDraggable=='1')?'100%':235,
                    type: 'video/mp4',
                    controls: true
                });
                var myWebcamDiv = $('<div />', {
                    id:'myWebcamDiv'
                });
                myWebcamDiv.appendTo($('#myWebcamContainer'));
                video.appendTo(myWebcamDiv);
                serverWebrtc.publishStream(video[0], false);
                if (chatHTML5.config.myWebcamDraggable=='1') {
                    chatHTML5.displayMyWebcamDraggable();
                }
                chatHTML5.cameraStatus(!value);
            })
        } else {
            $('#myWebcamContainer').hide(100);
            $('#myWebcamContainer video').remove();
            serverWebrtc.stopStream(serverWebrtc.myStreamName+'_publisher');
            chatHTML5.myUser.webcam = false;
            chatHTML5.socket.emit('changeUser', chatHTML5.myUser);
            if (chatHTML5.config.myWebcamDraggable=='1') {
                chatHTML5.getPanelById('myWebcamDraggable').remove();
            }
            chatHTML5.cameraStatus(!value);
        }
    };
    $(document).on('errorMediaAccess', function(e) {
        chatHTML5.myUser.streamid = false;
        chatHTML5.myUser.webcam = false;
        chatHTML5.cameraStatus(true);
        $('#webcamBtn').prop('checked', false).change();

    });

    $(document).on('doNotGetMyStreamId', function(e) {
        chatHTML5.myUser.streamid = false;
        chatHTML5.myUser.webcam = false;
        chatHTML5.cameraStatus(true);
        $('#webcamBtn').prop('checked', false).change();
    });

    $(document).on('getMyStreamId', function(e) {
        chatHTML5.myUser.streamid = e.id;
        chatHTML5.myUser.webcam = true;
        chatHTML5.cameraStatus(false);
        if (chatHTML5.config.chatType=='roulette') {
            $('#chatRouletteBtn').prop('disabled', false);
            $('#chatRouletteBtn').click();
        }
        if (((chatHTML5.roles[chatHTML5.myUser.role] || {}).canBroadcast==='1') && ((chatHTML5.roles[chatHTML5.myUser.role] || {}).autoBroadcast==='1')) {
            $('#broadcastCheckBox').bootstrapToggle('off');
        }
        if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).selectUserAndShowWebcam=='1') {
            var selectedUserid = $('#userList div.selectedUser').data('id');
            if (selectedUserid) {
                chatHTML5.socket.emit('webcamAccepted', selectedUserid);
            }
        }
    });

    this.displayMyWebcamLicode = function(value) {
        if (value) {
            var height = (chatHTML5.config.myWebcamDraggable=='1')?'100%':235;
            chatHTML5.webrtcAvailable(function(stream) {
                $('#myWebcamContainer').show(100);
                var el = sprintf('\
                    <div id="video" style="position: absolute;top:0px; height:%s; width:100%%" />\
                    <input id="myAudioCheckBox" type="checkbox" data-onstyle="info" data-style="ios" data-offstyle="default" data-onstyle="default" data-size="mini" checked data-toggle="toggle" data-on="<i class=\'fa fa-volume-up\'></i> On" data-off="<i class=\'fa fa-volume-off\'></i> Off">\
                    ', height);
                if (chatHTML5.config.myWebcamDraggable=='0') {
                    el = sprintf('<div id="video" style="top:0px; height:%spx; width:100%%" />', height);
                }
                var video = $(el, {
                    id: serverWebrtc.myStreamName,
                });
                var myWebcamDiv = $('<div />', {
                    id:'myWebcamDiv'
                });
                myWebcamDiv.appendTo($('#myWebcamContainer'));
                video.appendTo(myWebcamDiv);
                serverWebrtc.publishStream('video', false);
                if (chatHTML5.config.myWebcamDraggable=='1') {
                    chatHTML5.displayMyWebcamDraggable();
                }
                chatHTML5.cameraStatus(!value);
            })
        } else {
            $('#myWebcamContainer').hide(100);
            $('#myWebcamContainer video').remove();
            serverWebrtc.stopStream(serverWebrtc.myStreamName);
            chatHTML5.myUser.webcam = false;
            chatHTML5.socket.emit('changeUser', chatHTML5.myUser);
            if (chatHTML5.config.myWebcamDraggable=='1') {
                chatHTML5.getPanelById('myWebcamDraggable').remove();
            }
            chatHTML5.cameraStatus(!value);
        }
    };
    this.displayMyWebcamJanus = function(value) {
        if (value) {
            var height = (chatHTML5.config.myWebcamDraggable=='1')?'100%':235;
            $('#myWebcamContainer').show(100);
            var el = sprintf('<div id="myWebcamDiv" style="position: absolute;top:0px; height:%s; width:100%%" />', height);
            if (chatHTML5.config.myWebcamDraggable=='0') {
                el = sprintf('<div id="myWebcamDiv" style="top:0px; height:%spx; width:100%%" />', height);
            }
            //if (!$('#myWebcam').length) {
            $('#myWebcamContainer').append(el);
            //}
            var height = (chatHTML5.config.myWebcamDraggable=='1')?'100%':235;
            if (chatHTML5.config.myWebcamDraggable=='1') {
                chatHTML5.displayMyWebcamDraggable();
            }
            chatHTML5.myUser.janusPublished = false;
            publishStream($('#myWebcamDiv'), chatHTML5.config.streamIfWatched); // filename ici

        } else {
            stopPublishStream($('#myWebcamDiv'));
            $('#myWebcamContainer').hide(100);
            $('#myWebcamContainer video').remove();
            $('#myWebcamContainer #myWebcamDiv').remove();
            chatHTML5.myUser.webcam = false;
            chatHTML5.cameraStatus(true);
            chatHTML5.socket.emit('changeUser', chatHTML5.myUser);
            if (chatHTML5.config.myWebcamDraggable=='1') {
                chatHTML5.getPanelById('myWebcamDraggable').remove();
            }
        }
    }
    $(document).on('change', '#myAudioCheckBox', function() {
        var muted = $(this).prop('checked');
        if (chatHTML5.config.webrtcServer=='janus') {
            if(muted)
                sfu.unmuteAudio();
            else
                sfu.muteAudio();
        }
        else if (chatHTML5.config.webrtcServer=='mediasoup') {
            mute('#myVideo', !muted);
            var webcamOrAudio = ($('#myAudioCheckBox').prop('checked') || $('#myVideoCheckBox').prop('checked'));
            chatHTML5.myUser.webcam = webcamOrAudio;
            chatHTML5.cameraStatus(!webcamOrAudio);
            if (!webcamOrAudio) {
                $('#webcamBtn').prop('checked', false).change();
            }
        }
    })
    $(document).on('change', '#myVideoCheckBox', function() {
        if (chatHTML5.config.webrtcServer=='mediasoup') {
            var hasVideo = $(this).prop('checked');
            muteVideo('#myVideo', !hasVideo);
            if (hasVideo) {
                $('#myVideo').show();
            } else {
                $('#myVideo').hide();
            }
            var webcamOrAudio = ($('#myAudioCheckBox').prop('checked') || $('#myVideoCheckBox').prop('checked'));
            chatHTML5.myUser.webcam = webcamOrAudio;
            chatHTML5.cameraStatus(!webcamOrAudio);
            if (!webcamOrAudio) {
                $('#webcamBtn').prop('checked', false).change();
            }
        }
    })
    this.displayMyWebcamMediaSoup = function(value) {
        if (value) {
            var classe = (chatHTML5.config.audioVideo=='audio')?'audioOnly':'';
            var height = (chatHTML5.config.myWebcamDraggable=='1')?'100%':235;
            var el = sprintf('<div id="myWebcamDiv" class="%s" style="position:absolute;top:0px; height:%s; width:100%%" />', classe, height);
            if (chatHTML5.config.myWebcamDraggable=='0') {
                el = sprintf('<div id="myWebcamDiv" class="%s" style="top:0px; height:%spx; width:100%%" />', classe, height);
            }

            $('#myWebcamContainer').append(el);
            var height = (chatHTML5.config.myWebcamDraggable=='1')?'100%':235;
            if (chatHTML5.config.myWebcamDraggable=='1') {
                chatHTML5.displayMyWebcamDraggable();
            }
            var els =  '\
                <video id="myVideo" autoplay playsinline muted width="100%" ></video>\
                <button id="webcamMinimizeBtn" class="btn btn-xs"><i class="fa fa-minus-square-o"></i></button>\
                <button id="webcamConfigBtn" class="btn btn-xs"> <i class="fa fa-cog"></i></button>\
                <input id="myAudioCheckBox" type="checkbox" data-onstyle="info" data-style="ios" data-offstyle="default" data-onstyle="default" data-size="mini" checked data-toggle="toggle" data-on="<i class=\'fa fa-volume-up\'></i> On" data-off="<i class=\'fa fa-volume-off\'></i> Off">\
                <input id="myVideoCheckBox" type="checkbox" data-onstyle="info" data-style="ios" data-offstyle="default" data-onstyle="default" data-size="mini" checked data-toggle="toggle" data-on="<i class=\'fa fa-video-camera\'></i> On" data-off="<i class=\'fa fa-video-camera\'></i> Off">\
            ';

            $('#myWebcamDiv').append(els);
            $('#myAudioCheckBox').bootstrapToggle();
            $('#myAudioCheckBox').parent().addClass('myAudioCheckBox');

            $('#myVideoCheckBox').bootstrapToggle();
            $('#myVideoCheckBox').parent().addClass('myVideoCheckBox');
            chatHTML5.myUser.webcam = true;
            //console.log('chatHTML5.mediasoup.webcamEnabled', chatHTML5.mediasoup.webcamEnabled);

            //chatHTML5.cameraStatus(!value);
            if (chatHTML5.config.audioVideo=='audio') {
                $('#myVideoCheckBox').prop('checked', false);
            }
            $('#myWebcamContainer').show(100);
            var streamid = (chatHTML5.myUser.streamid)?chatHTML5.myUser.streamid:chatHTML5.myUser.id;
            publishOwnFeed('#myVideo', streamid, (chatHTML5.config.audioVideo=='audio')?'none':$('#videoSelect').val());

        } else {
            unpublishOwnFeed('#myVideo');
            var videoElement = document.querySelector('#myVideo');
            chatHTML5.myUser.webcam = false;
            chatHTML5.cameraStatus(!value);
            $('#myWebcamContainer #myWebcamDiv').remove();

            if (chatHTML5.config.myWebcamDraggable=='1') {
                chatHTML5.getPanelById('myWebcamDraggable').remove();
            }
            $('#myWebcamContainer #myWebcam').remove();
            $('#myWebcamContainer').hide(100);

        }

    }
    this.isIOS = function() {
        return !!navigator.platform.match(/iPhone|iPod|iPad/);
    }

    this.displayMyWebcam = function(value) {
        if (!value && chatHTML5.notice) {
            chatHTML5.notice.remove();
        }
        if (value && $('#myVideo').length) {
            return;
        }
        if (chatHTML5.roles[chatHTML5.myUser.role] && chatHTML5.roles[chatHTML5.myUser.role]['canStream']=='0') {
            if (chatHTML5.roles[chatHTML5.myUser.role]['explanationIfDisabled']) {
                bootbox.alert(chatHTML5.roles[chatHTML5.myUser.role]['explanationIfDisabled']);
            }
            return;
        }
        if (value && $('#myWebcamDiv').length) {
            return;
        }
        if (value && !$('#webcamBtn').is(':checked')) {
            return;
        }
        if (!value) {
            if (chatHTML5.myUser.broadcast) {
                chatHTML5.myUser.broadcast = false;
                $('#broadcastCheckBox').bootstrapToggle('enable');
                $('#broadcastCheckBox').bootstrapToggle('on');
            }
        }
        var errorMessage = chatHTML5.isIOS()?chatHTML5.traductions['Webcam error: Please use Safari']:chatHTML5.traductions['Webcam error: Please use Firefox or Chrome browser'];
        var urlParent = (window.location != window.parent.location) ? document.referrer : document.location.href;
        if (chatHTML5.config.webrtcServer=='kurento') {
            if (!chatHTML5.myUser.hasWebrtc) {
                if (urlParent.indexOf('https:'==-1)) {
                    errorMessage = chatHTML5.traductions['yourWebsiteNeedsHTTPS'];
                }
                bootbox.alert(errorMessage);
                return;
            }
            chatHTML5.displayMyWebcamKurento(value);
            return;
        }
        else if (chatHTML5.config.webrtcServer=='licode') {
            if (!chatHTML5.myUser.hasWebrtc) {
                if (urlParent.indexOf('https:'==-1)) {
                    errorMessage = chatHTML5.traductions['yourWebsiteNeedsHTTPS'];
                }
                bootbox.alert(errorMessage);
                return;
            }
            chatHTML5.displayMyWebcamLicode(value);
            return;
        }
        else if (chatHTML5.config.webrtcServer=='janus') {
            if (!chatHTML5.myUser.hasWebrtc) {
                if (urlParent.indexOf('https:'==-1)) {
                    errorMessage = chatHTML5.traductions['yourWebsiteNeedsHTTPS'];
                }
                bootbox.alert(errorMessage);
                return;
            }
            chatHTML5.displayMyWebcamJanus(value);
            return;
        }
        else if (chatHTML5.config.webrtcServer=='mediasoup') {
            if (!chatHTML5.myUser.hasWebrtc) {
                if (urlParent.indexOf('https:'==-1)) {
                    errorMessage = chatHTML5.traductions['yourWebsiteNeedsHTTPS'];
                }
                bootbox.hideAll();
                bootbox.alert(errorMessage);
                return;
            }
            chatHTML5.displayMyWebcamMediaSoup(value);
            return;
        }
        if (value) {
            $('#myWebcamContainer').show(100);
            var flashvars = {username: chatHTML5.myUser.id, w:chatHTML5.config.webcamWidth, h:chatHTML5.config.webcamHeight, xml:'/webcam.xml.php'};
            var params = {allowfullscreen : 'true', menu : 'false', quality : 'best', scale : 'noscale', wmode : 'opaque'};
            var attributes = {id : 'myWebcamDiv', name : 'myWebcamDiv'};
            $('#myWebcamContainer').append('\
            	<div id="myWebcamDiv">\
					<div class="allowFlash blink"><a href="https://www.adobe.com/go/getflashplayer"><i class="fa fa-exclamation-circle"></i> Enable Flash Player.<a/></div>\
				</div>');
            var height = (chatHTML5.config.myWebcamDraggable=='1')?'100%':235;
            swfobject.embedSWF(chatHTML5.config.swfPath + 'streamer.swf', 'myWebcamDiv', '100%', height, '10.0.0', 'expressInstall.swf', flashvars, params, attributes);
            if (chatHTML5.config.myWebcamDraggable=='1') {
                chatHTML5.displayMyWebcamDraggable();
            }
        } else {
            $('#myWebcamContainer').hide(100);
            swfobject.removeSWF('myWebcamDiv');
            chatHTML5.myUser.webcam = false;
            chatHTML5.socket.emit('changeUser', chatHTML5.myUser);
            if (chatHTML5.config.myWebcamDraggable=='1') {
                chatHTML5.getPanelById('myWebcamDraggable').remove();
            }
        }
        if (typeof swfobject!='undefined' && swfobject.hasFlashPlayerVersion('9') || chatHTML5.isMobile()) {
            $('.allowFlash').hide();
        } else {
            $('.allowFlash').show();
        }
    };

    this.endPrivateShow = function() {
        bootbox.alert(chatHTML5.traductions.privateShowEnded, function(res) {
            window.top.location.href = chatHTML5.config.conference_listingUrl;
        })
        setTimeout(function() {
            window.top.location.href = chatHTML5.config.conference_listingUrl;
        }, 5000)
    }

    this.getRoleById = function(roleid) {
        var res = {};
        $.each(chatHTML5.roles, function( id, role ) {
            if (roleid==role.id) {
                res = role;
            }
        });
        return res;
    }
    this.getRoleByName = function(label){
        var res = {};
        $.each(chatHTML5.roles, function( id, role ) {
            if (label==role.role) {
                res = (role.mappedRole)?role.mappedRole:role.role;
            }
        });
        return res;
    }

    this.adjustUserRoleImage = function(userid, role) {
        var srcImageRole = (chatHTML5.roles[role] || {}).image;
        var src = (srcImageRole)?sprintf('/upload/roles/%s', srcImageRole):'';
        var temp = sprintf('.userItem[data-id=%s] img.imageRole', userid);
        $(temp).attr('src', src);
    }

    this.adjustMyRole = function() {
        if (!chatHTML5.myUser.oldRole) {
            chatHTML5.myUser.oldRole = chatHTML5.myUser.role;
        }

        var moderators = ((chatHTML5.rooms[chatHTML5.myUser.room.id] || {}).moderators || '').split(',');
        var roles =((chatHTML5.rooms[chatHTML5.myUser.room.id] || {}).roles || '').split(',');
        var index = moderators.indexOf((chatHTML5.myUser.id || '').toString());

        if (index>=0) {
            var roleid = roles[index];
            var newRole = chatHTML5.getRoleById(roleid).role;
            if (newRole) {
                chatHTML5.myUser.role = newRole;
            } else {
                chatHTML5.myUser.role = chatHTML5.myUser.oldRole;
            }
        }
        chatHTML5.myUser.role = (chatHTML5.myUser.room.ownerid==chatHTML5.myUser.id)?'admin':chatHTML5.myUser.oldRole;
        chatHTML5.changeMyStatus();
        chatHTML5.adjustUserRoleImage(chatHTML5.myUser.id, chatHTML5.myUser.role);
    }


    this.enterRoom = function(roomid) {
        if (chatHTML5.rooms && chatHTML5.rooms[roomid].users>=parseInt(chatHTML5.rooms[roomid].maxUsers)) {
            bootbox.alert(traductions["Maxumum number of users in room reached. Pick another room"]);
            return;
        }
        try {
            if (chatHTML5.myUser.roomsIn && chatHTML5.myUser.roomsIn.length >= parseInt(chatHTML5.roles[chatHTML5.myUser.role].max_rooms_opened) && chatHTML5.myUser.roomsIn.indexOf(roomid) == -1) {
                bootbox.alert(traductions["MaxRoomsOpenedReached"]);
                return;
            }
        } catch(e) {

        }
        var reservedToGenderid = chatHTML5.rooms[roomid].reservedToGenderid;
        var reservedToRoles = chatHTML5.rooms[roomid].reservedToRoles;
        var isTemp = chatHTML5.rooms[roomid].isTemp;
        var myGenderid = chatHTML5.getGenderId(chatHTML5.myUser.gender);
        var myroleid = (chatHTML5.roles[chatHTML5.myUser.role || ''] || {}).id;
        var canAccessPasswordProtecedRooms = ((chatHTML5.rooms[roomid].ownerid == chatHTML5.myUser.id) || ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canAccessPasswordProtecedRooms=='1'));
        var genderAllowed = chatHTML5.getGenderById(reservedToGenderid);
        var roleAllowed = chatHTML5.getRoleById(reservedToRoles);
        if (reservedToGenderid!='0' && myGenderid!=reservedToGenderid && !canAccessPasswordProtecedRooms) {
            bootbox.alert(sprintf(chatHTML5.traductions.ThisRoomAllowedToGenderOnly, genderAllowed));
            return;
        }
        if (reservedToRoles!='0' && myroleid!=reservedToRoles && !canAccessPasswordProtecedRooms) {
            var roleLabel = chatHTML5.getRoleByName(roleAllowed.role);
            bootbox.alert(sprintf(chatHTML5.traductions.ThisRoomAllowedToRoleOnly, roleLabel));
            return;
        }
        if (chatHTML5.config.multiRoomEnter=='1') {
            var tabs = chatHTML5.getTabs();
            if (tabs.selectById(roomid)) {
                $('#roomsModal').modal('hide');
                return;
            }

        } else {
            // don ot connect if connected
            if (chatHTML5.myUser.room.id == roomid) {
                $('#roomsModal').modal('hide');
                return;
            }
        }
        var canAccessPasswordProtecedRooms = ((chatHTML5.rooms[roomid].ownerid == chatHTML5.myUser.id) || ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canAccessPasswordProtecedRooms=='1'));
        if (chatHTML5.rooms[roomid].isPasswordProtected==='1' && !canAccessPasswordProtecedRooms ) {
            bootbox.prompt(chatHTML5.traductions.enterPassword, function(password) {
                if (!password) {
                    return;
                }
                $.post(chatHTML5.config.ajax, {a:'checkPasswordRoom', id:roomid, password:password}, function(res) {
                    if (res==='ok') {
                        chatHTML5.closeAllTabs();
                        chatHTML5.changeRoom(roomid);
                        return;
                    }
                    bootbox.alert(chatHTML5.traductions.passwordIncorrect);
                });
            });
            return;
        }
        chatHTML5.closeAllTabs();
        chatHTML5.changeRoom(roomid);
    };



    this.displayMyWebcamDraggable = function() {
        var width  = 220;
        var height = 165;

        var left = $(window).width()/2 - width/2;
        var top = 100;
        $.jsPanel({
            selector: '#tabs',
            headerTitle:'<img src="/img/webcam.svg" width="32px" height="32px"> ' + chatHTML5.traductions.myWebcam,
            position: {
                left: left,
                top:  top
            },
            container:'#container',
            content:  myWebcamDiv,
            contentSize: {width: width, height: height},
            headerControls: {
                iconfont: 'font-awesome',
                close: 'remove',
                maximize:'remove',
                minimize:'remove'
            },
            maximizedMargin: {
                top:    10,
                right:  20,
                bottom: 50,
                left:   20
            },
            dragit: {
                disableui:false,
            },
            draggable: {
                containment: "parent"
            },

            resizable: {
                handles:   'ne, se, sw, nw',
                autoHide:  false,
                minWidth:  220,
                minHeight: 80,
                aspectRatio: true
            },
            id:'myWebcamDraggable'
        });
        if (typeof swfobject!='undefined' && swfobject.hasFlashPlayerVersion('9') || chatHTML5.isMobile()) {
            $('.allowFlash').hide();
        } else {
            $('.allowFlash').show();
        }
    }

    this.updateWatchingAtMeTotal = function() {
        $('span#watchAtMe').text($('div.userItem i.fa-eye.isWatching').length);

    }

    $('#webcamBtn').change(function(e) {
        if (!chatHTML5.checkAllowed('canStream')) {
            return;
        }
        var value = $(this).is(':checked');
        if (value) {
            $('#userList div[data-username] div.eye-icon i').removeClass('hidden').removeClass('isWatching');
        } else {
            $('#userList div[data-username] div.eye-icon i').addClass('hidden').removeClass('isWatching');
        }
        chatHTML5.displayMyWebcam(value);
    });

    this.privacyClosed = function(value) {
        //console.log('privacyClosed', value);
        this.cameraStatus(!value);
    }

    this.promoteRole = function(data) {
        chatHTML5.socket.emit('promoteRole', data);
    }

    this.cameraStatus = function(value) {
        if (!chatHTML5.socket.connected) {
            return;
        }
        chatHTML5.myUser.webcam=!value;
        chatHTML5.myUser.hasWebcam=!value;
        chatHTML5.myUser.audio = $('#myAudioCheckBox').prop('checked');
        chatHTML5.myUser.video = $('#myVideoCheckBox').prop('checked');
        chatHTML5.myUser.rouletteBusy = false;

        setTimeout(function() {
            chatHTML5.socket.emit('changeUser', chatHTML5.myUser);
        }, 1800);

        if (chatHTML5.myUser.webcam) {
            $('#broadcastCheckBox').bootstrapToggle('enable');
        } else {
            $('#broadcastCheckBox').bootstrapToggle('disable');
        }
        //console.info('cameraStatus', value);
    }

    this.cameraActivated = function(value) {
        if (chatHTML5.myUser.cameraActivated) {
            return;
        }
        chatHTML5.myUser.cameraActivated = true;
        chatHTML5.myUser.webcam = value;
        chatHTML5.myUser.hasWebcam=!value;
        chatHTML5.socket.emit('changeUser', chatHTML5.myUser);
        if (chatHTML5.myUser.webcam) {
            $('#broadcastCheckBox').bootstrapToggle('enable');
        } else {
            $('#broadcastCheckBox').bootstrapToggle('disable');
        };
    }

    this.publishWebcam = function(value) {
        //console.log('publishWebcam', value);
    };
    $('#chooseWebcamBtn').click(function() {
        unpublishOwnFeed('#myVideo');
        setTimeout(function() {
            publishOwnFeed('#myVideo', (chatHTML5.config.audioVideo=='audio')?'none':$('#videoSelect').val(), $('#audioSelect').val());
            $('#webcamChooseModal').modal('hide');
        }, 2000);
    })


    $(document).on('click', '#usersContainer #webcamMinimizeBtn', function(e) {
        $('#myWebcamDiv').toggleClass('webcamMinimized');
        $('#webcamMinimizeBtn i').toggleClass('fa-minus-square-o').toggleClass('fa-plus-square-o');
    });

    $(document).on('click', '#webcamConfigBtn', function(e) {
        $('#webcamChooseModal').modal('show');
        if( $('#videoSelect').has('option').length == 0 ) {
            $('#videoSelect').empty();
            $('#audioSelect').empty();
            listDevices(function(devices) {
                devices.forEach(function(device) {
                    var option = new Option(device.label, device.deviceId);
                    if (device.kind=='videoinput') {
                        $('#videoSelect').append($(option));
                    } else {
                        $('#audioSelect').append($(option));
                    }
                });
            });
        }
        $('#modal_webcamChoose').toggle();
    });

    $(document).on('click', '.webcamBtn', function(event) {
        if (chatHTML5.amIMuted()) {
            return;
        }
        if ( chatHTML5.config.chatType=='conference' && (chatHTML5.roles[chatHTML5.myUser.role]).canRequestWebcamWhenPrivate=='0') {
            bootbox.alert(chatHTML5.traductions["you are not allow to request webcam"]);
            return;
        }
        event.stopPropagation();
        var username = removeTags($(this).closest('.userItem').data('username'));
        if (!chatHTML5.getUserByUsername(username).streamid) {
            var user = chatHTML5.getUserByUsername(username);
            user.webcam = false;
            chatHTML5.changeUser(user);
            return;
        }
        var id = $(this).closest('.userItem').data('id');
        if (chatHTML5.isMobile()) {
            if ($('#usersContainer').hasClass('toggleWidth')) {
                $('.slide_block').click();
            }
        }
        if (chatHTML5.roles[chatHTML5.myUser.role] && chatHTML5.roles[chatHTML5.myUser.role]['canOpenAnyWebcam']=='1') {
            chatHTML5.addWebcam(id, username);
            chatHTML5.socket.emit('notification',
                {userid:id, title:chatHTML5.traductions['adminWatchesYou'], text:chatHTML5.traductions['you are watched by admin'], type:'warning'}
            );
            return;
        }
        if (chatHTML5.myUser.canOpenAnyWebcam=='1') {
            chatHTML5.addWebcam(id, username);
            return;
        }
        var btnClicked = this;
        $(this).prop('disabled', true);
        $(this).css('opacity', 0.3);
        setTimeout(function() {
            $(btnClicked).prop('disabled', false);
            $(btnClicked).css('opacity', 1);
        }, 10000);

        if ((chatHTML5.users[id].webcamPublic && !chatHTML5.forbiddenToWatchMe[id]) || (chatHTML5.allowedToWatchMe[id])) {
            chatHTML5.addWebcam(id, username);
        } else {
            if (!chatHTML5.checkAllowed('canWatch')) {
                return;
            }
            if ((chatHTML5.roles[chatHTML5.myUser.role]).canRequestWebcam=='0') {
                bootbox.alert(chatHTML5.traductions["you are not allow to request webcam"]);
                return;
            }
            chatHTML5.serverMessage(sprintf('<i class="fa fa-video-camera"></i> %s %s', chatHTML5.traductions.youEequestedWatchWebcamOf, username), 'webcamRequest', id);
            chatHTML5.socket.emit('webcamRequest', id);
        }
    });

    $('#youTubeCloseBtn').click(function() {
        $('#youtubeContainer').empty();
        $('#youtubeWrap').hide();
    })

    this.removeWebcam = function(id) {
        if (chatHTML5.config.chatType=='tabAndWindow' || chatHTML5.config.chatType=='window' || chatHTML5.config.chatType=='conference') {
            var panel = chatHTML5.getPanelById('_webcam_' + id);
            if (panel.length) {
                chatHTML5.socket.emit('watch', chatHTML5.myUser.id, id, false);
            }
            panel.remove();
        } else {
            var temp = sprintf(".webcamContainer[data-id=%s]", id);
            if ($(temp).length) {
                chatHTML5.socket.emit('watch', chatHTML5.myUser.id, id, false);
            }
            $(temp).remove();
        }

        if (!$('#webcamsContainer').children().length) {
            $('#webcamsContainer').hide();
            $('#tabs').css('height', 'calc(100% - 120px)');
            // $('#chatContainer').css('height', 'calc(100% - 0px)');
        }
        chatHTML5.scrollActiveChatToBottom();
        var user = (chatHTML5.users[id] || {});
        var streamid = (user.streamid)?user.streamid:user.id;

        if (chatHTML5.config.webrtcServer=='janus') {
            stopStream(streamid);
        }

        if (chatHTML5.config.webrtcServer=='mediasoup') {
            if (streamid) {
                if (typeof stopstream != "undefined") {
                    stopStream(streamid);
                }
            }
        }
        if (chatHTML5.config.webrtcServer=='kurento') {
            serverWebrtc.stopStream(streamid+'_viewer');
        }
        if (chatHTML5.config.webrtcServer=='licode') {
            serverWebrtc.stopStream(streamid);
        }
        var numberWebcams = chatHTML5.getWebcamNumber();
        if (!numberWebcams) {
            clearInterval(chatHTML5.myUser.secondsSpentTimer);
        }
        if (chatHTML5.config.chatType=='conference') {
            var temp = sprintf('#conferenceWebcamContainer video[id=remotevideo%s]', streamid);
            $(temp).remove();
        }
    };
    this.maxWebcamreached = function() {
        var webcamMax = parseInt((chatHTML5.roles[chatHTML5.myUser.role] || {}).webcamMax);
        var res = ($('#webcamsContainer').children().length>parseInt(webcamMax) || $('.jsPanel').length>parseInt(webcamMax))?true:false;
        /*if (!res) {
            webcamMax = parseInt((chatHTML5.roles[chatHTML5.myUser.role] || {}).webcamMax);
            res = ($('#webcamsContainer').children().length>=webcamMax || $('.jsPanel .webcamContainer').length>=webcamMax)?true:false;
        }*/
        return res;
    };

    this.getWebcamDimensions = function() {
        var height = parseInt(chatHTML5.config.webcamHeight);
        if (height<160) {
            height = 160;
        }
        var res = {width:310, height:height, minWidth:140, minHeight:140};
        if (chatHTML5.myUser.isMobile) {
            res = {width:200, height:160, minWidth:140, minHeight:140};
        }
        return res;

    };
    this.addWebcamJanus= function(id, username, broadcast, talks=false) {
        if (!chatHTML5.myUser.hasWebrtc) {
            return;
        }
        if (chatHTML5.maxWebcamreached()) {
            chatHTML5.serverMessage(chatHTML5.traductions.webcamNumberMaximumReached, 'privateRequested');
            return;
        }
        var webcamid = 'webcam_'+ id;
        if ($('#'+webcamid).length) {
            return;
        }

        chatHTML5.socket.emit('watch', chatHTML5.myUser.id, id, true);
        $('#webcamsContainer').show();
        var webcamTemplate = sprintf('\
		<div data-id=%s class="webcamContainer noFloat" style="float: left">\
			<div class="webcamHeader">\
				<i class="fa fa-times pull-right webcamCloseBtn" title="%s"></i>\
				<span>%s</span>\
			</div>\
			<div id="%s" class="webcamSwfContainer">\
			</div>\
		</div>', id, chatHTML5.traductions.close, username,  webcamid);

        // window

        if (chatHTML5.config.chatType=='tabAndWindow' || chatHTML5.config.chatType=='window' || (chatHTML5.config.chatType=='conference' && chatHTML5.myUser.role=='performer')) {
            var webcamTemplate = sprintf('\
                <div data-id=%s class="webcamContainer" style="width:100%%;height:100%%">\
                    <div id="%s" class="webcamSwfContainer"></div>\
                </div>',
                id, webcamid);

            var user = chatHTML5.users[id];
            if (broadcast) {
                var message = (talks)?chatHTML5.traductions.talks:chatHTML5.traductions.broadcasting;
                var headerTitle = sprintf('%s <span class="blink">%s</span>', username, message);
                var offsetX = chatHTML5.getOffsetX();
                var offsetY = chatHTML5.getOffsetY();
            } else {
                var headerTitle = username;
                var offsetX = chatHTML5.getOffsetX();
                var offsetY = -150 + Math.ceil(Math.random()*150);
            }
            var header = sprintf('<span><img src="%s" class="userAvatar"></span> %s', user.image, headerTitle);
            var dimensions = chatHTML5.getWebcamDimensions();
            var controls = chatHTML5.isMobile()?'closeonly':'closeonly';
            $.jsPanel({
                selector: '#tabs',
                headerTitle: header,
                position: {
                    my: 'center',
                    at: 'center',
                    offsetX: offsetX,
                    offsetY: offsetY,
                },
                content:  webcamTemplate,
                contentSize: {
                    width: (dimensions.height * 4) / 3,
                    height: dimensions.height
                },
                headerControls: { iconfont: 'font-awesome', controls: controls },
                resizable: {
                    handles:   'ne, se, sw, nw',
                    autoHide:  false,
                    minWidth:  dimensions.minWidth,
                    minHeight: dimensions.minHeight,
                    aspectRatio: true
                },
                dragit: {
                    disableui:false,
                },
                draggable: {
                    containment: "parent"
                },

                id:'_webcam_'+id
            });
        } else if (chatHTML5.config.chatType=='conference' && !chatHTML5.isMobile()) {
            var streamName = (chatHTML5.users[id] || {}).streamid;
            if (streamName) {
                var muted = (chatHTML5.config.soundMutedAtStart == '1');
                var $dom = $('#conferenceWebcamContainer');
                $dom.show();
                playStream(streamName, $dom, muted);
                return;
            }
        }
        else {
            // tabbed !
            $('#webcamsContainer').append(webcamTemplate);
            if ($("#webcamsContainer").children().length) {
                var newHeight = 160 + parseInt(chatHTML5.config.webcamHeight);
                $('#tabs').attr('style', 'height: calc(100% - '+newHeight+'px) !important');
            } else {
                $('#tabs').attr('style', 'height: calc(100% - 285px) !important');
            }
            $('#chatContainer').css('height', 'calc(100% - 60px)');
            var width = chatHTML5.config.webcamWidth + 'px';
            var height = chatHTML5.config.webcamHeight + 'px';
            if (chatHTML5.config.chatType=='tabAndWindow' || chatHTML5.config.chatType=='window') {
                width = '100%';
                height = '100%';
            }
        }
        chatHTML5.scrollActiveChatToBottom();
        var streamName = chatHTML5.users[id].streamid;
        var muted = (chatHTML5.config.soundMutedAtStart == '1');
        var dom =  $('#' +webcamid);

        if (!width) {
            width = '100%';
        }
        if (!height) {
            height = '100%';
        }
        $(dom).css('max-width', width);
        $(dom).css('height', height);
        playStream(streamName, dom, muted);
    };

    this.addWebcamMediaSoup = function(id, username, broadcast, talks=false, audioOnly = false) {
        if (!chatHTML5.myUser.hasWebrtc) {
            return;
        }
        if (chatHTML5.maxWebcamreached()) {
            chatHTML5.serverMessage(chatHTML5.traductions.webcamNumberMaximumReached, 'privateRequested');
            return;
        }
        var webcamid = 'webcam_' + id;
        if ($('#' + webcamid).length) {
            return;
        }

        chatHTML5.socket.emit('watch', chatHTML5.myUser.id, id, true);
        $('#webcamsContainer').show();

        var user = chatHTML5.users[id] || {};
        var streamid = (user.streamid) ? user.streamid : id;
        var videoClass = (audioOnly) ? 'audioOnly' : '';
        var webcamTemplate = sprintf('\
		<div data-id=%s class="webcamContainer noFloat">\
			<div class="webcamHeader">\
				<i class="fa fa-times pull-right webcamCloseBtn" title="%s"></i>\
				<span>%s</span>\
			</div>\
			<div id="%s" class="webcamSwfContainer %s">\
			</div>\
		</div>',
            id, chatHTML5.traductions.close, username, webcamid, videoClass);


        var shouldDisplayPanelWebcam = ((chatHTML5.config.chatType == 'conference' && chatHTML5.isMobile())  || (chatHTML5.config.chatType == 'conference' && chatHTML5.myUser.role == 'performer'));

        if (chatHTML5.config.chatType == 'tabAndWindow' || chatHTML5.config.chatType == 'window' || (shouldDisplayPanelWebcam)) {
            var webcamTemplate = sprintf('\
		        <div data-id=%s class="webcamContainer" style="width:100%%;height:100%%">\
			        <div id="%s" class="webcamSwfContainer %s" style="height: 100%%;"></div>\
		        </div>',
                id, webcamid, videoClass);
            if (broadcast) {
                var message = (talks) ? chatHTML5.traductions.talks : chatHTML5.traductions.broadcasting;
                var headerTitle = sprintf('%s <span class="blink">%s</span>', username, message);
                var offsetX = chatHTML5.getOffsetX();
                var offsetY = ($('#container').height() / 2) - 200;
            } else {
                var headerTitle = username;
                var offsetX = chatHTML5.getOffsetX();
                var offsetY = -150 + Math.ceil(Math.random() * 150);
            }
            var header = sprintf('<span><img src="%s" class="userAvatar"></span> %s', user.image, headerTitle);
            $.jsPanel({
                selector: '#tabs',
                headerTitle: header,
                position: {
                    my: 'center',
                    at: 'center',
                    offsetX: offsetX,
                    offsetY: offsetY,
                },
                content: webcamTemplate,
                contentSize: {width: 310, height: 230},
                headerControls: {iconfont: 'font-awesome', controls: 'closeonly'},
                resizable: {
                    handles: 'ne, se, sw, nw',
                    autoHide: false,
                    minWidth: 160,
                    minHeight: 160,
                    aspectRatio: true
                },
                dragit: {
                    disableui: false,
                },
                draggable: {
                    containment: "parent"
                },

                id: '_webcam_' + id
            });
        } else if (chatHTML5.config.chatType == 'conference' && !chatHTML5.isMobile()) {
            if (streamid) {
                var muted = (chatHTML5.config.soundMutedAtStart == '1');
                var mutedString = (muted) ? 'muted="muted"' : '';
                var dom = '#conferenceWebcamContainer';
                var videoid = sprintf("remotevideo%s", streamid)
                var temp = sprintf('<video id="%s" autoplay="autoplay" width="100%%" height="100%%" playsinline="" controls  data-id="%s" %s/>',
                    videoid, streamid, mutedString);
                $(dom).append(temp);
                $(dom).show();
                playStream(streamid, '#' + videoid);
                return;
            }
        }

        else if (chatHTML5.config.chatType=='roulette') {
            if (streamid) {
                var muted = (chatHTML5.config.soundMutedAtStart == '1');
                var mutedString = (muted)?'muted="muted"':'';
                var dom = '#middleContainer';
                var videoid = sprintf("remotevideo%s", streamid)
                var temp = sprintf('<video id="%s" autoplay="autoplay" width="100%%" height="100%%" playsinline="" controls  data-id="%s" %s/>',
                    videoid, streamid, mutedString);
                $(dom).append(temp);
                playStream(streamid, '#' + videoid);
                $('#middleContainer').css('background-image', 'none');
                return;
            }
        }
        else {
            $('#webcamsContainer').append(webcamTemplate);
            if ($("#webcamsContainer").children().length) {
                $('#tabs').css('height', 'calc(100% - 360px)');
            } else {
                $('#tabs').css('height', 'calc(100% - 285px)');
            }
            $('#chatContainer').css('height', 'calc(100% - 60px)');
        }
        var width = chatHTML5.config.webcamWidth + 'px';
        var height = chatHTML5.config.webcamHeight + 'px';
        if (chatHTML5.config.chatType=='tabAndWindow' || chatHTML5.config.chatType=='window') {
            width = '100%';
            height = '100%';
        }
        chatHTML5.scrollActiveChatToBottom();

        var videoid = 'video_' + id;
        var muted = (chatHTML5.config.soundMutedAtStart == '1')?'muted':'';
        if (chatHTML5.config.chatType=='tab') {
            height = '220px';
        }
        var els = `<video id="${videoid}"  autoplay="" playsinline="" controls  style="width:100%;height:100%;max-height:${height};max-width:${width}"></video>`;

        /*        var els = sprintf('\
                    <video id="%s"  autoplay="" playsinline="" controls  style="width:100%%;height:100%%;max-height:%s;max-width:%s"></video>'
                    , videoid, width, height);*/

        $('#' + webcamid).append(els);
        playStream(streamid, $('#' + videoid));
        /* setTimeout(function() {
         $('#' + videoid).prop('controls', 'true');
         }, 2000)*/


    };

    this.addWebcamLicode= function(id, username, broadcast, talks = false) {
        if (!chatHTML5.myUser.hasWebrtc) {
            return;
        }
        if (chatHTML5.maxWebcamreached()) {
            chatHTML5.serverMessage(chatHTML5.traductions.webcamNumberMaximumReached, 'privateRequested');
            return;
        }
        var webcamid = 'webcam_'+ id;
        if ($('#'+webcamid).length) {
            return;
        }
        chatHTML5.socket.emit('watch', chatHTML5.myUser.id, id, true);
        $('#webcamsContainer').show();
        var webcamTemplate = sprintf('\
		<div data-id=%s class="webcamContainer noFloat">\
			<div class="webcamHeader">\
				<i class="fa fa-times pull-right webcamCloseBtn" title="%s"></i>\
				<span>%s</span>\
			</div>\
			<div id="%s" class="webcamSwfContainer">\
			</div>\
		</div>',
            id, chatHTML5.traductions.close, username,  webcamid);

        if (chatHTML5.config.chatType=='tabAndWindow' || chatHTML5.config.chatType=='window') {
            var webcamTemplate = sprintf('\
		<div data-id=%s class="webcamContainer" style="width:100%%;height:100%%">\
			<div id="%s" class="webcamSwfContainer"></div>\
		</div>',
                id, webcamid);

            var user = chatHTML5.users[id];
            if (broadcast) {
                var message = (talks)?chatHTML5.traductions.talks:chatHTML5.traductions.broadcasting;
                var headerTitle = sprintf('%s <span class="blink">%s</span>', username, message);
                var offsetX = chatHTML5.getOffsetX();
                var offsetY = chatHTML5.getOffsetY();
            } else {
                var headerTitle = username;
                var offsetX = chatHTML5.getOffsetX();
                var offsetY = -150 + Math.ceil(Math.random()*150);
            }
            var header = sprintf('<span><img src="%s" class="userAvatar"></span> %s', user.image, headerTitle);
            $.jsPanel({
                selector: '#tabs',
                headerTitle: header,
                position: {
                    my: 'center',
                    at: 'center',
                    offsetX: offsetX,
                    offsetY: offsetY,
                },
                content:  webcamTemplate,
                contentSize: {width: 310, height: 230},
                headerControls: { iconfont: 'font-awesome', controls: 'closeonly' },
                resizable: {
                    handles:   'ne, se, sw, nw',
                    autoHide:  false,
                    minWidth:  160,
                    minHeight: 160,
                    aspectRatio: true
                },
                dragit: {
                    disableui:false,
                },
                draggable: {
                    containment: "parent"
                },
                id:'_webcam_'+id
            });
        } else {
            $('#webcamsContainer').append(webcamTemplate);
            if ($("#webcamsContainer").children().length) {
                $('#tabs').css('height', 'calc(100% - 360px)');
            } else {
                $('#tabs').css('height', 'calc(100% - 285px)');
            }
            $('#chatContainer').css('height', 'calc(100% - 60px)');
        }
        var width = chatHTML5.config.webcamWidth + 'px';
        var height = chatHTML5.config.webcamHeight + 'px';
        if (chatHTML5.config.chatType=='tabAndWindow' || chatHTML5.config.chatType=='window') {
            width = '100%';
            height = '100%';
        }
        chatHTML5.scrollActiveChatToBottom();
        var streamName = chatHTML5.users[id].myStreamName;
        var videoid = 'video_'+ streamName;
        var el = sprintf('<div id="%s" style="width: %s;height:%s;position:absolute;top:0px;"></div>', videoid, width, height);
        $('#'+webcamid).append(el);
        //var video = document.getElementById(videoid);
        //console.log(streamName, videoid);
        serverWebrtc.playStream(streamName, videoid);
    };

    this.addWebcamKurento = function(id, username, broadcast, talks=false) {
        if (!chatHTML5.myUser.hasWebrtc) {
            return;
        }

        if (chatHTML5.maxWebcamreached()) {
            chatHTML5.serverMessage(chatHTML5.traductions.webcamNumberMaximumReached, 'privateRequested');
            return;
        }
        var webcamid = 'webcam_'+ id;
        if ($('#'+webcamid).length) {
            return;
        }
        chatHTML5.socket.emit('watch', chatHTML5.myUser.id, id, true);
        $('#webcamsContainer').show();
        var webcamTemplate = sprintf('\
		<div data-id=%s class="webcamContainer noFloat">\
			<div class="webcamHeader">\
				<i class="fa fa-times pull-right webcamCloseBtn" title="%s"></i>\
				<span>%s</span>\
			</div>\
			<div id="%s" class="webcamSwfContainer">\
			</div>\
		</div>',
            id, chatHTML5.traductions.close, username,  webcamid);

        if (chatHTML5.config.chatType=='tabAndWindow' || chatHTML5.config.chatType=='window') {
            var webcamTemplate = sprintf('\
		<div data-id=%s class="webcamContainer" style="width:100%%;height:100%%">\
			<div id="%s" class="webcamSwfContainer"></div>\
		</div>',
                id, webcamid);

            var user = chatHTML5.users[id];
            if (broadcast) {
                var message = (talks)?chatHTML5.traductions.talks:chatHTML5.traductions.broadcasting;
                var headerTitle = sprintf('%s <span class="blink">%s</span>', username, message);
                var offsetX = chatHTML5.getOffsetX();
                var offsetY = chatHTML5.getOffsetY();
            } else {
                var headerTitle = username;
                var offsetX = chatHTML5.getOffsetX();
                var offsetY = -150 + Math.ceil(Math.random()*150);
            }
            var header = sprintf('<span><img src="%s" class="userAvatar"></span> %s', user.image, headerTitle);
            $.jsPanel({
                selector: '#tabs',
                headerTitle: header,
                position: {
                    my: 'center',
                    at: 'center',
                    offsetX: offsetX,
                    offsetY: offsetY,
                },
                content:  webcamTemplate,
                contentSize: {width: 310, height: 230},
                headerControls: { iconfont: 'font-awesome', controls: 'closeonly' },
                resizable: {
                    handles:   'ne, se, sw, nw',
                    autoHide:  false,
                    minWidth:  160,
                    minHeight: 160,
                    aspectRatio: true
                },
                dragit: {
                    disableui:false,
                },
                draggable: {
                    containment: "parent"
                },


                id:'_webcam_'+id
            });
        } else {
            $('#webcamsContainer').append(webcamTemplate);
            if ($("#webcamsContainer").children().length) {
                $('#tabs').css('height', 'calc(100% - 360px)');
            } else {
                $('#tabs').css('height', 'calc(100% - 285px)');
            }
            $('#chatContainer').css('height', 'calc(100% - 60px)');
        }
        var width = chatHTML5.config.webcamWidth + 'px';
        var height = chatHTML5.config.webcamHeight + 'px';
        if (chatHTML5.config.chatType=='tabAndWindow' || chatHTML5.config.chatType=='window') {
            width = '100%';
            height = '100%';
        }
        chatHTML5.scrollActiveChatToBottom();
        var streamName = chatHTML5.users[id].myStreamName;

        var videoid = 'video_'+ id;
        var el = sprintf('<video id="%s" controls autoplay style="width: %s; height: %s"></video>', videoid, width, height);
        $('#'+webcamid).append(el);
        var video = document.getElementById(videoid);
        //console.log(streamName, videoid);
        serverWebrtc.playStream(streamName, video);
    };
    this.getTabs = function() {
        return tabs;
    }
    this.getWebcamNumber = function() {
        var numberWebcams = 0;
        $('#webcamsContainer').children().each(function( index ) {
            var id = $(this).data('id');
            numberWebcams++
        });
        $( '.jsPanel' ).each(function( index ) {
            if ($(this).find('video')) {
                numberWebcams++
            }
        });
        return numberWebcams;
    }
    this.closeAllWebcams = function() {
        $('#webcamsContainer').children().each(function( index ) {
            var id = $(this).data('id');
            chatHTML5.removeWebcam(id);
        });
        $( '.jsPanel' ).each(function( index ) {
            if ($(this).find('video')) {
                $(this).remove();
            }
        });
    }


    this.addUsers_videoTimeSpent = function() {
        $.post(chatHTML5.config.ajax, {a: 'addUsers_videoTimeSpent', userid:chatHTML5.myUser.id, webmasterid:chatHTML5.myUser.webmasterid}, function (secondsSpent) {
            var maxMinutes = parseInt((chatHTML5.roles[chatHTML5.myUser.role] || {}).maxVideoMinutesPerDay);
            var maxSeconds = parseInt(maxMinutes) * 60;
            if (parseInt(secondsSpent)>maxSeconds) {
                clearInterval(chatHTML5.myUser.secondsSpentTimer);
                bootbox.alert(chatHTML5.traductions.maximumWebcamTimeSpent);
                chatHTML5.closeAllWebcams();
                chatHTML5.myUser.videoSpent = true;
            }
        });
    }


    this.addWebcam = function(id, username, broadcast, talks=false) {
        if (chatHTML5.maxWebcamreached()) {
            chatHTML5.serverMessage(chatHTML5.traductions.webcamNumberMaximumReached, 'privateRequested');
            return;
        }

        if (chatHTML5.roles[chatHTML5.myUser.role] && chatHTML5.roles[chatHTML5.myUser.role]['canWatch']=='0') {
            if (chatHTML5.roles[chatHTML5.myUser.role]['explanationIfDisabled']) {
                bootbox.alert(chatHTML5.roles[chatHTML5.myUser.role]['explanationIfDisabled'])
            }
            return;
        }

        // limit watch ?
        if (parseInt((chatHTML5.roles[chatHTML5.myUser.role] || {}).maxVideoMinutesPerDay)) {
            if (chatHTML5.myUser.videoSpent ) {
                chatHTML5.closeAllWebcams();
                bootbox.alert(chatHTML5.traductions.maximumWebcamTimeSpent);
                return;
            }
            if (!broadcast) {
                chatHTML5.addUsers_videoTimeSpent();
                clearInterval(chatHTML5.myUser.secondsSpentTimer);
                chatHTML5.myUser.secondsSpentTimer = setInterval(function () {
                    chatHTML5.addUsers_videoTimeSpent();
                }, 10000);
            }
        }
        if (chatHTML5.isMobile() && $('#webcamsContainer').children().length) {
            //chatHTML5.closeAllWebcams();
        }

        if (broadcast && !talks && chatHTML5.config.howBroadcastOpens=='chat warn') {
            var message = sprintf(chatHTML5.traductions.userHasStartedBroadcasting, username);
            chatHTML5.serverMessage(message, 'question');
            return;
        }
        if (broadcast && !talks && chatHTML5.config.howBroadcastOpens=='notification warn') {
            var message = sprintf(chatHTML5.traductions.userHasStartedBroadcasting, username);
            new PNotify({
                delay:4000,
                title: chatHTML5.traductions.BroadCasting,
                text: message,
                type: 'success',
                styling: 'bootstrap3'
            });
            return;
        }
        if (broadcast && talks) {
            var message = sprintf(chatHTML5.traductions.userIsTalking, username);
            chatHTML5.notice = new PNotify({
                delay:4000,
                title: chatHTML5.traductions.pushToTalk,
                text: message,
                type: 'success',
                styling: 'bootstrap3',
                hide:false
            });
        }
        var user = chatHTML5.getUserByUsername(username);
        var audioOnly = (user && user.audio && !user.video);

        if (chatHTML5.config.webrtcServer=='kurento') {
            chatHTML5.addWebcamKurento(id, username, broadcast, talks, audioOnly);
            return;
        }
        if (chatHTML5.config.webrtcServer=='licode') {
            chatHTML5.addWebcamLicode(id, username, broadcast, talks, audioOnly);
            return;
        }
        if (chatHTML5.config.webrtcServer=='janus') {
            chatHTML5.addWebcamJanus(id, username, broadcast, talks, audioOnly);
            return;
        }
        if (chatHTML5.config.webrtcServer=='mediasoup') {
            chatHTML5.addWebcamMediaSoup(id, username, broadcast, talks, audioOnly);
            return;
        }
        if ($('#webcamsContainer').children().length>parseInt(chatHTML5.config.webcamMax)) {
            chatHTML5.serverMessage(chatHTML5.traductions.webcamNumberMaximumReached, 'privateRequested');
            return;
        }
        var webcamid = 'webcam_'+ id;
        if ($('#'+webcamid).length) {
            return;
        }
        chatHTML5.socket.emit('watch', chatHTML5.myUser.id, id, true);
        $('#webcamsContainer').show();
        var flashvars = {username: id, rtmp:chatHTML5.config.rtmp};
        var params = {allowfullscreen : 'true', menu : 'false', quality : 'best', scale : 'noscale', wmode : 'transparent', bgcolor:'FFF'};
        var attributes = {id : webcamid, name : webcamid, class:"webcamClass"};
        var webcamTemplate = sprintf('\
		<div data-id=%s class="webcamContainer">\
			<div class="webcamHeader">\
				<i class="fa fa-times pull-right webcamCloseBtn" title="%s"></i>\
				<span>%s</span>\
			</div>\
			<div id="%s" class="webcamSwfContainer">\
				<div class="allowFlash blink"><a href="https://www.adobe.com/go/getflashplayer"><i class="fa fa-exclamation-circle"></i> Enable Flash Player.<a/></div>\
			</div>\
		</div>',
            id, chatHTML5.traductions.close, username,  webcamid);

        if (chatHTML5.config.chatType=='tabAndWindow' || chatHTML5.config.chatType=='window') {
            var webcamTemplate = sprintf('\
		<div data-id=%s class="webcamContainer" style="width:100%%;height:100%%">\
			<div id="%s" class="webcamSwfContainer"></div>\
		</div>',
                id, webcamid);

            var user = chatHTML5.users[id];
            if (broadcast) {
                var message = (talks)?chatHTML5.traductions.talks:chatHTML5.traductions.broadcasting;
                var headerTitle = sprintf('%s <span class="blink">%s</span>', username, message);
                var offsetX = chatHTML5.getOffsetX();
                var offsetY = chatHTML5.getOffsetY();
            } else {
                var headerTitle = username;
                var offsetX = chatHTML5.getOffsetX();
                var offsetY = -150 + Math.ceil(Math.random()*150);
            }
            var header = sprintf('<span><img src="%s" class="userAvatar"></span> %s', user.image, headerTitle);
            $.jsPanel({
                selector: '#tabs',
                headerTitle: header,
                position: {
                    my: 'center',
                    at: 'center',
                    offsetX: offsetX,
                    offsetY: offsetY,
                },
                content:  webcamTemplate,
                contentSize: {width: chatHTML5.config.webcamWidth, height: chatHTML5.config.webcamHeight},
                headerControls: { iconfont: 'font-awesome', controls: 'closeonly' },
                resizable: {
                    handles:   'ne, se, sw, nw',
                    autoHide:  false,
                    minWidth:  160,
                    minHeight: 160,
                    aspectRatio: true
                },
                dragit: {
                    disableui:false,
                    containment: 'parent'
                },
                draggable: {
                    containment: "parent"
                },
                id:'_webcam_'+id
            });
        } else {
            $('#webcamsContainer').append(webcamTemplate);
            if ($("#webcamsContainer").children().length) {
                $('#tabs').css('height', 'calc(100% - 360px)');
            } else {
                $('#tabs').css('height', 'calc(100% - 285px)');
            }
            $('#chatContainer').css('height', 'calc(100% - 60px)');
        }
        var width = chatHTML5.config.webcamWidth;
        var height = chatHTML5.config.webcamHeight;
        if (chatHTML5.config.chatType=='tabAndWindow' || chatHTML5.config.chatType=='window') {
            width = '100%';
            height = '100%';
        }
        if (typeof swfobject!='undefined' && swfobject.hasFlashPlayerVersion('9')) {
            swfobject.embedSWF(chatHTML5.config.swfPath + 'player.swf', webcamid, width, height, '10.0.0', 'expressInstall.swf', flashvars, params, attributes);
        } else {
            if(Hls.isSupported()) {
                var width = chatHTML5.config.webcamWidth + 'px';
                var height = chatHTML5.config.webcamHeight + 'px';
                if (chatHTML5.config.chatType=='tabAndWindow' || chatHTML5.config.chatType=='window') {
                    width = '100%';
                    height = '100%';
                }

                var videoid = 'video_'+ id;
                var el = sprintf('<video id="%s" style="width: %s;height: %s"></video>', videoid, width, height);
                $('#'+webcamid).append(el);
                var video = document.getElementById(videoid);
                var hls = new Hls();
                var m3u8 = sprintf('/m3u8/%s.m3u8', id);
                //console.log('m3u8', m3u8);
                hls.loadSource(m3u8);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED,function() {
                    video.play();
                });
            }
        }
        chatHTML5.scrollActiveChatToBottom();
    };

    $(document).on('click tap touchstart', '.webcamCloseBtn', function(e) {
        var userid = $(this).parent().parent().data('id');
        chatHTML5.removeWebcam(userid);
    })

    this.playConference = function(user, value) {
        return;

        if (chatHTML5.myUser.username === user.username) {
            return;
        }
        if (value) {
            $('#conferenceWebcamContainer').show(100);
            var id = user.id;
            var webcamid = 'conference_'+ id;
            var flashvars = {username: id, rtmp:chatHTML5.config.rtmp};
            var params = {allowfullscreen : 'true', menu : 'false', quality : 'best', scale : 'noscale', wmode : 'transparent', bgcolor:'FFF'};
            var attributes = {id : webcamid, name : webcamid, class:'webcamConferenceClass'};
            $('#conferenceWebcamContainer').append('\
		<div id="conferenceWebcamDiv">\
			<div class="allowFlash blink"><a href="https://www.adobe.com/go/getflashplayer"><i class="fa fa-exclamation-circle"></i> Enable Flash Player.<a/></div>\
		</div>');
            if (typeof swfobject!='undefined' && swfobject.hasFlashPlayerVersion('9')) {
                swfobject.embedSWF(chatHTML5.config.swfPath + 'player.swf', 'conferenceWebcamDiv', '100%', chatHTML5.config.webcamHeight, '10.0.0', 'expressInstall.swf', flashvars, params, attributes);
            } else {
                swfobject.embedSWF(chatHTML5.config.swfPath + 'player.swf', 'conferenceWebcamDiv', '100%', chatHTML5.config.webcamHeight, '10.0.0', 'expressInstall.swf', flashvars, params, attributes);
            }
        } else {
            $('#conferenceWebcamContainer').hide(100);
            swfobject.removeSWF('conferenceWebcamDiv');
            $('#conferenceWebcamContainer').empty();
        }
        if (typeof swfobject!='undefined' && swfobject.hasFlashPlayerVersion('9') || chatHTML5.m) {
            $('.allowFlash').hide();
        } else {
            if(Hls.isSupported()) {
                var videoid = 'video_'+ id;
                var el = sprintf('<video id="%s" style="width: 100%%;"></video>', videoid);
                $('#'+webcamid).append(el);
                var video = document.getElementById(videoid);
                var hls = new Hls();
                var m3u8 = sprintf('/m3u8/%s.m3u8', id);
                //console.log('m3u8', m3u8);
                hls.loadSource(m3u8);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED,function() {
                    video.play();
                });
            }
        }
    }

    $(document).on('click','div.jsPanel-btn.jsPanel-btn-close', function(e) {
        var isWebcam = $(this).parent().parent().parent().parent().prop('id').indexOf('webcam_')>0;
        var id = $(this).parent().parent().parent().parent().prop('id').replaceAll('_webcam_','');
        chatHTML5.socket.emit('watch', chatHTML5.myUser.id, id, false);
        if (isWebcam) {
            chatHTML5.removeWebcam(id);
        }
    });

    $('#send-msg-btn').click(function(e) {
        chatHTML5.sendText();
    });

    $(document).on('click', '.muteBtn', function() {
        var id = $(this).data('id');
        chatHTML5.muted[id] = id;
        $(sprintf('div.userItem[data-id=%s]', id)).addClass('muted');
        $(this).parent().parent().remove();
    });

    $(document).on('click', '.refuseFriendBtn', function() {
        var friendid = $(this).data('id');
        $(this).parent().parent().remove();
        chatHTML5.socket.emit('refuseFriend', friendid);
    });

    $(document).on('click', '.denyBtn', function() {
        var id = $(this).data('id');
        $(this).parent().parent().remove();
        chatHTML5.socket.emit('privateDenied', id);
    });

    $(document).on('click', '.denyWatchHisWebcamBtn', function() {
        var id = $(this).data('id');
        $(this).parent().parent().remove();
        chatHTML5.socket.emit('watchHisWebcamDenied', id);
    });

    $('#chatContainer').on('click', 'button.denyRoomJoinBtn', function() {
        var id = $(this).data('id');
        $(this).parent().parent().remove();
        //chatHTML5.socket.emit('privateDenied', id);
    });

    $(document).on('click', '.roomJoinBtn', function() {
        var roomid = $(this).data('id');
        chatHTML5.enterRoom(roomid);
        $('a[href="#usersContainer2"]').tab('show');

        if (chatHTML5.myUser.isMobile && $('#usersContainer').hasClass('toggleWidth')) {
            $('#slide_block').click()
        }
    });

    $('#chatContainer').on('click', 'button.acceptRoomJoinBtn', function() {
        var roomid = $(this).data('roomid');
        $(this).parent().parent().remove();
        chatHTML5.closeAllTabs();
        chatHTML5.changeRoom(roomid);
    });

    $(document).on('click', '.acceptBtn', function() {
        var id = $(this).data('id');
        $(this).parent().parent().remove();
        chatHTML5.socket.emit('webcamAccepted', id);
    });


    $(document).on('click', '.acceptWatchHisWebcam', function() {
        var id = $(this).data('id');
        var user = chatHTML5.users[id];
        $(this).parent().parent().remove();
        if(user) {
            chatHTML5.addWebcam(id, removeTags(user.username), false, false);
        }
    });

    $(document).on('click', '.acceptPrivateBtn', function() {
        var id = $(this).data('id');
        $(this).parent().parent().remove();
        chatHTML5.socket.emit('privateAccepted', id, chatHTML5.config.chatType);
    });

    $(document).on('click', '.acceptFriendBtn', function() {
        var id = $(this).data('id');
        $(this).parent().parent().remove();
        chatHTML5.socket.emit('acceptFriend', id);
    });

    this.removeUser = function(user, disconnects) {
        let index = this.predictiveReadingUsers.indexOf(user.id);
        if (index > -1) {
            this.predictiveReadingUsers.splice(index, 1);
        }
        try {
            var callBackName = (chatHTML5.roles[user.role] || {}).JScallbackWhenLeaves;
            if (callBackName) {
                window[callBackName](user);
            }
        } catch(e) {
        }
        if (chatHTML5.config.chatType==='roulette') {
            if (user.id == chatHTML5.getCurrentTab().id) {
                chatHTML5.myUser.rouletteBusy = false;
                chatHTML5.socket.emit('changeUser', chatHTML5.myUser);
                chatHTML5.closeAllWebcams();
                chatHTML5.removeWebcam(user.id);
                $('#middleContainer video').remove();
            }
        }
        if (chatHTML5.config.chatType==='conference' && user.role=='performer') {
            //this.playConference(user, false);
            $('#conferenceWebcamContainer').empty();
        }
        var myRoomid = (chatHTML5.getCurrentTab() || {}).roomid;
        var hisRoomid = parseInt(user.room.id);
        if (!disconnects && (myRoomid!=hisRoomid)) {
            return;
        }
        try {
            var temp = sprintf("#userList div.userItem[data-id='%s']", user.id);
            $(temp).remove();
        } catch (e) {
        }

        if (chatHTML5.config.friendsManagment=='1' && disconnects) {
            temp = sprintf("#friendsList div.userItem[data-id='%s']", user.id);
            try {
                $(temp).remove();
                chatHTML5.updateFriendsOnlineNumber();
            }
            catch(e) {
            }
        }
        chatHTML5.removeWebcam(user.id);
        if (chatHTML5.config.closePrivateChatWhenUserLeaves=='1') {
            tabs.closeById(user.id);
            (chatHTML5.getPanelById(user.id) || {}).remove();
        } else {
            var $chat = chatHTML5.$getChat(user.id)
            try {
                var texte = sprintf(chatHTML5.traductions.userLeftPrivateChat, removeTags(user.username));
            } catch(e) {
                texte = '';
            }
            var className = 'privateClosed';
            $chat && $chat.append(sprintf('<div class="serverMessage %s">%s</div>', className, texte));
            if ($('#lockScrollBtn i:eq(1)').css('display') == 'none') {
                $chat && $chat[0] && $chat.animate({scrollTop: $chat[0].scrollHeight}, 200);
            }
            chatHTML5.scrollActiveChatToBottom();
        }
        var leaveMessage = sprintf(chatHTML5.traductions['XhasLeftTheChat'], removeTags(user.username));
        if ((chatHTML5.roles[user.role] || {}).isVisible=='1') {
            if (chatHTML5.config.displayLeaveChatMessage=='1') {
                chatHTML5.serverInfoMessageThatDiseappears(leaveMessage, 'leave', user.room.id);
                chatHTML5.playMP3(chatHTML5.config.soundUserLeavesChat);
            }
        }
        if (user.talks) {
            chatHTML5.currentTalkerid = 0;
        }

        delete(chatHTML5.users[user.id]);
        chatHTML5.updateNumberUsersDisplay();
    };

    $('#clearButton').click(function(e) {
        bootbox.confirm(chatHTML5.traductions["Confirm clear chat"], function(res) {
            if (res) {
                $('div.tab-content .tab-pane.active').eq(0).empty();
            }
        })
    });

    $('#fileElem').change(function(e) {
        var fileReader = new FileReader();
        var file = document.getElementById("fileElem").files[0];
        if (file) {
            var imageType = /image.*/;
            if (!file.type.match(imageType)) {
                bootbox.alert(chatHTML5.traductions.invalidImageType);
                return;
            }
            if (file.size>2000000) {
                bootbox.alert(chatHTML5.traductions.invalidImageSize);
                return;
            }
            fileReader.onload = function(e) {
                if ($('#fileElem').data('action')==='changeAvatar') {
                    chatHTML5.changeAvatar();
                }
            };
            fileReader.readAsDataURL(file);
        }
    });

    this.changeAvatar = async function() {
        chatHTML5.myUser.fingerprint = await chatHTML5.getFingerPrint();
        var xhr = new XMLHttpRequest();
        var formData = new FormData();
        var file = document.getElementById('fileElem').files[0];
        if (file) {
            var imageType = /image.*/;
            if (!file.type.match(imageType)) {
                bootbox.alert(chatHTML5.traductions.invalidImageType);
                return;
            }
            if (file.size>2000000) {
                bootbox.alert(chatHTML5.traductions.invalidImageSize);
                return;
            }
            formData.append('file', file);
        }
        var action = (chatHTML5.myUser.role=='guest')?'updateAvatarGuest':'updateAvatar';
        formData.append('a', action);
        formData.append('id', chatHTML5.myUser.id);
        formData.append('webmasterid', chatHTML5.myUser.webmasterid);
        formData.append('fingerprint', chatHTML5.myUser.fingerprint);
        formData.append('password', chatHTML5.myUser.password);
        formData.append('role', chatHTML5.myUser.role);

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                if (xhr.responseText==='ko') {
                    return;
                }
                $('#myAvatar img').prop('src', xhr.responseText);
                chatHTML5.myUser.image = xhr.responseText;
                chatHTML5.changeMyStatus();
            }
        };

        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                var percentage = Math.round((e.loaded * 100) / e.total);
                $('#progressbar').css('width', percentage + '%');
                $('#percentage').text(percentage + '%');
            }
        }, false);

        xhr.upload.addEventListener('loadstart', function(e){
            $('#progressbar').show();
        }, false);


        xhr.upload.addEventListener('load', function(e) {
            var res = e.currentTarget.responseText;
            $('#progressbar').hide();
            $('#percentage').text('100% Done');
        }, false);

        xhr.open('POST', chatHTML5.config.ajax);
        xhr.send(formData);
    };

    $('#calendarBtn').click(function(e) {
        $('#calendarContainer').toggle(100);
    });

    $('#clearSearch').click(function(e) {
        $('#searchInput').val('');
        $('.searchItem').remove();
        chatHTML5.searchUsers();
    });

    this.kickedFromRoom = function(message, roomid) {
        chatHTML5.socket.disconnect();
        bootbox.alert(message, function() {
            chatHTML5.getTabs().closeById('room_' + roomid);
        });
        setTimeout(function() {
            chatHTML5.getTabs().closeById('room_' + roomid);
        }, 5000);
    }
    this.kicked = function(message) {
        chatHTML5.socket.disconnect();
        bootbox.alert(message, function() {
            chatHTML5.redirectUrl(chatHTML5.config.quitUrl);
        });
        setTimeout(function() {
            chatHTML5.redirectUrl(chatHTML5.config.quitUrl);
        }, 5000);
    }

    this.changeMyStatus = function() {
        $('#myAvatar').removeClass('opacity50');
        var status = chatHTML5.myUser.status;
        if (chatHTML5.myUser.status==chatHTML5.traductions.online) {
            status = 'online';
        }
        if (chatHTML5.myUser.status==chatHTML5.traductions.offline) {
            status = 'offline';
        }
        if (chatHTML5.myUser.status==chatHTML5.traductions.busy) {
            status = 'busy';
        }
        if (chatHTML5.myUser.status.toLowerCase()==chatHTML5.traductions.invisible.toLowerCase()) {
            if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).invisibleMode=='0') {
                return;
            }

            status = 'invisible';
            $('#myAvatar').addClass('opacity50');
        }
        $('#myAvatar .status').removeClass('online').removeClass('offline').removeClass('busy').addClass(status);
        chatHTML5.myUser.status = status;
        localStorage.setItem('status', status);
        //{id:chatHTML5.myUser.id || '', webmasterid:chatHTML5.myUser.webmasterid, username:chatHTML5.myUser.username, status: status}
        chatHTML5.socket.emit('changeUser', chatHTML5.myUser);
    };



    $('#myAvatar').on('click', function(event) {
        $('.dropdown-toggle').dropdown('toggle');
        event.stopPropagation();
        //$('.menuUserItem').css( 'pointer-events', 'auto').css('opacity', '1');
        $('#myUserMenu').show();
        //var temp = sprintf(".menuUserItem[data-action='%s']", chatHTML5.myUser.status);
        //$(temp).css( 'pointer-events', 'auto').css('opacity', '0.3');
    });

    $(document).on('click', function(e) {
        $('#myUserMenu').hide();
    });

    $('#acceptPrivateCheckBox').change(function() {
        var value = $(this).prop('checked');
        //chatHTML5.myUser.privateOnlyOnInvitation = value;
        chatHTML5.myUser.doNotAcceptPrivate = value;
        chatHTML5.changeMyStatus();
    });

    this.isAlreadyInPrivateWith = function(userid) {
        var res =  (chatHTML5.getTabById(userid).length>0 || chatHTML5.getPanelById(userid).length>0);
        return res;
    };


    this.restoreState = function() {
        console.log('restoreState');

        if (chatHTML5.config.restoreChatSeconds=='0') {
            return;
        }
        var secondsSpent = Math.round((Date.now() - parseInt(localStorage.getItem('saveTime'))) / 1000);
        if (secondsSpent>parseInt(chatHTML5.config.restoreChatSeconds)) {
            return;
        }
        var acceptPrivateCheckBox = localStorage.getItem('acceptPrivateCheckBox');
        $('#acceptPrivateCheckBox').prop('checked', acceptPrivateCheckBox=='true').change();

        var soundCheckBox = localStorage.getItem('soundCheckBox');
        $('#soundCheckBox').prop('checked', soundCheckBox=='true').change();

        var webcamBtn = localStorage.getItem('webcamBtn');
        $('#webcamBtn').prop('checked', webcamBtn=='true').change();
        return;

        chatHTML5.roles[chatHTML5.myUser.role].webcamAutoStart = (webcamBtn=='true');
        chatHTML5.myUser.startRoom = (localStorage.getItem('currentRoomId') || 0);
        chatHTML5.myUser.roomsToEnter = (localStorage.getItem('roomsIn') || '').split(',');
        // remove the current room !
        chatHTML5.myUser.roomsToEnter.splice( chatHTML5.myUser.roomsToEnter.indexOf(chatHTML5.myUser.room.id), 1 );

    };

    window.onbeforeunload = function(evt) {
        localStorage.setItem('acceptPrivateCheckBox', $('#acceptPrivateCheckBox').prop('checked'));
        localStorage.setItem('soundCheckBox', $('#soundCheckBox').prop('checked'));
        localStorage.setItem('webcamBtn', $('#webcamBtn').prop('checked'));
        localStorage.setItem('roomsIn', chatHTML5.myUser.roomsIn);
        localStorage.setItem('currentRoomId', chatHTML5.myUser.room.id);
        localStorage.setItem('saveTime', Date.now());
        localStorage.setItem('rooms', JSON.stringify(chatHTML5.rooms));
    };

    // show menu
    $(document).on('click', '.userItem', async function(event) {
        event.stopPropagation();
        var username = removeTags($(this).data('username'));
        var id = $(this).data('id');
        if (username===undefined) {
            username = removeTags($(this).parent().find('[data-username]').data('username'));
            id = $(this).parent().find('[data-username]').data('id');
        }
        if (id == chatHTML5.myUser.id || username==removeTags(chatHTML5.myUser.username)) {
            return;
        }
        var allRoles = chatHTML5.roles;
        var myRole = allRoles[chatHTML5.myUser.role] || {};

        var hisUser = (chatHTML5.users[id] || {});
        var isUserOnline = Boolean(chatHTML5.users[id]);
        if (!isUserOnline) {
            var uid = $(this).parent().find('div.timeStamp').data('date');
            id = uid;
            console.log('uid', uid);
            await $.post(chatHTML5.config.ajax, {a:'getMessage', uid:uid}, function(res) {
                hisUser = JSON.parse(res) || {};
            });
        }

        var hisRole = allRoles[(hisUser || {}).role] || {};
        $('#userMenu').data('username', username);
        $('#userMenu').data('id', id);
        var profile = false;
        var userRole = '';
        var isMyRoom = chatHTML5.isMyRoom(chatHTML5.myUser.room.id);
        profile = (chatHTML5.users[id] || {}).profile;
        if (chatHTML5.myUser.role == 'admin') {
            hisRole.canBeMuted = hisRole.canBeMuted = hisRole.canUserMessagesDeleted = hisRole.canBeKicked = hisRole.canBeBanned = '1';
        }

        if (!profile) {
            profile = chatHTML5.config.profilePattern.replace('{username}', username).replace('{id}', id);
        }
        if (profile) {
            $('#userMenu div[data-action="profile"]').show();
        } else {
            $('#userMenu div[data-action="profile"]').hide();
        }

        if (chatHTML5.config.reportUserToAdmin=='1') {
            $('#userMenu div[data-action="reportUser"] span').text(sprintf(chatHTML5.traductions['Report User'], username));
        }
        if (myRole.canInviteToWatchCam=='1' && chatHTML5.myUser.webcam) {
            $('#userMenu div[data-action="inviteWatchCam"]').show()
        } else {
            $('#userMenu div[data-action="inviteWatchCam"]').hide();
        }
        if (chatHTML5.muted[id]) {
            $('#userMenu div[data-action="mute"] span').text(sprintf(chatHTML5.traductions.unmuteUser, username));
        } else {
            $('#userMenu div[data-action="mute"] span').text(sprintf(chatHTML5.traductions.muteUser, username));
        }
        if (isUserOnline && myRole.canMute=='1' && hisRole.canBeMuted=='1') {
            $('#userMenu div[data-action="mute"]').show();
        } else {
            $('#userMenu div[data-action="mute"]').hide();
        }
        if (isUserOnline && hisUser.webcam && myRole.canMuteWebcam=='1') {
            $('#userMenu div[data-action="muteWebcam"]').show();
        } else {
            $('#userMenu div[data-action="muteWebcam"]').hide();
        }

        if (isUserOnline && myRole.canCall1To1=='1' && hisRole.canBeCalled1To1=='1' && hisUser.status=='online') {
            $('#userMenu div[data-action="call1to1"]').show();
        } else {
            $('#userMenu div[data-action="call1to1"]').hide();
        }

        if (isMyRoom || (isUserOnline && myRole.canWhisper=='1')) {
            $('#userMenu div[data-action="whisper"]').show();
        } else {
            if (chatHTML5.config.guestTrialVersionOnly=='0') {
                $('#userMenu div[data-action="whisper"]').hide();
            }
        }

        $('#userMenu div[data-action="private"] span').text(sprintf(chatHTML5.traductions.privateWithX, username));

        // test if alerady in private

        if (isMyRoom || (isUserOnline && myRole.canAskPrivate=='1')) {
            $('#userMenu div[data-action="private"]').show();
        } else {
            if (chatHTML5.config.guestTrialVersionOnly=='0') {
                $('#userMenu div[data-action="private"]').hide();
            }
        }

        if (chatHTML5.isAlreadyInPrivateWith(id)) {
            $('#userMenu div[data-action="private"]').hide();
        }


        if (isMyRoom || (isUserOnline && myRole.canVoteContest=='1' && hisRole.role!='guest' && hisRole.canBeVotedContest=='1')) {
            $('#userMenu div[data-action="voteContest"]').show();
        } else {
            if (chatHTML5.config.guestTrialVersionOnly=='0') {
                $('#userMenu div[data-action="voteContest"]').hide();
            }
        }


        if (isMyRoom || (isUserOnline && myRole.canQuickMessage=='1')) {
            $('#userMenu div[data-action="quickPrivateMessage"]').show();
        } else {
            if (chatHTML5.config.guestTrialVersionOnly=='0') {
                $('#userMenu div[data-action="quickPrivateMessage"]').hide();
            }
        }

        var user = chatHTML5.users[id];

        if ( myRole.canAskFriend=='1' && isUserOnline && hisRole.canBeAskedAsFriend=='1') {
            var friendMenuText = '';
            if (chatHTML5.isMyFriendApproved(id)) {
                friendMenuText = sprintf('<i data-action="removeFriend" class="fa fa-thumbs-down"></i> %s', chatHTML5.traductions.removeFriend);
            } else if (chatHTML5.isMyFriendIneedToApprove(id)) {
                friendMenuText = sprintf('<i data-action="approveFriend" class="fa fa-handshake-o"></i> %s', chatHTML5.traductions.approveFriend);
            } else if (chatHTML5.isMyFriendIRequested(id)) {
                friendMenuText = sprintf('<i data-action="resendFriend" class="fa fa-refresh"></i> %s', chatHTML5.traductions.resendFriend);
            } else {
                friendMenuText = sprintf('<i data-action="requestFriend" class="fa fa-plus-circle"></i> %s', chatHTML5.traductions.requestFriend);
            }
            $('#userMenu div[data-action="friend"]').show();
            $('#userMenu div[data-action="friend"] span').html(friendMenuText);
        } else {
            if (chatHTML5.config.guestTrialVersionOnly=='0') {
                $('#userMenu div[data-action="friend"]').hide();
            } else {
                friendMenuText = sprintf('<i data-action="requestFriend" class="fa fa-plus-circle"></i> %s', chatHTML5.traductions.requestFriend)
                $('#userMenu div[data-action="friend"]').show();
                $('#userMenu div[data-action="friend"] span').html(friendMenuText);
            }
        }
        if (chatHTML5.getRoomsIOweNumber()) {
            $('div[data-action="inviteUserPrivateRoom"]').remove();
            var myRooms = chatHTML5.getRoomsIOwe();
            $.each(myRooms, function(roomid, myroom) {
                var el = sprintf('<div data-action="inviteUserPrivateRoom" data-userid="%s" data-roomid="%s" class="menuUserItem"><i class="fa fa-plus-square-o"></i> %s</div>' ,
                    id ,myroom.id,
                    sprintf(chatHTML5.traductions.inviteUserIntoPrivateRoom, username, myroom.name ));
                if (isUserOnline && (chatHTML5.myUser.room.name!=myroom.name)) {
                    $('#userMenu').append(el);
                }
            });
        }

        // admin functions

        if (myRole.canGetIP=='1' && isUserOnline) {
            $('#userMenu div[data-action="showIP"]').show();
        } else {
            $('#userMenu div[data-action="showIP"]').hide();
        }

        if (myRole.canDeleteUserMessages=='1' && hisRole.canUserMessagesDeleted=='1') {
            $('#userMenu div[data-action="deleteUserMessages"]').show();
        } else {
            $('#userMenu div[data-action="deleteUserMessages"]').hide();
        }
        if ((isUserOnline && myRole.canKick=='1' && hisRole.canBeKicked=='1')) {
            $('#userMenu div[data-action="kick"] span').text(sprintf(chatHTML5.traductions.kickUserX, username)).show();
            $('#userMenu div[data-action="kick"]').show();
        } else {
            $('#userMenu div[data-action="kick"]').hide();
        }

        if ((isUserOnline && isMyRoom && hisRole.canBeKicked=='1')) {
            $('#userMenu div[data-action="kickFromRoom"] span').text(sprintf(chatHTML5.traductions.kickUserXFromRoom, username, chatHTML5.myUser.room.name)).show();
            $('#userMenu div[data-action="kickFromRoom"]').show();
        } else {
            $('#userMenu div[data-action="kickFromRoom"]').hide();
        }

        if (myRole.canBan=='1' && hisRole.canBeBanned=='1') {
            $('#userMenu div[data-action="ban"] span').text(sprintf(chatHTML5.traductions.banUserX, username)).show();
            $('#userMenu div[data-action="ban"]').show();
        } else {
            $('#userMenu div[data-action="ban"]').hide();
        }

        if (isUserOnline && myRole.canMute=='1' && hisRole.canBeMutedPrison=='1') {
            $('#userMenu div[data-action="mutePrison"]').show();
        } else {
            $('#userMenu div[data-action="mutePrison"]').hide();
        }

        if (isUserOnline && myRole.canPromote=='1' && hisRole.canBePromoted=='1') {
            $('#userMenu div[data-action="promoteUser"]').show();
        } else {
            $('#userMenu div[data-action="promoteUser"]').hide();
        }

        // end admin functions

        var trigger = (window.innerHeight - event.pageY);
        var x = (event.pageX);
        if (window.innerWidth< (x+$('#userMenu').width())) {
            x = window.innerWidth - $('#userMenu').width();
        }

        var height = $('#userMenu').height();
        var offset = (trigger<height)?height:0;
        if (chatHTML5.isMobile() && $(window).width()<480) {
            var middleX = ($(window).width() / 2) - ($('#userMenu').width() / 2);
            var middleY = ($(window).height() / 2) - $('#userMenu').height() / 2;
            $('#userMenu').css('left', middleX).css('top', middleY).show();
        } else {
            var finalY = ((event.pageY-offset-60)<0)?0:(event.pageY-offset-60);
            $('#userMenu').css('left', x).css('top', finalY).show();
        }
        $('#userMenu div:visible').length ? $('#userMenu').show():$('#userMenu').hide();
        if (myRole.selectUserAndShowWebcam=='1') {
            $('div.userItem').removeClass('selectedUser');
            $(this).addClass('selectedUser');
            if (chatHTML5.myUser.webcam) {
                $('#webcamBtn').prop('checked', false).change();
            }
        }
    });

    $('#boldDiv, #italicDiv, #underlineDiv').click(function() {
        $(this).toggleClass('fontSelected');
    })

    $(document).on('click', function(e) {
        $('#userMenu').hide();
    });

    $(document).on('touchend', function(e) {
        var container = $('#userMenu');

        // if the target of the click isn't the container nor a descendant of the container
        if (!container.is(e.target) && container.has(e.target).length === 0)
        {
            container.hide();
        }

    });



    this.askPrivateInvitation = function(id, username) {
        var user = chatHTML5.users[id];
        if (chatHTML5.config.chatType==='tab' || chatHTML5.config.chatType==='tabAndWindow') {
            if ($('.nav-tabs:not(.nav-tabs-clone)').find('li').find('a[href="#'+id+'"]').length) {
                $('.nav-tabs:not(.nav-tabs-clone)').find('li').find('a[href="#'+id+'"]').click();
                return;
            } else {
                if (chatHTML5.users[id].privateOnlyOnInvitation) {
                    chatHTML5.sendPrivateInvitation(id, username);
                } else {
                    chatHTML5.addOrSelectPrivateChat(user, true);
                }
                return;
            }
        }
        if (chatHTML5.config.chatType==='window') {
            if ($('div.jsPanel#' + id).length) {
                $('div.jsPanel#' + id).click();
                return;
            } else {
                if (chatHTML5.users[id].privateOnlyOnInvitation) {
                    chatHTML5.sendPrivateInvitation(id, username);
                } else {
                    chatHTML5.addOrSelectPrivateChat(user, true);
                }
                return;
            }
        }
        chatHTML5.sendPrivateInvitation(id, username);
    };

    $('#banBtn').click(function(e) {
        let myRole = chatHTML5.roles[chatHTML5.myUser.role] || {};
        if (myRole.canBan!=='1') {
            return;
        }
        var id = $('#banModal').data('id');
        var minutes = $('#minutes').val();
        var description = $('#banDescription').val();
        chatHTML5.socket.emit('ban', id, minutes, description, chatHTML5.roles);
    });

    $('#mutePrisonBtn').click(function(e) {
        let myRole = chatHTML5.roles[chatHTML5.myUser.role] || {};
        if (myRole.canMutePrison!=='1') {
            return;
        }
        var id = $('#muteModal').data('id');
        var minutes = $('#minutesMute').val();
        var description = $('#muteDescription').val();
        var warnUserOfMute = $('#warnUserOfMute').prop('checked');
        chatHTML5.mutePrison(id, minutes, description, warnUserOfMute);
    });

    this.mutePrison = function(userid, minutes, description, warnUserOfMute) {
        let myRole = chatHTML5.roles[chatHTML5.myUser.role] || {};
        if (myRole.canMutePrison!=='1') {
            return;
        }
        chatHTML5.socket.emit('mute', userid, minutes, description, warnUserOfMute, chatHTML5.roles);
        var temp = sprintf('#userList div.userItem[data-id="%s"]', userid);
        $(temp).addClass('muted');
    };

    $('#lockScrollBtn').click(function() {
        $('#lockScrollBtn i').toggle();
    })

    function placeCaretAtEnd(el) {
        el.focus();
        if (typeof window.getSelection != 'undefined'
            && typeof document.createRange != 'undefined') {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange != 'undefined') {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(false);
            textRange.select();
        }
    }
    this.isSafari = function() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }


    this.getJailedUsers = function() {
        return new Promise(function(resolve, reject) {
            var allRoles = chatHTML5.roles;
            var myRole = allRoles[chatHTML5.myUser.role] || {};
            if (myRole.canMutePrison=='0') {
                resolve([]);
            }
            try {
                $.post(chatHTML5.config.ajax, {a: 'getJailed', webmasterid:chatHTML5.myUser.webmasterid}, function (jailedUsers) {
                    var jailedUsersArray = [];
                    jailedUsers = jailedUsers || [];
                    jailedUsers = JSON.parse(jailedUsers) || [];
                    for(var i=0;i<jailedUsers.length;i++) {
                        jailedUsersArray[jailedUsers[i]] = jailedUsers;
                    }
                    resolve(jailedUsersArray);
                });
            }catch(e) {
                resolve([]);
            }
        });
    }


    this.getMutedUsers = function() {
        return new Promise(function(resolve, reject) {
            var allRoles = chatHTML5.roles;
            var myRole = allRoles[chatHTML5.myUser.role] || {};
            if (myRole.canMute=='0') {
                resolve([]);
            }
            try {
                $.post(chatHTML5.config.ajax, {a: 'getMuted', webmasterid:chatHTML5.myUser.webmasterid, userid:chatHTML5.myUser.id}, function (mutedUsersres) {
                    var mutedUsers = [];
                    mutedUsersres = mutedUsersres || [];
                    mutedUsersres = JSON.parse(mutedUsersres) || [];
                    for(var i=0;i<mutedUsersres.length;i++) {
                        mutedUsers[mutedUsersres[i]] = mutedUsersres[i];
                    }
                    resolve(mutedUsers);
                });
            }catch(e) {
                resolve([]);
            }

        });
    }

    this.mute = function(id, username) {
        try {
            var hisRole = (chatHTML5.users[id] || {}).role;
            if (chatHTML5.roles[hisRole].canBeMuted=='0') {
                return;
            }
        } catch(e) {
            return;
        }
        $('#userMenu').hide();
        $(sprintf('.userItem[data-id=%s]', id)).toggleClass('muted');
        if ($(sprintf('.userItem[data-id=%s]', id)).hasClass('muted')) {
            if (!chatHTML5.muted[id]) {
                chatHTML5.muted[id] = id;
            }
            if (chatHTML5.myUser.role!='guest' && hisRole!='guest') {
                $.post(chatHTML5.config.ajax, {a: 'mute', webmasterid:chatHTML5.myUser.webmasterid, muteduserid:id, userid:chatHTML5.myUser.id}, function (res) {
                    console.log(res);
                });
            }
        } else {
            delete chatHTML5.muted[id];
            if (chatHTML5.myUser.role!='guest' && hisRole!='guest') {
                $.post(chatHTML5.config.ajax, {a: 'unmute', webmasterid:chatHTML5.myUser.webmasterid, muteduserid:id, userid:chatHTML5.myUser.id}, function (res) {
                    console.log(res);
                });
            }
        }
    };

    this.showCall1to1LightBox = function(user, playMP3, endtimeOut) {
        if (chatHTML5.config.webrtcServer=='janus' && !chatHTML5.myUser.janusPublished && chatHTML5.config.streamIfWatched=='1') {
            var publish = {request: 'configure', audio: true, video: true};
            sfu.send({message: publish, jsep: chatHTML5.myUser.jsep});
            chatHTML5.myUser.janusPublished = true;
        } else if (chatHTML5.config.webrtcServer=='mediasoup') {
            if (!publishing) {
                startPublish();
            }
        }
        // close webcam on ALL users !
        $('#lightBox1to1').show();
        $('#myVideo').appendTo('#lightBox1to1');
        $("#myVideo")[0].play();
        $('#username1to1Call').text(sprintf(chatHTML5.traductions.callingUser, removeTags(user.username)));
        if (playMP3) {
            chatHTML5.playMP3(chatHTML5.config.waitPhoneMP3);
        }
        chatHTML5.myUser.calling1to1User = user;
        $('username1to1Call').text(sprintf(chatHTML5.traductions.callingUser), removeTags(user.username)).show();
        $('#waitingCall').fadeIn(1000);
        $('#header1to1Call img').show(1000);
        $('#hisVideo1to1Container video').remove();
        if (endtimeOut) {
            chatHTML5.myUser.calling1to1Interval = setInterval(function () {
                chatHTML5.call1to1Ended(user, true);
            }, parseInt(chatHTML5.config.call1to1TimeOut) * 1000);
        }
    };

    this.call1to1 = function (userid) {
        if (!chatHTML5.myUser.webcam) {
            bootbox.alert(chatHTML5.traductions.youNeedWebcamForExclusiveChat);
            return;
        }
        chatHTML5.socket.emit('call1to1', userid);
        chatHTML5.webcamContainer = $('#myVideo').parent();
        var user = (chatHTML5.users[userid] || {});
        chatHTML5.showCall1to1LightBox(user, true, true);
    };

    $(document).on('click', '.denyCall1to1Btn', function() {
        var userid = $(this).data('id');
        $(this).parent().parent().remove();
        chatHTML5.socket.emit('call1to1Refused', userid);
    });

    $(document).on('click', '.acceptCall1to1Btn', function() {
        var userid = $(this).data('id');
        var user = chatHTML5.users[userid];
        if (!user) {
            return;
        }
        $(this).parent().parent().remove();
        chatHTML5.soundMP3.pause();
        clearInterval(chatHTML5.myUser.calling1to1Interval);
        $('#username1to1Call').text(removeTags(user.username));
        $('#waitingCall').fadeOut(1000);
        $('#header1to1Call img').hide(1000);
        chatHTML5.webcamContainer = $('#myVideo').parent();
        $('#myVideo').appendTo('#lightBox1to1');
        if (!chatHTML5.myUser.webcam) {
            bootbox.confirm({
                message: chatHTML5.traductions.youMustSwitchWebcamOn,
                buttons: {
                    confirm: {
                        label: chatHTML5.traductions.switchWebcamAndAcceptCall,
                        className: 'btn-success'
                    },
                    cancel: {
                        label:  chatHTML5.traductions.denyCall,
                        className: 'btn-danger'
                    }
                },
                callback: function (res) {
                    if (res) {
                        webrtcPublished = jQuery.Deferred();
                        $('#webcamBtn').prop('checked', true).change();
                        jQuery.when( webrtcPublished ).done(function ( res ) {
                            console.log('webrtcPublished', res);
                            if (res) {
                                chatHTML5.webcamContainer = $('#myVideo').parent();
                                chatHTML5.showCall1to1LightBox(user, false, false);
                                chatHTML5.socket.emit('call1to1Accepted', userid);
                            } else {
                                chatHTML5.call1to1Ended(user, false);
                            }
                        });
                    } else {
                        clearInterval(chatHTML5.myUser.calling1to1Interval);
                        chatHTML5.socket.emit('call1to1Refused', user.id);
                        chatHTML5.call1to1Ended(user, false);
                    }
                }
            });
        } else {
            chatHTML5.showCall1to1LightBox(user, false, false);
            chatHTML5.socket.emit('call1to1Accepted', userid);
        }
    });


    this.call1to1Ended = function (user, timeOut) {
        chatHTML5.soundMP3.pause();
        $('#lightBox1to1').hide();
        $('username1to1Call').hide();
        $('#header1to1Call img').hide();
        $('#myVideo').appendTo(chatHTML5.webcamContainer);
        //chatHTML5.displayMyWebcam(false);

        setTimeout(function() {
            chatHTML5.displayMyWebcam(true);
        }, 2000)

        clearInterval(chatHTML5.myUser.calling1to1Interval);
        if (timeOut) {
            bootbox.alert(sprintf(chatHTML5.traductions.didNotAnswer, removeTags(user.username)));
            return;
        } else {
            bootbox.alert(sprintf(chatHTML5.traductions.call1to1Ended, removeTags(user.username)));
        }
        chatHTML5.myUser.status = 'online';
        chatHTML5.changeMyStatus();
    }

    $('#call1to1EndedBtn').click(function() {
        clearInterval(chatHTML5.myUser.calling1to1Interval);
        chatHTML5.socket.emit('call1to1Ended', chatHTML5.myUser.calling1to1User.id, false);
    })


    $('#userMenu, ul.dropdown-menu').on('click', '.menuUserItem', async function(e) {
        var action = $(this).data('action');
        var username;
        var id;
        switch (action) {
            case 'muteWebcam':
                var userid = $(this).parent().data('id');
                chatHTML5.socket.emit('muteWebcam', userid);
                break;

            case 'voteContest':
                var user2id = $(this).parent().data('id');
                bootbox.confirm(chatHTML5.traductions["Are you sure to vote"], function(res){
                    if (!res) {
                        return;
                    }
                    chatHTML5.socket.emit('voteContest', user2id);

                })
                break;
            case 'inviteUserPrivateRoom':
                var userid = $(this).data('userid');
                var roomid = $(this).data('roomid');
                //console.log('inviteUserPrivateRoom', userid, roomid);
                chatHTML5.socket.emit('inviteUserPrivateRoom', userid, roomid);
                break;

            case 'friend':
                if (!chatHTML5.checkAllowed('canAskFriend')) {
                    return;
                }
                var friendid = $(this).parent().data('id');
                var username = removeTags($(this).parent().data('username'));
                var action2 = $(this).find('i').data('action');

                switch (action2)  {
                    case 'requestFriend':
                        chatHTML5.sendFriendRequest(friendid, username);
                        break;

                    case 'resendFriend':
                        chatHTML5.sendFriendRequest(friendid, username);
                        break;

                    case 'removeFriend':
                        bootbox.confirm(sprintf(chatHTML5.traductions.removeUserFromFriends, username), function(res) {
                            if (res) {
                                chatHTML5.socket.emit('deleteFriend', friendid);
                            }
                        })
                        break;
                }
                break;

            case 'call1to1':
                var userid = $(this).parent().data('id');
                if (!chatHTML5.checkMinorAllowed(userid)) {
                    return;
                }
                if (!chatHTML5.myUser.webcam) {
                    bootbox.alert(chatHTML5.traductions.youNeedWebcamForExclusiveChat);
                    return;
                }
                chatHTML5.call1to1(userid);
                break;

            case 'showIP':
                var id = $(this).parent().data('id');
                if ((chatHTML5.roles[chatHTML5.myUser.role] || {}).canGetIP=='1') {
                    chatHTML5.socket.emit('getIP', id);
                }
                break;
            case 'inviteWatchCam':
                var id = $(this).parent().data('id');
                var user = chatHTML5.users[id];
                if (user) {
                    chatHTML5.socket.emit('inviteWatchCam', id);
                    var message = sprintf('<i class="fa fa-comment"></i> %s ', sprintf(chatHTML5.traductions.youRequestedUserToWatchYourCam, user.username));
                    chatHTML5.serverInfoMessageThatDiseappears(message,'leave', user.room.id);
                }
                break;

            case 'reportUser':
                chatHTML5.reportUsername = removeTags($(this).parent().data('username'));
                $('#reportModalTitle').text(sprintf(chatHTML5.traductions['Report User'], chatHTML5.reportUsername));
                $('#reportModal').modal('show');
                break;

            case 'seeMyProfile':
                var profile = (chatHTML5.users[chatHTML5.myUser.id] || {}).profile;
                if (!profile) {
                    profile = chatHTML5.config.profilePattern.replace('{username}', chatHTML5.myUser.username).replace('{id}', chatHTML5.myUser.id);
                }
                if (profile) {
                    window.open(profile);
                }
                break;
            case 'quitAndDisconnect':
                chatHTML5.redirectUrl(config.urlQuitAndDisconnect);
                break;
            case 'quit':
                chatHTML5.redirectUrl(config.quitUrl);
                break;
            case 'help':
                window.open(config.helpUrl);
                break;
            case 'deleteUserMessages':
                username = removeTags($(this).parent().data('username'));
                chatHTML5.socket.emit('deleteUserMessages', username);
                break;
            case 'avatar':
                $('#fileElem').data('action', 'changeAvatar');
                $('#fileElem').click();
                break;
            case 'online':
                chatHTML5.myUser.status = action;
                chatHTML5.changeMyStatus();
                break;
            case 'offline':
                chatHTML5.myUser.status = action;
                chatHTML5.changeMyStatus();
                break;
            case 'busy':
                chatHTML5.myUser.status = action;
                chatHTML5.changeMyStatus();
                break;
            case 'invisible':
                chatHTML5.myUser.status = action;
                chatHTML5.changeMyStatus();
                break;

            case 'private':
                username = removeTags($(this).parent().data('username'));
                id = $(this).parent().data('id');
                //console.log('private', id);
                $('#userMenu').hide();
                if (chatHTML5.config.chatType==='conference') {
                    var cost = (chatHTML5.users[id] || {}).ppv_pricePerMinute;
                    var message = sprintf(chatHTML5.traductions['Private chat costs is'], cost);
                    bootbox.confirm(message, function(res) {
                        if (res) {
                            chatHTML5.askPrivateInvitation(id, removeTags(username));
                        }
                    })
                } else {
                    chatHTML5.askPrivateInvitation(id, removeTags(username));
                }
                if (chatHTML5.isMobile()) {
                    if ($('#usersContainer').hasClass('toggleWidth')) {
                        $('.slide_block').click();
                    }
                    if (!chatHTML5.isSafari()) {
                        placeCaretAtEnd($('.emojionearea-editor')[0]);
                    }
                }
                break;

            case 'whisper':
                id = $(this).parent().data('id');
                if (!chatHTML5.checkMinorAllowed(id)) {
                    return;
                }
                if (!chatHTML5.checkAllowed('canWhisper')) {
                    return;
                }
                username = removeTags($(this).parent().data('username'));
                id = $(this).parent().data('id');
                var user = chatHTML5.users[id];
                if (user) {
                    chatHTML5.addUserToWhisper(user);
                }
                //chatHTML5.emojiArea[0].emojioneArea.setText('#' + username + ' : ');
                placeCaretAtEnd($('.emojionearea-editor')[0]);
                if (chatHTML5.isMobile()) {
                    if ($('#usersContainer').hasClass('toggleWidth')) {
                        $('.slide_block').click();
                    }
                    if (!chatHTML5.isSafari()) {
                        placeCaretAtEnd($('.emojionearea-editor')[0]);
                    }
                }
                break;
            case 'quickPrivateMessage':
                if (!chatHTML5.checkAllowed('canQuickMessage')) {
                    return;
                }
                username = removeTags($(this).parent().data('username'));
                //chatHTML5.emojiArea[0].emojioneArea.setText('@' + username +' : ');
                id = $(this).parent().data('id');
                var user = chatHTML5.users[id];
                if (user) {
                    chatHTML5.addUserToMention(user);
                }
                placeCaretAtEnd($('.emojionearea-editor')[0]);
                if (chatHTML5.isMobile()) {
                    if ($('#usersContainer').hasClass('toggleWidth')) {
                        if ($('#usersContainer').hasClass('toggleWidth')) {
                            $('.slide_block').click();
                        }
                    }
                    if (!chatHTML5.isSafari()) {
                        placeCaretAtEnd($('.emojionearea-editor')[0]);
                    }
                }
                break;

            case 'profile':
                var id = $(this).parent().data('id');
                var username = removeTags($(this).parent().data('username'));
                var profile = (chatHTML5.users[id] || {}).profile;

                if (!profile) {
                    profile = chatHTML5.config.profilePattern.replace('{username}', username).replace('{id}', id);
                }
                if (profile) {
                    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
                    if (base64regex.test(profile)) {
                        window.open(atob(profile));
                    } else {
                        window.open(profile);
                    }
                }
                break;

            case 'mute':
                username = removeTags($(this).parent().data('username'));
                id = $(this).parent().data('id');
                chatHTML5.mute(id, username);
                break;
            case 'kick':
                username = removeTags($(this).parent().data('username'));
                id = $(this).parent().data('id');
                try {
                    if ((chatHTML5.roles[chatHTML5.users[id].role] || {}).canBeKicked=='0') {
                        return;
                    }
                } catch(e) {
                    return;
                }
                bootbox.confirm(`${chatHTML5.traductions.confirmKick} : <b>${username}</b> ?` , function(res) {
                    if (!res) {
                        return;
                    }
                    $('#userMenu').hide();
                    chatHTML5.socket.emit('kick', id, chatHTML5.roles);
                    var message = sprintf(chatHTML5.traductions.youJustKickedX, username);
                    chatHTML5.serverInfoMessageThatDiseappears(message, 'serverMessageKick', chatHTML5.myUser.roomid );
                })
                break;
            case 'kickFromRoom':
                username = removeTags($(this).parent().data('username'));
                id = $(this).parent().data('id');
                try {
                    if ((chatHTML5.roles[chatHTML5.users[id].role] || {}).canBeKicked=='0') {
                        return;
                    }
                } catch(e) {
                    return;
                }
                bootbox.confirm(chatHTML5.traductions.confirmKick, function(res) {
                    if (!res) {
                        return;
                    }
                    $('#userMenu').hide();
                    chatHTML5.socket.emit('kickFromRoom', id, chatHTML5.myUser.room.id);
                    var message = sprintf(chatHTML5.traductions.youJustKickedX, username);
                    chatHTML5.serverInfoMessageThatDiseappears(message, 'serverMessageKick', chatHTML5.myUser.roomid );
                })
                break;

            case 'ban':
                username = removeTags($(this).parent().data('username'));
                id = $(this).parent().data('id');
                var user = chatHTML5.users[id];
                if (!user) {
                    await $.post(chatHTML5.config.ajax, {a:'getMessage', uid:id}, function(res) {
                        user = JSON.parse(res) || {};
                    });
                }

                try {
                    if ((chatHTML5.roles[user.role] || {}).canBeBanned=='0') {
                        return;
                    }
                } catch(e) {
                    return;
                }
                $('#userMenu').hide();
                $('#banModal').modal('show');
                $('#banModal').data('id', id).data('username', username);
                var title = sprintf(chatHTML5.traductions.banUserX, username);
                $('#banModal #banChatTitle').text(title);
                break;

            case 'promoteUser':
                username = removeTags($(this).parent().data('username'));
                id = $(this).parent().data('id');
                try {
                    if ((chatHTML5.roles[chatHTML5.users[id].role] || {}).canBePromoted=='0') {
                        return;
                    }
                } catch(e) {
                    return;
                }
                $('#userMenu').hide();
                $('#rolePromoteModal').modal('show');
                $('#rolePromoteModal').data('userid', id).data('username', username);
                var title = sprintf(chatHTML5.traductions.promoteUserX, username, chatHTML5.myUser.room.name);
                $('#rolePromoteModal #promoteUserUsername').text(title);
                break;

            case 'mutePrison':
                username = removeTags($(this).parent().data('username'));
                id = $(this).parent().data('id');
                try {
                    if ((chatHTML5.roles[chatHTML5.users[id].role] || {}).canBeMutedPrison=='0') {
                        return;
                    }
                } catch(e) {
                    return;
                }
                $('#userMenu').hide();
                $('#muteModal').modal('show');
                $('#muteModal').data('id', id).data('username', username);
                var title = sprintf(chatHTML5.traductions.jailUserX, username);
                $('#muteModal #muteTitle').text(title);
                break;

            case 'userInfo':
                var sc = chatHTML5.config.showUserInfoDataUrlOrJavascript;
                username = removeTags($(this).parent().data('username'));
                sc = sc.replaceAll('{username}', username);
                window.open(sc);
                break;


        }
        $('#myUserMenu').hide();
    });



    this.reportUser = function(usernameProblem, email, description, reportReason) {
        bootbox.confirm(chatHTML5.traductions.confirm, function(res){
            if (!res) {
                return;
            }
            $.post(chatHTML5.config.ajax, {a:'report', usernameProblem:usernameProblem, usernameAuthor:chatHTML5.myUser.username,  email:email, description: description, reportReason:reportReason}, function(res) {
                bootbox.alert(chatHTML5.traductions['Report Send to Admin']);
                $('#reportDescription').val('');
                $('#reportEmail').val('')
            });
        })
    }

    this.startIntro = function() {
        var welcomeMessage = '';
        var regex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
        var intro = introJs();

        intro.setOptions({
            steps: [
                {
                    element: '#menuChat',
                    intro: "This is a <b>public chat</b> about one topic or about a website.",
                    position:'top'
                }
            ]
        });
        intro.start();
    };

    $('#quitBtn, #customExit').click(function(e) {
        bootbox.confirm(chatHTML5.traductions.quitChat, function(result) {
            if (!result) {
                return;
            }
            chatHTML5.redirectUrl(config.quitUrl);
        });
    });

    $('#djBtn').click(function() {
        bootbox.prompt('Enter url youtube', function(url) {
            if (!url) {
                return;
            }
            try {
                var regex = /\/\/youtu.be\/(.*)/gm;
                var res = regex.exec(url);
                videoid = res[1];
                if (videoid) {
                    chatHTML5.socket.emit('playYoutube', videoid);
                    return;
                }
            } catch(e) {
            }

            try {
                var videoid = url.split('v=')[1].substring(0, 11);
                if (videoid) {
                    chatHTML5.socket.emit('playYoutube', videoid);
                }

            } catch (e) {

            }
            if (!videoid) {
                bootbox.alert('Error in youtube url');
            }

        })
    });

    this.playYoutubeQuiz = function(videoid) {
        if ($('#youtubeDisableCheckbox').prop('checked')) {
            return;
        }
        if (!$('#soundCheckBox').prop('checked')) {
            return;
        }
        //$('#youtubeQuiz').empty().css('height', '100px').show();
        //youtube = 'PKB4cioGs98';
        var el = sprintf('<iframe allow="autoplay" id="youTubeFrameQuiz" width="100%%" height="100%%" src="https://www.youtube.com/embed/%s?autoplay=1" frameborder="0"  allowfullscreen></iframe>', videoid);
        $('#youtubeQuiz').empty().append(el);
    };

    this.playYoutube = function(videoid, userYoutubeLinkDisplayInChat) {
        if ($('#youtubeDisableCheckbox').prop('checked')) {
            return;
        }
        if (!$('#soundCheckBox').prop('checked')) {
            return;
        }
        var el = sprintf('<iframe allow="autoplay" class="youTubeFrame" width="100%%" height="100%%" src="https://www.youtube.com/embed/%s?autoplay=1" frameborder="0" allowfullscreen></iframe>', videoid);
        if (userYoutubeLinkDisplayInChat) {
            el = sprintf('<div class="youtubeMessage">%s<button class="btn btn-danger btn-sm btnYoutubeCloseMessage">%s</button></div>',
                el, chatHTML5.traductions.close);

            chatHTML5.serverMessageCurrentTab(el, 'youtubeMessage');
        } else {
            $('#youtubeWrap').show();
            $('#youtubeContainer').empty().css('height', '150px');
            //youtube = 'PKB4cioGs98';
            $('#youtubeContainer').empty().append(el);
        }
    }

    $('#tabs').on('click', 'button.btnYoutubeCloseMessage', function(e) {
        $(this).parent().parent().remove();
    })


    this.refreshChatRemoveExtraScrolls = function() {
        var $elDom = $('div.tab-content .tab-pane.active').eq(0)
        $elDom.attr('overflow', 'auto');
        setTimeout(function(){
            $elDom.attr('overflow', 'hidden');
        },1);
    }

    this.getRSS = function() {
        try {
            $.post(chatHTML5.config.ajax, {a: 'getRSS', webmasterid: chatHTML5.myUser.webmasterid}, function (rss) {
                if (rss) {
                    chatHTML5.rss = JSON.parse(rss);
                    if (!rss) return;
                    chatHTML5.displayRSSinCurrentRoom('left');
                }
            });
        } catch(e) {
        }
    }

    this.displayRSSinCurrentRoom = function(direction) {
        try {
            if (navigator.appVersion.indexOf('Edge') != -1) {
                return;
            }

            var rss = '';
            var currentRoomid = chatHTML5.myUser.room.id;
            if (chatHTML5.rss[currentRoomid]) {
                rss = chatHTML5.rss[currentRoomid];
            } else if (chatHTML5.rss[0]) {
                rss = chatHTML5.rss[0];
            }
            if (chatHTML5.currentRSS != rss) {
                chatHTML5.currentRSS = rss;
                var duration = rss.length * 40 ;
                $('#marquee').html(rss);
                var options = {
                    speed:80,
                    direction: direction,
                    pauseOnHover:true
                };
                $('#marquee').marquee(
                    options
                );
            }
        } catch(e) {
        }
    };

    this.getNews = function() {
        $.post(chatHTML5.config.ajax, {a:'getNews', webmasterid:chatHTML5.myUser.webmasterid}, function (news) {
            if (!news) return;
            chatHTML5.news = JSON.parse(news) || [];
            for (var i=0;i<chatHTML5.news.length;i++) {
                var aNew = chatHTML5.news[i];
                window.newsInterval = [];
                if (aNew.isPopup=='0') {
                    window.newsInterval[i] = setInterval(function(currentNews) {
                        var d = new Date();
                        var dateText = d.toTimeString().split(' ')[0];
                        var display = true;
                        if (currentNews.startHour && !(dateText>currentNews.startHour && dateText<currentNews.endHour)) {
                            display = false;
                        }
                        if(display) {
                            chatHTML5.serverMessage(currentNews.news, 'news');
                        }
                        //console.log('interval display:', display);
                    }, parseInt(aNew.display_news_minutes) * 60 * 1000, aNew); //
                } else {
                    bootbox.alert(aNew.news)
                }
            }
        })
    };
    this.getFingerPrint = function() {
        hashCode = function(s){
            return s.split('').reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
        };
        return new Promise(function(resolve, reject) {
            Fingerprint2.getV18(function (result) {
                resolve(hashCode(result));
            });
        });
    };

    this.fillRooms = function(callBack) {
        $.post(chatHTML5.config.ajax, {a: 'getRooms'}, function(rooms) {
            rooms = JSON.parse(rooms);
            chatHTML5.rooms = {};
            $('#tableRoomBody').empty();
            var passwordProtected;
            var trClass;
            for(var index in rooms) {
                var room = rooms[index];
                chatHTML5.rooms[room.id] = room;
                passwordProtected = (room.isPasswordProtected==='1')?passwordProtected = ' <i class="fa fa-unlock-alt"></i> ':passwordProtected = '';
                trClass = (room.id===chatHTML5.myUser.room.id)?'activeRoom':'';

                var button = sprintf('<button type="button" data-id="%s" class="btn btn-info roomJoinBtn pull-right">%s<i class="fa fa-sign-in"></i> %s</button>',
                    room.id, passwordProtected, chatHTML5.traductions.join);
                var image = (room.image) ? sprintf('<img src="/upload/rooms/%s">', room.image): '';
                var row = sprintf('\
			<tr data-id="%s" data-name="%s" class="%s">\
				<td>%s</td>\
				<td>%s</td>\
				<td>%s</td>\
			</tr>',
                    room.name, trClass, image, room.name, room.users, button );
                $('#tableRoomBody').append(row);
            }
            if (typeof callBack == 'function') {
                callBack(rooms);
            }

        });
    };

    $('#roomsBtn').click(function(e) {
        chatHTML5.socket.emit('getRooms');
        if (chatHTML5.isMobile() && $('#slide_block').hasClass('opened')) {
            $('#slide_block').click();
        }
        $('#roomsModal').modal('show');
    });


    $('.toggleSize').click(function(e) {
        $('#usersContainer').toggle(200);
        if ($('.toggleSize i').hasClass('fa-caret-square-o-right')){
            $('.toggleSize i').removeClass('fa-caret-square-o-right').addClass('fa-caret-square-o-left');
            $('#chatContainer').css('paddingRight', '0');$('#footer').css('right', '0');
        } else {
            $('.toggleSize i').removeClass('fa-caret-square-o-left').addClass('fa-caret-square-o-right');
            $('#chatContainer').css('paddingRight', '365px');			$('#footer').css('right', '365px');
        }
    });

    $(document).on('click','.smileyItem', function(e) {
        var smiley = $(this).data("smiley");
        $("#smileyContainer").slideToggle(250);
        //console.log(e);

        var texte = $(e.currentTarget).parent().parent().find("textarea").val();
        $(e.currentTarget).parent().parent().find("textarea").val(texte + smiley).focus();
    });

}//endchat

function setFirstTabActive() {
    $('.zg-ul-select li:first-of-type').addClass('active');
};

$(document).on('tabClosed', function(e, tab) {
    if(tab.room) {
        chatHTML5.socket.emit('userLeaveRoom', tab.roomid);
    } else {
        if (chatHTML5.config.privateClosesWhenOneUserClosesPrivate=='1') {
            chatHTML5.socket.emit('privateClosed', tab.id);
        }
    }
    setFirstTabActive();
});

resizeWindow = function() {
    if ($(window).width() > 850 ) {
        $('body').addClass('open');
    } else {
        $('body').removeClass('open');
    }
};



$.fn.ulSelect = function(){
    var ul = $(this);
    if (!ul.hasClass('zg-ul-select')) {
        ul.addClass('zg-ul-select');
    }
    setFirstTabActive();

    $(this).on('click', 'li', function(event) {
        var href = $(this).find('a').attr('href');
        var link = $('#tabs .nav-tabs:not(.nav-tabs-clone)').find('a[href="'+href+'"]');
        if (link.length > 0) {
            link.click();
        }

        if ($('#selected--zg-ul-select').length) {
            $('#selected--zg-ul-select').remove();
        }

        ul.before('<div id="selected--zg-ul-select">');
        var selected = $('#selected--zg-ul-select');
        $('li #ul-arrow', ul).remove();
        ul.toggleClass('active');

        ul.children().removeClass('active');
        $(this).toggleClass('active');

        var selectedText = $(this).html();
        if (ul.hasClass('active')) {
            selected.html(selectedText).addClass('active');
        } else {
            selected.html('').removeClass('active');
            $('li.active', ul);
        }
    });

    $(document).on('click', function(event){
        if($('ul.zg-ul-select').length) {
            if(!$('ul.zg-ul-select').has(event.target).length == 0) {
                return;
            } else {
                $('ul.zg-ul-select').removeClass('active');
                $('#selected--zg-ul-select').removeClass('active').html('');
                $('#ul-arrow').remove();
            }
        }
    });
}

$('body').on('contextmenu', 'img', function(e) {
    return false;
});


// slide block
$(document).ready(function() {
    $('[title]').tooltip({
        placement:'auto',
        container: 'body'
    });
    $('body').on('contextmenu', 'img', function(e) {
        return false;
    });
    if ($(window).width() < 500) {
        var text = 'Choose chat:';
        $('#tabs .nav-tabs').before('<div class="mobile-text-lobby">'+text+'</div>');

        var ul = $('#tabs .nav-tabs').clone();
        ul.addClass('nav-tabs-clone');

        $('#tabs .nav-tabs').after(ul);
        ul.ulSelect();
    }

    if (!$('#chatAndUserContainer').length) {
        $('.slide_block').on('click', function(){
            $('body').toggleClass('open');
        });
        resizeWindow();
        $(window).resize(function(){
            resizeWindow();
        });
    } else {
        //flex
        $('#slide_block').on('click', function(){
            $('#usersContainer').toggleClass('toggleWidth');
            $('#chatContainer').toggleClass('opacity0');
            $('#slide_block').toggleClass('opened');
            if (chatHTML5.isMobile() && chatHTML5.config.chatType == 'tab') {
                if ($('#slide_block').hasClass('opened')) {
                    $('div.webcamContainer.noFloat').hide();
                } else {
                    $('div.webcamContainer.noFloat').show();
                }
            }
        });
    }
});
window.addEventListener('unload', function() {
    if (typeof sfu!='undefined' && sfu!=null) {
        sfu.hangup();
    }
});

function createCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
};

function readCookie(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
};

function eraseCookie(name) {
    createCookie(name, "", -1);
};
