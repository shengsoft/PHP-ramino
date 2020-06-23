<?php
$cache = true;
$cacheString = ($cache)?'?cache='.time():'';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title><?=$title?> </title>
    <meta name="description" content="<?=$metaDescription?>" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<!--    <base href="<?php echo (isset($_SERVER['HTTPS'])?'https://':'http://'); ?><?=$_SERVER['SERVER_NAME']?>">  -->
    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
    <link rel="icon" href="/favicon.ico" type="image/x-icon">

    <link rel="stylesheet" type="text/css" href="css/font-awesome.min.css">
    <link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="css/bootstrap-toggle.min.css">
    <link rel="stylesheet" type="text/css" href="css/perfect-scrollbar.min.css">
    <link rel="stylesheet" type="text/css" href="css/awesome-bootstrap-checkbox.css">
    <link rel="stylesheet" type="text/css" href="css/jquery-ui.min.css">
    <link rel="stylesheet" type="text/css" href="css/animate.css">
    <link rel="stylesheet" type="text/css" href="css/emojionearea.min.css">
    <link rel="stylesheet" type="text/css" href="css/flags.min.css">
    <link rel="stylesheet" type="text/css" href="css/pnotify.custom.min.css">
    <link rel="stylesheet" type="text/css" href="css/colorPicker.min.css">
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/jspanel3/3.11.2/jquery.jspanel.min.css">

    <link rel="stylesheet" type="text/css" href="css/chatHTML5.css?>">
    <link rel="stylesheet" type="text/css" href="css/<?=$config->theme?>Chat4.css">
    <link rel="stylesheet" href="css/mode/<?=$config->chatType?>.css?">

    <?php if ($config->externalCSSLink && filter_var($config->externalCSSLink, FILTER_VALIDATE_URL) !== false): ?>
        <link rel="stylesheet" type="text/css" href="<?=$config->externalCSSLink?>">
    <?php endif?>

    <?php if (!$config->webrtc || $config->webrtcServer=='flash' || $config->webrtcServer==''): ?>
        <script src="js/swfobject.js"></script>
        <script src="//cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <?php endif?>

    <script src="js/jquery.min.js"></script>
    <script src="js/jquery.colorPicker.min.js"></script>
    <script src="//code.jquery.com/ui/1.12.1/jquery-ui.min.js"></script>
    <script src="js/jquery.ui.touch-punch.min.js"></script>


    <script src="js/bootstrap.min.js"></script>
    <script src="js/bootbox.min.js"></script>
    <script src="js/sprintf.min.js"></script>
    <script src="js/bootstrap-toggle.min.js" async></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.4/socket.io.js"></script>

    <script src="<?=$scriptChat?>"></script>
    <script src="js/split.js" async></script>
    <script src="js/bootstrap-dynamic-tabs.js"></script>
    <script src="js/perfect-scrollbar.jquery.js" async></script>
<!--    <script src="//www.youtube.com/iframe_api" async></script>-->


    <script src="//cdnjs.cloudflare.com/ajax/libs/jspanel3/3.11.2/jquery.jspanel.min.js"></script>
    <script src="//cdn.jsdelivr.net/npm/jquery.marquee@1.5.0/jquery.marquee.js" type="text/javascript"></script>

    <script src="js/emojionearea.js"></script>
    <script src="js/jquery.textcomplete.js"></script>
    <script src="js/pnotify.custom.min.js" async></script>
    <script src="js/jquery.idle.min.js" async></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fingerprintjs2/2.1.0/fingerprint2.min.js" async></script>

    <?php
    if ($roles[$myuser['role']]->canBan || $roles[$myuser['role']]->canMute):?>
        <script src="//cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment-with-locales.min.js" ></script>
        <script src="js/bootstrap-datetimepicker.js"></script>
        <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.37/css/bootstrap-datetimepicker.min.css">
    <?php endif;?>

    <?php if ($config->displayCalendar): ?>
        <script src="js/zabuto_calendar.min.js" async></script>
        <link rel="stylesheet" type="text/css" href="css/zabuto_calendar.min.css">
    <?php endif?>

    <?php if ($config->webrtc && $config->webrtcServer=='kurento'): ?>
        <script src="js/vendor/adapter.js"></script>
        <script src="js/vendor/kurento-utils.min.js"></script>
        <script src="//webtv.fr:8080/socket.io/socket.io.js"></script>
        <script src="js/kurento.js"></script>
        <script>
            var serverWebrtc = {};
        </script>
    <?php endif?>

    <?php if ($config->externalJS && filter_var($config->externalJS, FILTER_VALIDATE_URL) !== false): ?>
        <script src="<?=$config->externalJS?>"></script>
    <?php endif ?>
    <link rel="stylesheet" href="css/flex.css">
    <style>
        <?=$config->css?>
    </style>

