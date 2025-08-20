<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple backend API to serve configuration
// In production, add proper authentication and rate limiting

$config = [
    'googleClientId' => $_ENV['GOOGLE_CLIENT_ID'] ?? 'your-google-client-id-here',
    'facebookAppId' => $_ENV['FACEBOOK_APP_ID'] ?? 'your-facebook-app-id-here'
];

echo json_encode($config);
?>