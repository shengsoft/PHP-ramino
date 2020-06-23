self.addEventListener('message', function(e) {
    var user = e.data.user;
    var message = e.data.message;
    var extras = e.data.extras;
    debugger;
    if (chatHTML5.muted[user.id]) {
        return;
    }
    if (message.length<512) {
        message = message.replace(/(?:\r\n|\r|\n)/g, '<br />');
    }

    // semi private message ?
    var classePrivate = '';
    var date = (extras.date===undefined) ?  new Date().toLocaleTimeString() : new Date(extras.date).toLocaleTimeString();
    message = chatHTML5.parseSmileys(message);
    var userStyle = 'color:#000';
    var classeWhisper = (extras.whisper)?'whisper':'';

    if (chatHTML5.myUser.roles[chatHTML5.myUser.role] && chatHTML5.myUser.roles[chatHTML5.myUser.role]['color']) {
        userStyle = 'color:' + chatHTML5.myUser.roles[chatHTML5.myUser.role]['color'];
    }

    var boldClasse = (extras.bold===true || extras.bold==='true')?'boldClasse':'';
    var italicClasse = (extras.italic===true || extras.italic==='true')?'italicClasse':'';
    var underlineClasse = (extras.underline===true || extras.underline==='true')?'underlineClasse':'';

    var rx = /.*@([\w\.]+)/;
    var match = (message.length<512) ?rx.exec(message):false;

    if (message && match && chatHTML5.getUserByUsername(match[1])) {
        extras.color = '#111e2c';
        classePrivate = 'addPrivateMessage';
        if (user.username==chatHTML5.myUser.username && chatHTML5.config.senderMessageFloatRight=='1') {
            classePrivate = classePrivate + ' myMessage';
        }
        message = sprintf("<b>%s %s</b>", user.username, message.replace(/<a.*>.*?<\/a>/ig,''));

        var templateMessage = sprintf('\
                <div class="message flex-property %s %s">\
                    <img src="%s" alt="%s" class="userItem" >\
                        <div class="flex-property private-message" data-username="%s" data-id="%s">\
                            <div class="timeStamp" data-date="%s">%s</div>\
                            <div class="content %s %s %s" style="color:%s"> %s</div>\
                        </div>\
                    </div>',
            classePrivate, classeWhisper,
            user.image, user.username,
            user.username, user.id,
            extras.date, chatHTML5.getDateAgo(extras.date),
            boldClasse, italicClasse, underlineClasse, extras.color,
            message.replace('@<(\w+)\b.*?>.*?</\1>@si', ''));
    } else {
        if (user.username==chatHTML5.myUser.username && chatHTML5.config.senderMessageFloatRight=='1') {
            classePrivate = classePrivate + ' myMessage';
        }
        var templateMessage = sprintf('\
                <div class="message flex-property msg-box %s %s">\
                    <img src="%s" alt="%s" class="userItem" >\
                      <div class="flex-property message-info">\
                        <div class="flex-property flex-center name-time">\
                            <div class="userItem" style="%s" title="Ask private chat with %s" data-id="%s" data-username="%s">%s</div>\
                            <div class="timeStamp" data-date="%s">%s</div>\
                        </div>\
                        <div class="content %s %s %s" style="color:%s">\
                          <div class="arrow-chat" style="display:none"></div>\
                          %s</div>\
                      <div>\
                    </div>',
            classePrivate, classeWhisper,
            user.image, user.username,
            userStyle, user.username, user.id, user.username, user.username,
            extras.date, chatHTML5.getDateAgo(extras.date),
            boldClasse, italicClasse, underlineClasse, extras.color,
            message.replace('@<(\w+)\b.*?>.*?</\1>@si', ''));
    }

    var roomidString = (user.room) ? sprintf('room_%s', user.room.id)  : sprintf('room_%s', chatHTML5.myUser.room.id);
    var $chat = chatHTML5.$getChat(roomidString);
    if ($chat) {
        $chat.animate({scrollTop: $chat[0].scrollHeight}, 200);
        if (chatHTML5.config.linkifyUrl=='1') {
            var regex = /(https?:&#x2F;&#x2F;.*?)(?=[<\s])/gi;
            templateMessage = templateMessage.replace(regex, function(correspondance, part1) {
                if (correspondance.indexOf('giphy.com') != -1) {
                    return correspondance;
                }
                return "<a target='_blank' href='"+correspondance+"'>"+correspondance + "</a>";
            })
        }



        $(templateMessage).hide().appendTo($chat).fadeIn(500);
        chatHTML5.playMP3(chatHTML5.config.soundMessageReceived);
    }

    var roomid = (user.room) ? user.room.id : 0;
    var temp = sprintf("a[data-roomid=%s] div.unread", roomid);
    if (roomid==chatHTML5.myUser.room.id) {
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


}, false);