</head>
<body>
<div id="fullMainContainer">
    <div id="header" class="flex-property">
        <?php $logo = ($config->logo)? "/upload/logo/$config->logo":"img/logoChat.png"; ?>
        <div class="header-chat-logo">
            <img src="<?=$logo?>" alt="Chat logo">
        </div>

        <div class="dropdown ham-dropdown-menu">
            <button class="dropdown-toggle hamburger-header flex-property" type="button" data-toggle="dropdown" title="My user menu">
                <div></div>
                <div></div>
                <div></div>
            </button>
            <ul class="dropdown-menu ham-dropdown-list">
                <div data-action="online" class="menuUserItem"><i style="color:#50ce84" class="fa fa-circle"></i> <?=$traductions['statusOnline'];?></div>
                <div data-action="offline" class="menuUserItem"><i style="color:#ff0142" class="fa fa-circle"></i> <?=$traductions['statusOffline'];?></div>
                <div data-action="busy" class="menuUserItem"><i style="color:orange" class="fa fa-circle"></i>  <?=$traductions['statusBusy'];?></div>
                <?php if($config->seeMyProfileMenuLink):?>
                    <div data-action="seeMyProfile" class="menuUserItem"><i class="fa fa-user"></i> <?=$traductions['SeeMyProfile'];?></div>
                <?php endif?>

                <?php $classInvisible = ($roles[$myuser['role']]->invisibleMode)?'':'displayNone' ?>
                <div data-action="invisible" class="menuUserItem link-icons <?=$classInvisible?>"><i class="fa fa-user-secret"></i> <?=$traductions['invisible'];?></div>

              <!--  <?php if ($roles[$myuser['role']]->canChangeAvatar): ?>
                    <div data-action="avatar" class="menuUserItem link-icons"><i class="fa fa-picture-o"></i> <?=$traductions['changeAvatar'];?></div>
                <?php endif?> 
               -->

                <div data-action="parameters" class="menuUserItem link-icons displayNone"><i class="fa fa-cog"></i> <?=$traductions['Parameters'];?></div>
                <?php if ($config->helpUrl):?>
                    <div data-action="help" class="menuUserItem link-icons"><i class="fa fa-info-circle"></i> <?=$traductions['help'];?></div>
                <?php endif?>
                <div data-action="quit" class="menuUserItem link-icons"><i class="fa fa-sign-out"></i> <?=$traductions['quit'];?></div>
                <?php if ($config->urlQuitAndDisconnect):?>
                    <div data-action="quitAndDisconnect" class="menuUserItem link-icons"><i class="fa fa-sign-out"></i> <?=$traductions['quitAndDisconnect'];?></div>
                <?php endif?>

            </ul>
        </div>

        <div id="myAvatar" class="flex-property flex-center">
            <img src="img/avatars/m/1.svg" alt="" class="userAvatar">
            <div class="status online header-online" ></div>
            <div class="myUsername"></div>
        </div>

        <div class="flex-property group-btns header-custom-btns">
            <div class="header-btn-wrap hide-btn flex-property">
                <button type="button" class="btn toggleSize"><i class="fa fa-caret-square-o-right"></i></button>
            </div>
            <div class="header-btn-wrap hide-btn flex-property">
                <input type="file" id="fileElem" accept="image/*" style="display:none" >
            </div>

            <div class="header-btn-wrapflex-property hide-btn">
                <button id="quitBtn" class="btn btn-danger"><i class="fa fa-times"></i> <?=$traductions['quit'];?></button>
            </div>

            <?php if ($config->chatType=='conference' && !$roles[$myuser['role']]->canBroadcast): ?>
                <button id="askPrivateConferenceBtn"><?=$traductions['askPrivateChat'];?></button>
                <a href="<?=$config->conferencePrivatePaymentUrl?>" target="_blank" id="purchseCreditsBtn" class="header-home-btn flex-property"><?=sprintf($traductions['purchase Credits'], $myuser['credits']);?></a>
            <?php endif?>

            <?php if ($config->showQuitBtn): ?>
                <button id="customExit" class="header-home-btn flex-property"><?=$traductions['quit'];?></button>
            <?php endif?>

            <?php if ($config->displayRoomButton): ?>
                <button id="roomsBtn" title="<?=$traductions['roomList'];?>" class="header-home-btn flex-property"><img class="svg-header-icons" src="img/home.svg"/><?=$traductions['roomList'];?></button>
            <?php endif?>


            <?php if ($config->displayPrivateButton):?>
                <div class="header-btn-wrap flex-property" title="<?=$traductions["do not disturb with private requests"];?>">
                    <span class="buttons-subnames flex-property"><img class="svg-header-icons" src="img/private.svg" /><span><?=$traductions['privateChat']?></span></span>
                    <input type="checkbox" id="acceptPrivateCheckBox" checked <?php /*if (!$config->privateOnlyOnInvitation) echo 'checked';*/?>
                           data-toggle="toggle"
                           data-on=""
                           data-off=""
                           data-onstyle="success"
                           data-offstyle="danger">
                </div>
            <?php endif?>

            <?php if ($config->displayWebcamButton || ($config->chatType=='conference' && $roles[$myuser['role']]->conference_canUsersShowWebcamInPublic)): ?>
                <div class="header-btn-wrap flex-property" >
                    <span class="buttons-subnames flex-property" title="Webcam on/off"><img class="svg-header-icons" src="img/webcam.svg" /><span><?=$traductions['Camera']?></span></span>
                    <input type="checkbox" id="webcamBtn"
                           data-toggle="toggle"
                           data-on=""
                           data-off=""
                           data-onstyle="success"
                           data-offstyle="danger">
                </div>
            <?php endif?>

            <div class="header-btn-wrap flex-property soundsEffects" title="<?=$traductions['do not play sound effects'];?>">
                <span class="buttons-subnames flex-property"><img class="svg-header-icons" src="img/music.svg" /> <span><?=$traductions['Sound']?></span></span>
                <input
                        class="pull-right"
                        type="checkbox"
                        checked id="soundCheckBox"
                        data-toggle="toggle"
                        data-on=""
                        data-off=""
                        data-onstyle="success"
                        data-offstyle="danger">
            </div>
        </div>
    </div>
    <div id="container">
        <div id="chatAndUserContainer">
            <div id="chatContainer">
                <?php $classe = ($config->chatType==='tab')?'noFloat':'';?>
                <div id="webcamsContainer" class="<?=$classe?>"></div>
                <div id="tabs"></div>
                <div id="footer" class="flex-property">
                    <div class="textarea-icons-wrapper flex-property">
                        <?php if ($config->pushToTalk):?>
                            <?php if ($config->pushToTalkFreeHand && $roles[$myuser['role']]->canPushToTalk):?>
                                <div class="chat-input-icons" id="pushToTalkFreeHandContainer" title="<?=$traductions['pushToTalk'];?>">
                                    <input type="checkbox" name="pushToTalkFreeHand" id="pushToTalkFreeHand">
                                </div>
                                <div class="chat-input-icons" id="pushTalkButtonContainer" title="<?=$traductions['pushToTalk'];?>"><img id="pushTalkBtn" src="img/microphone.svg"/></div>
                            <?php endif ?>
                        <?php endif ?>
                        <?php
                        $iPhone  = stripos($_SERVER['HTTP_USER_AGENT'],"iPhone");
                        $iPad    = stripos($_SERVER['HTTP_USER_AGENT'],"iPad");
                        $isIOS = $iPhone || $iPad;
                        if ($roles[$myuser['role']]->canSnapshot && !$isIOS): ?>
                            <div class="chat-input-icons" id="snpashotlabel" title="Record voice or audio message">
                                <i class="fa fa-circle"></i>
                            </div>
                        <?php endif?>


                        <div class="chat-input-icons" id="boldDiv" title="Bold">
                            <i class="fa fa-bold"></i>
                        </div>
                        <div class="chat-input-icons" id="italicDiv" title="Italic">
                            <i class="fa fa-italic"></i>
                        </div>
                        <div class="chat-input-icons" id="underlineDiv" title="Underline">
                            <i class="fa fa-underline"></i>
                        </div>
                        <?php $classe = ($config->youtubePlayer && $roles[$myuser['role']]->canPostYouTube)?'':'displayNone'; ?>

                        <div class="chat-input-icons <?=$classe?>" id="djButtonContainer" title="DJ" ><i id="djBtn" class="fa fa-2x fa-youtube"></i></div>

                        <?php if ($config->displayGifsSearch):?>
                            <div class="chat-input-icons" id="smileyButtonContainer" title="Gif search" ><img id="smileyButton" src="img/picture.svg"/></div>
                        <?php endif?>
                        <div class="chat-input-icons" id="cleanButtonContainer" title="<?=$traductions['cleanChat'];?>"><img id="clearButton" src="img/eraser.svg"/></div>
                        <?php if ($roles[$myuser['role']]->colorPicker):?>
                            <div class="chat-input-icons" id="colorPickerContainer" title="Color picker"><input id="colorPicker" name="colorPicker" type="text" /></div>
                        <?php endif?>
                        <?php if ($config->showBackgrounds):?>
                            <div class="chat-input-icons" id="backgroundBtnContainer" title="Change background"><img id="backgroundBtn" src="img/settings.svg"/></div>
                        <?php endif?>
                        <div id="lockScrollBtn" class="chat-input-icons" title="<?=$traductions['lockChatScroll']?>" >
                            <i class="fa fa-unlock-alt"></i>
                            <i class="fa fa-lock" style="display: none" ></i>
                        </div>
                    </div>
                    <div id="chatInputContainer">
                        <textarea id="chatInput" rows="2" spellcheck="false" placeholder="Enter your message..."></textarea>
                    </div>
                    <?php if ($roles[$myuser['role']]->canSendTipConference):?>
                        <button id="sendTipBtn"><?=$traductions['sendTips']?></button>
                    <?php endif?>

                    <?php if ($config->webradio):?>
                        <audio id="webradioPlayer"controls="true" preload="none" controlsList="nodownload"><source src="<?=$config->webradio;?>" type="audio/mp3"></audio>
                    <?php endif;?>

                    <a href="javascript:void(0)" id="send-msg-btn"><?=$traductions['Send']?></a>


                    <div id="privateOrMentionContainer">
                        <div id="texteCaption">Mention</div>
                        <div class="pulsateCircle"></div>
                    </div>
                    <div id="marqueeContainer">
                        <div id="marquee"></div>
                    </div>
                </div>
                <!-- modals -->
                <?php
                include 'modals/smileys.php';
                include 'modals/backgrounds.php';
                include 'modals/configModal.php';
                include 'modals/loginModal.php';
                include 'modals/registerModal.php';
                include 'modals/roomsModal2.php';
                include 'modals/roomCreateModal.php';
                include 'modals/loginGuestModal.php';

                if ($roles[$myuser['role']]->canBan):
                    include ('modals/banModal.php');
                endif;
                if ($roles[$myuser['role']]->canMute):
                    include ('modals/muteModal.php');
                endif;
                if ($config->reportUserToAdmin):
                    include ('modals/reportModal.php');
                endif;
                if ($roles[$myuser['role']]->canPromote && !$config->enterChatMode):
                    include ('modals/rolePromoteModal.php');
                endif;
                if ($roles[$myuser['role']]->canReportRoom):
                    include ('modals/reportRoomModal.php');
                endif;
                if ($roles[$myuser['role']]->canSnapshot):
                    include ('modals/snapshotModal.php');
                endif;
                if ($roles[$myuser['role']]->canSendTipConference):
                    include ('modals/tipsModal.php');
                endif;
                if ($config->webrtc):
                    include ('modals/webcamChooseModal.php');
                endif;


                ?>
                <div class="overlay"></div>
            </div>
            <div id="middleContainer"></div>

            <?php $style = ($roles[$myuser['role']]->canSeeOtherUsers)?'':'display:none'?>
            <div id="usersContainer" class="<?=$config->chatType?>" style="<?=$style?>">
                <div id="slide_block" class="slide_block" data-userrole="<?=$myuser['role']?>" ></div>
                <?php if ($roles[$myuser['role']]->canSeeOtherUsers):?>
                    <ul class="nav nav-pills"  style="display:flex;  flex-direction:row;  justify-content:space-evenly;">
                        <li class="active">
                            <a href="#usersContainer2" data-role="users" data-toggle="tab"><img class="right-container-icons white-svg" src="img/users-white.svg" />
                                <img class="right-container-icons black-svg" src="img/users.svg" /> <?=$traductions['users']?> <span class="badge" data-role="usersOnlineCounter">0</span></a>
                        </li>
                        <?php if ($config->displayRoomTab && $config->chatType!='conference'): ?>
                            <li>
                                <a href="#roomsContainer2" data-role="rooms" data-toggle="tab"><img class="right-container-icons white-svg" src="img/home-w.svg" />
                                    <img class="right-container-icons black-svg" src="img/home-b.svg" /> <?=$traductions['rooms']?> <span class="badge" data-role="roomsOnlineCounter">0</span></a>
                            </li>
                        <?php endif?>
                        <?php if ($config->friendsManagment) :?>
                            <li>
                                <a href="#friendsContainer2" data-role="friends" data-toggle="tab"><i class="fa fa-user-plus"></i> <?=$traductions['Friends']?> <span class="badge" data-role="friendsOnlineCounter">0</span></a>
                            </li>
                        <?php endif?>
                    </ul>
                <?php endif?>
                <div class="tab-content clearfix">

                    <div id="usersContainer2" class="tab-pane active">
                        <?php if ($roles[$myuser['role']]->canSeeOtherUsers):?>
                            <div class="flex-property search-bar">
                                <i class="fa fa-search"></i>
                                <input id="searchInput" type="text" placeholder="<?=$traductions['searchUsers']?>" autocomplete="off">

                                <button id="sortWebcamtBtn" title="<?=$traductions['sortWebcam']?>" class="btn btn-sm btn-default"> <i class="fa fa-video-camera" aria-hidden="true"></i></button>
                                <button id="sortBtn" title="<?=$traductions['sortByUser']?>"  class="btn btn-sm btn-default"> <i class="fa fa-sort-alpha-asc" aria-hidden="true"></i></button>

                            </div>
                        <?php endif?>

                        <?php if ($config->displayCalendar): ?>
                            <div><button type="button" id="calendarBtn" class="btn" style="width:100%" ><i class="fa fa-calendar"></i> <?=$traductions['Calendar']?></button></div>
                            <div id="calendarContainer">
                                <div id="calendar"></div>
                            </div>
                        <?php endif?>
                        <div class="flex-container">
                            <div id="userHeader">
                                <div id="conferenceWebcamContainer"></div>
                                <div id="myWebcamContainer">
                                    <?php $visible = ($config->displayWebcamPublicWebcamPrivateButtons)?'':'display:none'; ?>
                                    <div class="btn-group" data-toggle="buttons" style="width:100%;<?=$visible?>">
                                        <label class="btn dark-blue-btn <?php if ($config->webcamPublic) echo 'active'; ?>" title="<?=$traductions['showMyWebcamToAnyone']?>">
                                            <input type="radio" name="webcamOption" id="publicWebcamBtn" autocomplete="off" > <i class="fa fa-users"></i> <?=$traductions['myWebcamIsPublic']?>
                                        </label>
                                        <label class="btn dark-blue-btn <?php if (!$config->webcamPublic) echo 'active'; ?>" title="<?=$traductions['showMyWebcamOnlyOnInvitation'];?>">
                                            <input type="radio" name="webcamOption" id="privateWebcamBtn" autocomplete="off" <?php if (!$config->webcamPublic) echo 'checked="checked"'; ?>> <i class="fa fa-user-secret"></i> <?=$traductions['myWebcamIsPrivate']?>
                                        </label>
                                    </div>
                                    <?php if ($roles[$myuser['role']]->canBroadcast=='1'): ?>
                                        <div id="broadcastContainer">
                                            <input title="Broadcast" type="checkbox" disabled checked id="broadcastCheckBox" data-toggle="toggle" data-on="<i class='glyphicon glyphicon-facetime-video'></i> <?=$traductions['BroadcastOff']?>" data-off="<i class='fa fa-circle'></i> <?=$traductions['BroadCasting']?>" data-onstyle="success" data-offstyle="danger">
                                        </div>
                                    <?php endif?>

                                </div>
                                <?php if ($roles[$myuser['role']]->canSeeOtherUsers):?>
                                    <div class="filtergender">
                                        <div class="users-info">
                                            <?=$traductions['online']?>: <span id="onlineCounter" data-role="usersOnlineCounter">0</span>
                                            <div style="float: right"><?=$traductions['watchAtMe']?> <span id="watchAtMe">0</span></div>
                                        </div>
                                        <?php if ($config->showGenderFilters):?>
                                            <?php foreach($genders as $gender): ?>
                                                <div class="checkbox filtergenderItem">
                                                    <input id="filtergender<?=$gender->gender?>" data-gender="<?=$gender->gender?>" type="checkbox" checked>
                                                    <label for="filtergender<?=$gender->gender?>" class="gender-color-<?=$gender->gender?> gender-select-name" style="color:<?=$gender->color?>">
                                                        <?php if($gender->image): ?>
                                                            <img src="/upload/genders/<?=$gender->image?>"/>
                                                        <?php endif?>
                                                        <?=$gender->gender?>
                                                    </label>
                                                </div>
                                            <?php endforeach ?>
                                        <?php endif ?>
                                    </div>
                                <?php endif?>
                                <?php if ($config->chatroulette): ?>
                                    <div id="chatrouletteContainer">
                                        <button id="chatRouletteBtn" disabled class="btn btn-success active "><i class="fa fa-random" aria-hidden="true"></i> <?=$traductions['playRandomCam'];?></button>
                                    </div>
                                <?php endif?>

                            </div>
                            <?php if ($roles[$myuser['role']]->canSeeOtherUsers):?>


                                <div id="userListMain">
				<?php
				$str = '<div id="userList"></div>';
				echo htmlentities($str);
					?>
                                    <div id="userList"></div>
                                </div>
                                <div id="youtubeWrap" style="display: none">
                                    <div id="youtubeHeader">
                                        <button id="youTubeCloseBtn" class="btn btn-block"><i class="fa fa-youtube"></i><i class="fa fa-close"></i> Close youtube</button>
                                    </div>
                                    <div id="youtubeContainer"></div>
                                    <div id="youtubeQuiz"></div>
                                </div>
                            <?php endif?>

                        </div>
                    </div>

                    <div id="roomsContainer2" class="tab-pane">
                        <?php if ($roles[$myuser['role']]->canCreateDynamicRoomNumber && $config->multiRoomEnter=='1'): ?>
                            <div><button class="btn btn-default btn-block createRoomBtn"><i class="fa fa-plus-circle"></i> <?=$traductions['createMyRoom']?></button></div>
                        <?php endif?>
                        <div id="roomsContainer2" class="tab-pane">
                            <?php if ($roles[$myuser['role']]->canCreateDynamicRoomNumber && $config->multiRoomEnter=='1'): ?>
                                <div><button class="btn btn-default btn-block createRoomBtn"><i class="fa fa-plus-circle"></i> <?=$traductions['createMyRoom']?></button></div>
                            <?php endif?>
                            <div id="searchRoomContainer" class="flex-property search-bar">
                                <?php if ($config->showSearchRoomAdultCheckbox):?>
                                    <i class="fa fa-search"></i>
                                    <input id="searchInputRoom" class="searchInputRoom" type="text" placeholder="<?=$traductions['searchRoom']?>" autocomplete="off">
                                    <?php if (isset($myuser['showAdultrooms'])): ?>
                                        <span class="buttons-subnames flex-property"><span><?=$traductions['adultRoom']?></span></span>
                                        <input type="checkbox" id="adultRoomCheckBox" checked
                                               data-toggle="toggle"
                                               data-on=""
                                               data-off=""
                                               data-onstyle="success"
                                               data-offstyle="danger">
                                    <?php endif;?>
                                <?php endif?>
                            </div>
                            <table class="table table-striped table-bordered table-hover">
                                <thead>
                                <tr>
                                    <th width="75%"><?=$traductions['name']?></th>
                                    <th width="80px"><?=$traductions['Number']?></th>
                                    <th><?=$traductions['action']?></th>
                                </tr>
                                </thead>
                                <tbody id="tableRoomBody2"></tbody>
                            </table>
                        </div>
                        <table class="table table-striped table-bordered table-hover">
                            <thead>
                            <tr>
                                <th width="75%"><?=$traductions['name']?></th>
                                <th width="80px"><?=$traductions['Number']?></th>
                                <th><?=$traductions['action']?></th>
                            </tr>
                            </thead>
                            <tbody id="tableRoomBody2"></tbody>
                        </table>
                    </div>
                    <?php if ($roles[$myuser['role']]->canSeeOtherUsers):?>
                        <div id="friendsContainer2" class="tab-pane">
                            <div id="friendsList"></div>
                        </div>
                    <?php endif ?>

                </div>
            </div>

            <div id="userMenu">
                <div data-action="profile" class="menuUserItem"><i class="fa fa-info-circle"></i> <span><?=$traductions['Profile'];?></span></div>
                <div data-action="whisper" class="menuUserItem"><i class="fa fa-user-secret"></i> <span><?=$traductions['Whisper'];?></span></div>
                <div data-action="quickPrivateMessage" class="menuUserItem"><i class="fa fa-paper-plane"></i> <?=$traductions['quickPrivateMessage'];?></div>
                <div data-action="private" class="menuUserItem"><i class="fa fa-comment"></i> <span><?=$traductions['private'];?></span></div>
                <div data-action="mute" class="menuUserItem"><i class="fa fa-microphone-slash"></i> <span><?=$traductions['muteUser'];?></span></div>
                <div data-action="call1to1" class="menuUserItem"><i class="fa fa-phone"></i> <span><?=$traductions['call1to1'];?></span></div>
                <?php if ($roles[$myuser['role']]->canInviteToWatchCam):?>
                    <div data-action="inviteWatchCam" class="menuUserItem"><i class="fa fa-phone"></i> <span><?=$traductions['InviteToWatchMyCam'];?></span></div>
                <?php endif?>




                <?php if ($config->friendsManagment) : ?>
                    <div data-action="friend" class="menuUserItem"><span></span></div>
                <?php endif ?>
                <?php if (1 || $roles[$myuser['role']]->canKick):?>
                    <div data-action="kick" class="menuUserItem"><i class="fa fa-sign-out"></i> <?=$traductions['kickUser'];?></div>
                    <div data-action="kickFromRoom" class="menuUserItem"><i class="fa fa-sign-out"></i> <?=$traductions['kickFromRoom'];?></div>
                <?php endif;?>

                <?php if (1 || $roles[$myuser['role']]->canBan):?>
                    <div data-action="ban" class="menuUserItem"><i class="fa fa-ban"></i> <?=$traductions['banUser'];?></div>
                <?php endif;?>

                <?php if ($roles[$myuser['role']]->canMutePrison):?>
                    <div data-action="mutePrison" class="menuUserItem"><i class="fa fa-lock"></i> <?=$traductions['mutePrisonUser'];?></div>
                <?php endif?>

                <?php $classe = ($roles[$myuser['role']]->canMuteWebcam)?'':'displayNone'; ?>
                <div data-action="muteWebcam" class="menuUserItem <?=$classe?>"><i class="fa fa-stop-circle-o"></i> <?=$traductions['muteWebcam'];?></div>

                <?php if ($roles[$myuser['role']]->canPromote && !$config->enterChatMode):?>
                    <div data-action="promoteUser" class="menuUserItem"><i class="fa fa-gift"></i> <?=$traductions['promoteUser'];?></div>
                <?php endif?>

                <?php $classe = ($roles[$myuser['role']]->canPromote)?'':'displayNone'; ?>
                <div data-action="showIP" class="menuUserItem <?=$classe?>"><i class="fa fa-info"></i> <?=$traductions['Show IP'];?></div>



                <div data-action="deleteUserMessages" class="menuUserItem"><i class="fa fa-times"></i> <?=$traductions['Delete User Messages'];?></div>

                <?php $classe = ($roles[$myuser['role']]->canVoteContest)?'':'displayNone'; ?>
                <div data-action="voteContest" class="menuUserItem <?=$classe?>"><i class="fa fa-gift"></i> <?=$traductions['vote'];?></div>

                <?php if ($config->reportUserToAdmin):?>
                    <div data-action="reportUser" class="menuUserItem"><i class="fa fa-bell-o"></i> <span></span></div>
                <?php endif?>

                <?php if ($config->showUserInfoDataUrlOrJavascript) : ?>
                    <div data-action="userInfo" class="menuUserItem"><i class="fa fa-info"></i> <?=$traductions['userInfo'];?></div>
                <?php endif ?>
            </div>
        </div>
    </div>
