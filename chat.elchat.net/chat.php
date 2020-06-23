<?php debug_backtrace() || die ("<h2>Access Denied!</h2> This file is protected and not available to public."); ?>
<?php
@session_start();
//error_reporting(E_ALL);ini_set('display_errors', 'On');
require 'vendor/autoload.php';
use \Firebase\JWT\JWT;
include_once 'classes/DB.php';
include_once 'classes/Room.php';
include_once 'classes/Role.php';
include_once 'classes/Webmaster.php';
include_once 'classes/User.php';
include_once 'classes/Gender.php';
include_once 'classes/Background.php';
include_once 'classes/Services.php';

$myuser = array('role'=>'');
$webmasterid = (isset($args[0]))?$args[0]:1;
$webmaster = Webmaster::get($webmasterid);
if (!$webmaster) {
    header('Location:/');
}
if ($webmaster->suspended) {
    die("Account suspended. Illegal activity recorded. <a href='https://www.europol.europa.eu/report-a-crime/industry-reporting-of-child-sexual-abuse-material'>Report abuse</a>");
}
$_SESSION['webmasterid'] = $webmasterid;
$defaultRoom = Room::getDefault($webmasterid);
$ip = Services::getMyIp();
$country = User::geoip_country_code_by_name($ip);
$roles = Role::getAll($webmasterid);
$genders = Gender::getAll($webmasterid);
$config = DB::getOne('chat_config', "WHERE webmasterid=$webmasterid");

if ($country && (stripos($config->forbidCountries,$country)!== false) ) {
    exit("403 : forbidden country");
}
$uri = $_SERVER['REQUEST_URI'];
$queryString = strpos($uri, '?') ? substr($uri, strpos($uri, '?') + 1) : '';
parse_str($queryString, $parameters);
$_GET = array_merge($_GET, $parameters);

// JWT.io
// webmasterid password username gender role image defaultRoom
// $token = array('webmasterid'=>1, 'token'=>'1010', 'password'=>'yarekc', 'username'=>'yarek', 'gender'=>'male', 'role'=>'user',);
// cas chaine encoded !
if (isset($args) && strlen($args[1])>120) {
    $jwt = $args[1];
    try {
        $passwordMD5 = md5($webmaster->password);
        $decoded = JWT::decode($jwt, $webmaster->password, array('HS256'));
    } catch(Exception $e) {
        exit('Security error JWT');
    }

    if (gettype($decoded)=='object') {
        $myuser =  (array)($decoded);
    } else {
        $myuser = json_decode($decoded, true);
    }
    if ($myuser['password']!=$passwordMD5) {
        exit('Security error JWT2: please read <a href="https://html5-chat.com/blog/how-to-secure-pass-user-data-into-html5-chat/">that article</a>');
    }
    //$myuser['jwt'] = $jwt;
    $_SESSION['jwtPassword'] = $myuser['password'];
    $myuser['password'] = '';

    if ($myuser['image']) {
        if(!Services::fuleExists($myuser['image'])) {
            $myuser['image'] = $config->missingImage;
        }
    }
    if ( base64_encode(base64_decode($myuser['image'])) === $myuser['image']){
        $myuser['image'] = base64_decode($myuser['image']);
    }
    if (!isset($genders)) {
        $genders = [];
    }
    foreach($genders as $gender):
        if (isset($myuser['gender']) && $gender->mappedGender==$myuser['gender']) {
            $myuser['gender'] = $gender->gender;
        }
    endforeach;

    if (is_string($myuser['role']) && stripos($myuser['role'], 'admin')!==false) {
        $myuser['role'] = 'admin';
    }
    else {
        foreach($roles as $role) {
            $mapExistsButCouldNotMap = false;
            if ($role->mappedRole) {
                $mapExistsButCouldNotMap = true;
            }
            if ($role->mappedRole && $myuser['role'] === $role->mappedRole) {
                $myuser['role'] = $role->role;
                $mapExistsButCouldNotMap = false;
                break;
            }
        }
        // in case mapped was badly done
        if ($mapExistsButCouldNotMap && $myuser['role']!='guest') {
            $myuser['role'] = 'user';
        }
        $myuser['status'] = 'online';
    }
} else {
    if (isset($_GET['startRoom'])) {
        $startRoom = $_GET['startRoom'];
    } else {
        $startRoom = '';
    }

    if (isset($_SESSION['admin']) && $_SESSION['admin'] == $_SESSION['webmasterid']) {
        $webmaster = Webmaster::get($webmasterid);
        $myuser = array('username'=>'admin', 'password'=>$webmaster->password, 'email'=>$webmaster->email, 'id'=>$webmaster->id,  'role'=>'admin');
    }
    $username = (count($args)>2)?$args[2]:'';
    $gender = (count($args)>3)?$args[3]:'';
    $avatar = (count($args)>4)?base64_decode($args[4]):'';

    if ($username) {
        $myuser = array('username'=>$username, 'password'=>'', 'email'=>'', 'id'=>rand(1,100000),  'role'=>'user');
    }
    if ($gender) {
        $myuser['gender'] = $gender;
    }
    $image = (isset($_GET['avatar']))? urldecode($_GET['avatar']) : '';
    $myuser['image'] = $image;

    if ($avatar) {
        $myuser['image'] = $avatar;
    }
    $myuser['startRoom'] = $startRoom;
}

$myuser['expired'] = $webmaster->expired;
$myuser['free'] = $webmaster->free;
$myuser['entries'] = $webmaster->entries;
Webmaster::incrementEntries($webmaster->id);


if ($config->disableTOR && Services::IsTorExitPoint()) {
    exit("403 : Not allowed");
}
if ($config->disableVPN && Services::checkProxy($ip) ) {
    exit("403 : Not allowed");
}


$rooms = Room::getAll($webmasterid);
$traductions = DB::getOne('chat_lang', "WHERE webmasterid=$webmasterid",false);
if (!$traductions) {
    $filename = 'lang/' . $config->langue . '.json';
    $fileJson = file_get_contents($filename);
    $traductions = json_decode($fileJson, true);
} else {
    $traductions = (array) $traductions;
}


$config->server = HOME_HTTP;
$config->node = (stripos($_SERVER['REQUEST_URI'],'chat2'))?HTTP_NODE_MULTI2:HTTP_NODE_MULTI;


$config->genders = $genders;
$widthGenderIcon = $config->widthGenderIcon;
$heightGenderIcon = $config->heightGenderIcon;

// check if I am banned !

if (@User::isBanned($ip, $webmasterid, $myuser['id'])) {
    header('location:'.$config->bannedUrl);
    exit;
}
$muted = User::isMuted($ip, $webmasterid, $myuser['id'] );
if ($muted) {
    $myuser['mutedUntil'] = $muted->mutedUntil;
}
$myuser['streamName'] = time();
if (!$config->webrtc) {
    $config->webrtcServer = '';
}
$availableRoles = array("admin", "buyer", "custom1", "custom2", "custom3", "dj", "guest", "moderator", "performer", "seller", "user");
if (!in_array($myuser['role'], $availableRoles)) {
    $myuser['role'] = "guest";
}
$myuser['roles'] = $roles[$myuser['role']];
$myuser['country'] = $country;
$myuser['webmasterid'] = $webmasterid;
$scriptChat = ((basename(__FILE__))!='chat2.php')?"js/chatHTML54live.js":"js/chatHTML54.js?";

$title = "Chat html5 - webcam chat made with HTML5 and webrtc";
$metaDescription = "Webcam video chat made with HTML5 and webrtc. Get Free video chat for your website.";
?>
<?php include 'chatTemplateFlex.php';?>
