<?php
// FleetCommand Deployment Script
$action = $_GET['action'] ?? '';

// JWT secret generator
function generateJWTSecret($length = 64) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    $secret = '';
    for ($i = 0; $i < $length; $i++) {
        $secret .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $secret;
}

if ($action === 'cmd') {
    $cmd = $_GET['cmd'] ?? '';
    if ($cmd) {
        $output = shell_exec($cmd . ' 2>&1');
        echo nl2br(htmlspecialchars($output ?: '(empty output)'));
    }
    exit;
}

if ($action === 'env') {
    $dbPass = $_GET['db_pass'] ?? '';
    $appUrl = 'https://fleet.mineazy.co.zw';
    $jwt = generateJWTSecret();
    
    $env = "DB_HOST=localhost\n";
    $env .= "DB_PORT=3306\n";
    $env .= "DB_USER=npivfupq_fleet_admin\n";
    $env .= "DB_PASSWORD={$dbPass}\n";
    $env .= "DB_NAME=npivfupq_fleet\n";
    $env .= "JWT_SECRET={$jwt}\n";
    $env .= "APP_URL={$appUrl}\n";
    $env .= "API_PORT=3001\n";
    
    $root = '/home9/npivfupq/public_html/fleet';
    if (is_dir($root)) {
        file_put_contents($root . '/.env', $env);
        echo "OK: .env created\n";
    } else {
        echo "ERROR: fleet directory not found\n";
    }
    exit;
}

if ($action === 'npm') {
    $root = '/home9/npivfupq/public_html/fleet';
    if (!is_dir($root . '/node_modules')) {
        $output = shell_exec("cd {$root} && npm install --production 2>&1");
        echo $output;
    } else {
        echo "OK: node_modules already exists\n";
    }
    exit;
}

if ($action === 'status') {
    $root = '/home9/npivfupq/public_html/fleet';
    echo "fleet dir exists: " . (is_dir($root) ? 'YES' : 'NO') . "\n";
    echo "package.json: " . (file_exists($root . '/package.json') ? 'YES' : 'NO') . "\n";
    echo ".env: " . (file_exists($root . '/.env') ? 'YES' : 'NO') . "\n";
    echo "node_modules: " . (is_dir($root . '/node_modules') ? 'YES' : 'NO') . "\n";
    echo "server/prod.cjs: " . (file_exists($root . '/server/prod.cjs') ? 'YES' : 'NO') . "\n";
    exit;
}

if ($action === 'git') {
    $root = '/home9/npivfupq/public_html/fleet';
    // Check if .git exists
    if (is_dir($root . '/.git')) {
        echo "Git repo exists. Pulling...\n";
        $output = shell_exec("cd {$root} && git pull origin main 2>&1");
        echo $output;
    } else {
        echo "No git repo found. Cloning...\n";
        $output = shell_exec("cd /home9/npivfupq/public_html && rm -rf fleet && git clone https://github.com/lodzax/FleetCommandSystem-v2.3 fleet 2>&1");
        echo $output;
    }
    exit;
}

if ($action === 'sync') {
    $root = '/home9/npivfupq/public_html/fleet';
    $output = shell_exec("cd {$root} && git fetch origin main && git reset --hard origin/main 2>&1");
    echo $output;
    exit;
}

if ($action === 'permissions') {
    $root = '/home9/npivfupq/public_html/fleet';
    shell_exec("find {$root} -type d -exec chmod 755 {} \\; 2>&1");
    shell_exec("find {$root} -type f -exec chmod 644 {} \\; 2>&1");
    echo "OK: permissions set\n";
    exit;
}

?>
<!DOCTYPE html>
<html><head><title>FleetCommand Deploy</title></head>
<body><h1>FleetCommand Deployment Helper</h1>
<p>Available actions: ?action=status, ?action=git, ?action=sync, ?action=npm, ?action=env&db_pass=YOUR_DB_PASS, ?action=cmd&cmd=YOUR_COMMAND</p>
</body></html>
