<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit; // Handle CORS preflight
}

$dbFile = 'users.json';

// Initialize DB file if not exists
if (!file_exists($dbFile)) {
    file_put_contents($dbFile, json_encode(['users' => []]));
}

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
        exit;
    }

    $db = json_decode(file_get_contents($dbFile), true);
    if (!isset($db['users'])) {
        $db['users'] = [];
    }

    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    // REGISTER ACTION
    if ($action === 'register') {
        if (empty($email) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'L\'email et le mot de passe sont requis.']);
            exit;
        }

        // Check if user exists
        foreach ($db['users'] as $user) {
            if ($user['email'] === $email) {
                echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé.']);
                exit;
            }
        }

        // Create new user (Hash password for security)
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $db['users'][] = [
            'id' => uniqid('user_', true),
            'email' => htmlspecialchars($email),
            'password' => $hashedPassword,
            'createdAt' => date('Y-m-d H:i:s')
        ];

        file_put_contents($dbFile, json_encode($db));
        echo json_encode(['success' => true, 'message' => 'Inscription réussie !']);
        exit;
    }

    // LOGIN ACTION
    if ($action === 'login') {
        if (empty($email) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Veuillez entrer vos identifiants.']);
            exit;
        }

        foreach ($db['users'] as $user) {
            if ($user['email'] === $email) {
                // Verify password
                if (password_verify($password, $user['password'])) {
                    // Do not send password back to fontend
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Connexion réussie',
                        'user' => [
                            'id' => $user['id'],
                            'email' => $user['email']
                        ]
                    ]);
                    exit;
                }
            }
        }

        echo json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect.']);
        exit;
    }
}

// Invalid Request
http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Action non supportée']);
?>
