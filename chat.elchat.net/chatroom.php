<?php
$page = "vidchat3";
header('Expires: Sun, 01 Jan 2014 00:00:00 GMT');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Cache-Control: post-check=0, pre-check=0', FALSE);
header('Pragma: no-cache');
//ini_set('display_errors', 1);error_reporting(E_ALL);
require_once 'vendor/autoload.php';
require_once 'Config.php';
use \Firebase\JWT\JWT;

if ($_SERVER['SERVER_NAME']=='66.165.225.122') {
     exit('');
}

if ($_SERVER['SERVER_NAME']=='sockets.elchat.net') {
     exit('');
}


function encode($string) {
    try{

        $json = json_decode($string);
        $password = $json->password;
        $json->password = md5($password);
        $json = json_encode($json);
        $jwt = JWT::encode($json, $password);
        return($jwt);
        // tester le JWT ici

        $decoded = json_decode(JWT::decode($jwt, $password, array('HS256')));
        print_r($decoded);
        exit("*");
        $myuser = (array)$decoded;

        $myuser['isAdmin'] = ($myuser['role']=='admin');
        $myuser['jwt'] = $jwt;
        print_r($myuser);

    }
    catch (Exception $e) {
        exit('Bad JSON');
    }
}
include "../header.php";

if ($user->user_info["user_id"] > 0) {
} else {
    exit("ok");
    //header("Location:/login.php");
    exit;
}
$json = json_encode(array('username' => $user->user_info["user_username"], 'password' => 'reiki123', 'gender' => 'male', 'role' => 'user',
    'profile' => base64_encode('https://server2.buychatroom.com/profile.php?user=' . $user->user_info["user_username"]),
    'image' => "https://server2.buychatroom.com" . $user->user_photo("/images/nophoto.png")
    ));
$encoded = encode($json);
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>chat</title>
</head>
<body>
<div style="width: 100%;height:640px ;">
    <script src="https://server2.buychatroom.com/script2/<?=WEBMASTERID?>/<?=$encoded?>"></script>

</div>
</body>
</html>
