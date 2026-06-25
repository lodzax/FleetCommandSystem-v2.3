$apiKey = "UODXJAVLO7L04SPR72R8ML8JD3SCONGG"
$cpanelUser = "npivfupq"
$baseUrl = "https://mineazy.co.zw:2083/execute/Fileman"

Add-Type -AssemblyName System.Web

$distFiles = Get-ChildItem -Recurse -File -Path "dist" | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Item "dist").FullName.Length + 1)
    @{ FullName = $_.FullName; RelativePath = $relativePath.Replace('\', '/') }
}

foreach ($file in $distFiles) {
    $remotePath = "/home9/npivfupq/public_html/fleet/dist/$($file.RelativePath)"
    Write-Host "Uploading $($file.RelativePath)..."
    
    $dir = [System.Web.HttpUtility]::UrlEncode($remotePath.Substring(0, $remotePath.LastIndexOf('/')))
    $auth = "cpanel ${cpanelUser}:${apiKey}"
    
    $result = curl.exe -s -X POST "${baseUrl}/upload_files" `
        -H "Authorization: ${auth}" `
        -F "dir=${dir}" `
        -F "file=@`"$($file.FullName)`""

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Failed: $($file.RelativePath)" -ForegroundColor Red
    } else {
        Write-Host "  OK: $($file.RelativePath)" -ForegroundColor Green
    }
}

Write-Host "`nUpload complete. Deploy via CloudLinux Node.js Selector to apply changes."
