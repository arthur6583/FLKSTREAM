<?php
header('Content-Type: application/json');
$dbFile = 'db.json';

// Si le fichier n'existe pas, on le crée avec une structure vide
if (!file_exists($dbFile)) {
    file_put_contents($dbFile, json_encode(['requests' => []]));
}

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get') {
    $data = json_decode(file_get_contents($dbFile), true);
    echo json_encode($data['requests'] ?? []);
} 

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'add') {
    $input = json_decode(file_get_contents('php://input'), true);
    $db = json_decode(file_get_contents($dbFile), true);
    
    if (!empty($input['username']) && !empty($input['movieTitle'])) {
        $db['requests'][] = [
            'username' => htmlspecialchars($input['username']),
            'movieTitle' => htmlspecialchars($input['movieTitle']),
            'date' => date('d/m/Y - H:i')
        ];
        file_put_contents($dbFile, json_encode($db));
        echo json_encode(['success' => true]);
    }
}
?>
