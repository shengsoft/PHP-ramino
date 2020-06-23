<?php
session_start();
ini_set('display_errors', 1);error_reporting(E_ALL);
include_once 'classes/Config.php';
include_once 'classes/Services.php';
include_once 'classes/DB.php';
include_once 'classes/Room.php';
include_once 'classes/User.php';
include_once 'classes/Webmaster.php';
include_once 'classes/ForbiddenWords.php';
include_once 'classes/Gender.php';
include_once 'classes/News.php';
include_once 'classes/Friend.php';
include_once 'classes/Images.php';
include_once 'classes/RSS.php';
include_once 'classes/Broadcast.php';
include_once 'classes/Messenger.php';


//error_reporting(E_ALL); ini_set('display_errors', 'On'); // error showing (debug)
require 'vendor/autoload.php';

use Firebase\JWT\JWT;

$a = isset($_POST['a'])?$_POST['a']:'';
if (isset($_SESSION['webmasterid']) && $_SESSION['webmasterid']) {
    $webmasterid = $_SESSION['webmasterid'];
} elseif (isset($_SESSION['admin'])) {
    $webmasterid = $_SESSION['admin'];
}
if (!isset($webmasterid) && isset($_POST['webmasterid'])) {
    $webmasterid = $_POST['webmasterid'];
}
function loginWebmaster() {
    $password = DB::real_escape_string($_POST['password']);

    if (!$password) {
        $password = $_SESSION['jwtPassword'];
    }
    $jwt = isset($_POST['jwt']) ? DB::real_escape_string($_POST['jwt']) : '';
    //$_SESSION['webmasterid'] = '';
    if ($jwt) {
        // password est encodé en md5
        $webmaster = Webmaster::get($_SESSION['webmasterid']);
        if($password!=md5($webmaster->password)) {
            exit ('ko');
        }
        $webmaster = Webmaster::loginJWT($jwt, $webmaster->password);
        echo json_encode($webmaster);
        exit;
    }
    $email = DB::real_escape_string($_POST['email']);
    $webmaster = Webmaster::login($email, $password);
    if ($webmaster) {
        if (!$webmaster->confirmed) {
            echo 'notConfirmed';
            return;
        }
        $_SESSION['admin'] = $webmaster->id;
        return  json_encode($webmaster);
    } else {
        return ('ko');
    }
}
switch($a) {
    case 'getWebmasterid':
        $url = DB::real_escape_string($_POST['url']);
        $res = DB::getOne('chat_webmaster',"WHERE site='$url'", false);
        echo $res->id;
        break;


    case 'getDefaultRoom':
        $webmasterid = $_POST['webmasterid'];
        echo json_encode(Room::getDefault($webmasterid));
        break;

    case 'getConfig':
        $webmasterid = $_POST['webmasterid'];
        $config = Config::getByWebmasterid($webmasterid);
        echo json_encode($config);
        break;

    case 'getPerformers':
        $webmasterid = $_POST['webmasterid'];
        $config = Config::getByWebmasterid($webmasterid);
        $ajaxPPV = $config->ajaxPPV;
        //echo json_encode(array('ajaxPPV'=>$ajaxPPV));
        echo Services::post($ajaxPPV, array('a'=>'getPerformers', 'webmasterid'=>$webmasterid));
        break;

    case 'getOnlinePerformers':
        $webmasterid = DB::real_escape_string($_POST['webmasterid']);
        die("webmasterid:$webmasterid");
        break;

    case 'screenshot':
        $b64 = $_POST['b64'];
        echo Services::getScreenshotFromUrl($b64);
        break;

    case 'getMessage':
        if (isset($_POST['uid'])) {
            $uid = DB::real_escape_string($_POST['uid']);
            $row = DB::getOne('chat_messages', "WHERE uid='$uid'");
            echo $row->user;
        }
        break;
    case 'getMainRoom':
        echo json_encode(Room::getDefault($webmasterid));
        break;
    case 'setTranslate':
        $url = $_POST['url'];
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            exit('Error: Not Valid URL');
        }
        try {
            $json = file_get_contents($url);
            json_decode($json);
            if (json_last_error() == JSON_ERROR_NONE) {
                $sql = "update chat_config set urlJson='$url' WHERE webmasterid={$_SESSION['webmasterid']}";
                DB::execSQL($sql);
                exit("<b>Success</b><br>JSON is valid. Your translation file is now <br><b>$url</b>");
            } else {
                exit("<b>ERROR</b><br>$url JSON <b>is not valid JSON format</b>");
            }

        } catch(Exception $e) {
            exit("Error while fethcing $url");
        }

        break;

    case 'saveBroadcast':
        $webmasterid = $_SESSION['webmasterid'];
        $filename = $_POST['filename'];
        $videourl = $_POST['videourl'];
        $thumburl = $_POST['thumburl'];
        $duration = $_POST['duration'];
        Broadcast::save($webmasterid, $filename, $videourl, $thumburl, $duration, false);
        break;

    case 'getRSS':
        try {
            $webmasterid = @$_SESSION['webmasterid'];
            if (!$webmasterid) {
                return '';
            }
            echo json_encode(RSS::getRoomRSS($webmasterid));
        } catch(Exception $e) {
            return '';
        }

        break;

    case 'deleteAllMessages':
        $webmasterid = $_SESSION['webmasterid'];
        if (!$webmasterid) return;
        $sql = "delete from chat_messages WHERE webmasterid=$webmasterid";
        DB::execSQL($sql);
        break;

    case 'deleteAllContest':
        $webmasterid = $_SESSION['webmasterid'];
        if (!$webmasterid) return;
        $sql = "delete from chat_contest WHERE webmasterid=$webmasterid";
        DB::execSQL($sql);
        break;

    case 'addUsers_videoTimeSpent':
        $webmasterid = $_POST['webmasterid'];
        $userid = $_POST['userid'];
        $seconds = 10;
        $secondsSpent = User::addUsers_videoTimeSpent($userid, $webmasterid, $seconds);
        echo $secondsSpent;
        break;
    case 'getMuted':
        $webmasterid = $_POST['webmasterid'];
        $userid = $_POST['userid'];
        echo json_encode(User::getMutedUsers($webmasterid, $userid), JSON_NUMERIC_CHECK);
        break;

    case 'getMutedUsersAsArray':
        $webmasterid = $_POST['webmasterid'];
        $userid = $_POST['userid'];
        echo json_encode(User::getMutedUsersAsArray($webmasterid, $userid), JSON_NUMERIC_CHECK);
        break;


    case 'getJailed':
        $webmasterid = $_POST['webmasterid'];
        echo json_encode(User::getJailedUsers($webmasterid), JSON_NUMERIC_CHECK);
        break;

    case 'mute':
        $webmasterid = $_POST['webmasterid'];
        $muteduserid = $_POST['muteduserid'];
        $userid = $_POST['userid'];
        User::mute($webmasterid, $userid, $muteduserid, false);
        break;

    case 'unmute':
        $webmasterid = $_POST['webmasterid'];
        $muteduserid = $_POST['muteduserid'];
        $userid = $_POST['userid'];
        User::unmute($webmasterid, $userid, $muteduserid, false);
        break;

    case 'addRoomToFavorite':
        $roomid = $_POST['roomid'];
        $userid = $_POST['userid'];
        $webmasterid = $_POST['webmasterid'];
        $value = $_POST['value'];

        if ($value=='true') {
            Room::addFavori($webmasterid, $userid, $roomid);
        } else {
            Room::removeFavori($webmasterid, $userid, $roomid);
        }
        break;
    case 'getMyFavoris':
        $webmasterid = $_POST['webmasterid'];
        $userid = $_POST['userid'];
        $rooms = Room::getMyFavoris($webmasterid, $userid);
        echo json_encode($rooms);
        break;
    case 'checkUsername':
        $username =  htmlentities($_POST['username']);
        if (isset($webmasterid)) {
            echo User::checkUsernameTaken($webmasterid, $username);
        } else {
            echo 'ok';
        }
        break;


    case 'uploadImage':
        $file = ($_FILES['file']);
        $thumb = Images::upload($file);
        echo $thumb;
        break;

    case 'report':
        $usernameProblem = DB::real_escape_string($_POST['usernameProblem']);
        $usernameAuthor = DB::real_escape_string($_POST['usernameAuthor']);
        $email = DB::real_escape_string($_POST['email']);
        $description = DB::real_escape_string($_POST['description']);
        $reportReason = DB::real_escape_string($_POST['reportReason']);
        Webmaster::reportUserEmail($webmasterid, $email, $usernameAuthor, $usernameProblem, $description, $reportReason);
        break;

    case 'reportRoom':
        $roomNameProblem = DB::real_escape_string($_POST['roomNameProblem']);
        $usernameAuthor = DB::real_escape_string($_POST['usernameAuthor']);
        $email = DB::real_escape_string($_POST['email']);
        $description = DB::real_escape_string($_POST['description']);
        $reportReason = DB::real_escape_string($_POST['reportReason']);
        Webmaster::reportUserRoomEmail($webmasterid, $email, $usernameAuthor, $roomNameProblem, $description, $reportReason);
        break;


    case 'jwt':
        $json = $_POST['json'];
        $encodedUser = JWT::encode($json, JWT_PASSWORD);
        echo $encodedUser;
        break;

    case 'createAccountWP':
        $email = DB::real_escape_string($_POST['email']);
        $username = htmlentities(DB::real_escape_string($_POST['username']));
        $url = DB::real_escape_string($_POST['url']);
        $wp_register_url = DB::real_escape_string($_POST['wp_register_url']);
        $wp_login_url = DB::real_escape_string($_POST['wp_login_url']);
        echo Webmaster::createAccountWP($username, $email, $url, $wp_register_url, $wp_login_url);
        break;

    case 'setWasRead':
        $fromid = DB::real_escape_string($_POST['fromid']);
        $toid = DB::real_escape_string($_POST['toid']);
        $webmasterid = DB::real_escape_string($_POST['webmasterid']);
        Messenger::setWasRead($fromid, $toid, $webmasterid);
        break;

    case 'getChatMessages':
        $roomid = DB::real_escape_string($_POST['roomid']);
        $maxChats = DB::real_escape_string($_POST['maxChats']);
        $chats =  ROOM::getChatMessages($roomid, $maxChats);
        echo json_encode($chats);
        break;

    case 'resendConfirmation':
        $email = DB::real_escape_string($_POST['email']);
        echo Webmaster::resendConfirmation($email);
        break;

    case 'registerWebmaster':
        $username = htmlentities(DB::real_escape_string($_POST['username']));
        $email = htmlentities(DB::real_escape_string($_POST['email']));
        $password = htmlentities(DB::real_escape_string($_POST['password']));
        $langue = $_SESSION['langue'];
        echo Webmaster::createNewAccount($username, $email, $password, $langue);
        break;

    case 'registerUser':
        $username = htmlentities(DB::real_escape_string($_POST['username']));
        $email = htmlentities(DB::real_escape_string($_POST['email']));
        $password = DB::real_escape_string($_POST['password']);
        $gender = DB::real_escape_string($_POST['gender']);
        $age = DB::real_escape_string($_POST['age']);
        $birthyear = date('Y') - $age;
        echo User::createNewAccount($webmasterid, $username, $email, $password, $gender, $birthyear, false);
        break;

    case 'getNews':
        if (isset($_REQUEST['webmasterid'])) {
            $webmasterid = $_REQUEST['webmasterid'];
        } elseif (isset($_SESSION['webmasterid'])) {
            $webmasterid = $_SESSION['webmasterid'];
        }
        $news = ($webmasterid)?News::getAllActive($webmasterid, false):array();
        echo json_encode($news);
        break;

    case 'loginPanel':
        $res = loginWebmaster();
        if ($res=='ko') {
            $email = htmlentities(DB::real_escape_string($_POST['email']));
            $password = DB::real_escape_string($_POST['password']);
            $user = DB::getOne('chat_users', "WHERE email='$email' AND password='$password'", false);
            if (!$user) die('ko');
            $roleAdmin = DB::getOne('chat_roles',"WHERE webmasterid=$user->webmasterid and role='$user->role'",false);

            if (!$roleAdmin->canEnterChatAdmin) {
                echo 'ko';
                return;
            }
            $_SESSION['role'] = (array)$roleAdmin;
            $_SESSION['admin'] = $user->webmasterid;
            echo 'ok';

        } else {
            $user = json_decode($res,true);
            $roleAdmin = DB::getOne('chat_roles',"WHERE webmasterid=".$user['id']." and role='admin'", false);
            //print_r($roleAdmin);
            $_SESSION['role'] = (array)$roleAdmin;
            echo $res;
        }
        break;

    case 'loginPanel3':
        $res = loginWebmaster();
        if ($res=='ko') {
            echo $res;
            exit();

            $email = DB::real_escape_string($_POST['email']);
            $password = DB::real_escape_string($_POST['password']);
            $user = DB::getOne('chat_users', "WHERE email='$email' AND password='$password'");
            if (!$user) die('ko');
            die("****");

            $roleAdmin = DB::getOne('chat_roles',"WHERE webmasterid=$user->webmasterid and role='admin'");
            $_SESSION['admin'] = $user->id;
            return json_encode($user);

        } else {
            echo $res;
        }
        break;

    case 'loginWebmaster':
        echo loginWebmaster();
        break;

    case 'forgottenWebmaster':
        echo Webmaster::forgotten($_POST['email']);
        break;

    case 'contact':
        $username = htmlentities(DB::real_escape_string($_POST['username']));
        $email = htmlentities(DB::real_escape_string($_POST['email']));
        $question = DB::real_escape_string($_POST['question']);
        Services::sendEmail('yarekc@gmail.com', $email, "Contact requested from $email", "Question : $email - $question", EMAILFROM);
        echo "sent $username $email $question";

        break;
    case 'resendConfirmation':
        echo Webmaster::resendConfirmation($_POST['email']);
        break;

    case 'getRooms':
        echo json_encode(Room::getAll($webmasterid));
        break;

    case 'getAvatarGuest':
        $fingerprint = DB::real_escape_string($_POST['fingerprint']);
        $webmasterid = DB::real_escape_string($_POST['webmasterid']);
        $token = "$fingerprint$webmasterid";
        $image = DB::getOne('chat_guest_avatar',"WHERE fingerprint=$token",false);
        // test if exists
        $file = __DIR__."/upload/fingerprint/$token.jpg";
        //die($file);

        if (!file_exists ($file)) {
            $rand = rand(1,30);
            echo "avatars/$rand.svg";
            return;
        }
        echo "$token.jpg";
        break;

    case 'updateAvatarGuest':
        $fingerprint = $_POST['fingerprint'];
        $webmasterid = $_POST['webmasterid'];
        $file = $_FILES['file'];
        echo User::updateAvatarGuest($fingerprint, $webmasterid, $file);
        break;

    case 'updateAvatar':
        $id = $_POST['id'];
        $password = $_POST['password'];
        $webmasterid = $_POST['webmasterid'];
        $file = $_FILES['file'];
        echo User::updateAvatar($id, $password, $webmasterid, $file);
        break;

    case 'loginJWT':
        $user = User::loginJWT($_POST['username'], $_POST['password'], $webmasterid, $_POST['chatType'], $_POST['startRoom']);
        echo json_encode($user);
        break;

    case 'login':
        $username = htmlentities($_POST['username']);
        $user = User::login($username, $_POST['password'], $webmasterid);
        echo json_encode($user);
        break;

    case 'saveMessage':
        $roomid = DB::real_escape_string($_POST['roomid']);
        $username = htmlentities(DB::real_escape_string($_POST['username']));
        $message = DB::real_escape_string($_POST['message']);
        DB::insert('messages', array('webmasterid'=>$webmasterid, 'roomid'=>$roomid, 'username'=>$username, 'message'=>$message), true);
        break;

    case 'deleteRoom':
        Room::delete($_POST['id'], $webmasterid);
        echo 'ok';
        break;

    case 'getForbiddenWords':
        if (isset($webmasterid)) {
            echo json_encode(@ForbiddenWords::getAll($webmasterid));
        } else {
            echo json_encode(array());
        }
        break;

    case 'deleteUser':
        User::delete($_POST['id'], $webmasterid);
        echo "ok";
        break;


    case 'forgottenUser':
        $email = DB::real_escape_string(htmlentities($_POST['email']));
        echo User::forgotten($email, $webmasterid);
        break;

    case 'checkPasswordRoom':
        $id = DB::real_escape_string($_POST['id']);
        $password = DB::real_escape_string($_POST['password']);
        die(Room::checkPassword($id, $password, $webmasterid));
        break;
}

?>
