<?php

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
date_default_timezone_set('Europe/Kyiv');

usleep(rand(10000, 50000)); 

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if ($data) {
    $serverTimestamp = microtime(true);
    
    $dt = DateTime::createFromFormat('U.u', sprintf('%.6F', $serverTimestamp));
    if (!$dt) {
        $dt = new DateTime();
        $dt->setTimestamp((int)$serverTimestamp);
    }
    $dt->setTimezone(new DateTimeZone('Europe/Kyiv'));
    
    $serverTimeReadable = $dt->format('H:i:s.u');

    $response = [
        'status' => 'success',
        'serverTimestamp' => $serverTimestamp * 1000,
        'serverTimeReadable' => $serverTimeReadable,
        'receivedId' => $data['id']
    ];

    $logLine = "ID: " . $data['id'] . " | ServerTime: " . $serverTimeReadable . "\n";
    file_put_contents('server_logs.txt', $logLine, FILE_APPEND);

    echo json_encode($response);
} else {
    echo json_encode(['status' => 'error', 'msg' => 'No data']);
}
?>