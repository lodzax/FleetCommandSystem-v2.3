<?php
$dir = '/home9/npivfupq/public_html/fleet';
if (is_dir($dir)) {
    chmod($dir, 0755);
    echo "chmod fleet dir: " . (decoct(fileperms($dir)) & 0777) . "\n";
    $files = scandir($dir);
    foreach ($files as $f) {
        if ($f !== '.' && $f !== '..') {
            $fp = $dir . '/' . $f;
            chmod($fp, 0644);
        }
    }
    echo "done\n";
} else {
    echo "fleet dir not found\n";
}
