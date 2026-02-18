<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$file = 'dados.json';

if (file_exists($file)) {
    echo file_get_contents($file);
} else {
    echo json_encode([
        'logo' => '',
        'cards' => [],
        'bio' => ['name' => 'Matheus Daia', 'text' => '', 'photo' => ''],
        'socials' => ['instagram' => '#', 'youtube' => '#', 'whatsapp' => '#', 'tiktok' => '#']
    ], JSON_UNESCAPED_UNICODE);
}
?>