</div>
<div id="oas_Position1">
    <?=$config->ad ?>
</div>
<div id="lightBox">
    <img src="" alt="">
    <video controls></video>
    <button id="closeLightBoxBtn" class="btn pull-right"><i class="fa fa-close"></i></button>
</div>

<!-- push to talk -->
<!--<div id="pushToTalkWindow" >
    <div id="pushToTalkWindowHeader"></div>
    <button id="pushToTalkBtnClose" class="btn btn-xs"><i class="fa fa-close"></i></button>
    <div id="pushToTalkContainer">
        <div id="pushToTalkSWFContainer"></div>
    </div>
</div>-->



<div id="lightBox1to1">
    <div id="hisVideo1to1Container"></div>
    <div id="header1to1Call">
        <div><i class="fa fa-phone"></i> <span id="username1to1Call"></span></div>
        <div id="waitingCall">
            <?=$traductions['waiting'];?>
        </div>
        <div>
            <img width="128" height="128"  src="img/callSpinning.svg" alt="calling">
        </div>
    </div>
    <button id="call1to1EndedBtn"><i class="fa fa-phone fa-3x"></i></button>
</div>

<?php if ($config->webrtc && $config->webrtcServer=='licode'): ?>
    <script src="js/licode/erizo.js"></script>
    <script src="js/licode/licode.js"></script>
<?php endif?>

<?php if ($config->webrtc && $config->webrtcServer=='janus'): ?>
    <script>var webrtcServerUrl ='';</script>
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/webrtc-adapter/3.1.5/adapter.min.js" ></script>
    <script type="text/javascript" src="js/janus/janus.js" ></script>
    <script type="text/javascript" src="js/janus/webrtc.js"></script>
<?php endif?>



<script>

    var chatHTML5 = new ChatHTML5(<?=json_encode($defaultRoom); ?>, <?=json_encode($config);?>, <?=json_encode($traductions)?>);
    if (chatHTML5.config.webrtcServer==='kurento') {
        var serverWebrtc = new Kurento(function() {
        })
    } else if (chatHTML5.config.webrtcServer==='licode') {
        var serverWebrtc = new LICODE(chatHTML5.config.webrtcServerUrl, '<?=$myuser['streamName']; ?>');
    }
    chatHTML5.roles = <?=json_encode($roles);?>;
    chatHTML5.start(<?=json_encode($myuser); ?>);
</script>



<script type="text/javascript">
    jQuery(document).ready(function(){
        jQuery(".header-custom-btns label").empty();
    });
</script>
</body>
</html>
