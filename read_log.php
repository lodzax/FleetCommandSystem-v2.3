<?php
$f = '/home9/npivfupq/public_html/fleet/stderr.log';
$size = @filesize($f);
if (!$size) { echo "ERROR: cannot stat"; exit; }
$fp = @fopen($f, 'r');
if (!$fp) { echo "ERROR: cannot open"; exit; }
fseek($fp, -3000, SEEK_END);
$data = fread($fp, 3000);
fclose($fp);
echo htmlspecialchars($data);
