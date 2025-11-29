<?php
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if ($data) {
    $serverTime = microtime(true) * 1000;
    
    $response = [
        'status' => 'success',
        'serverTime' => $serverTime,
        'receivedId' => $data['id']
    ];

    $logLine = $data['id'] . " | " . $data['msg'] . " | " . $data['clientTime'] . " | " . $serverTime . "\n";
    file_put_contents('server_logs.txt', $logLine, FILE_APPEND);

    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    echo json_encode(['status' => 'error', 'msg' => 'No data']);
}
?>