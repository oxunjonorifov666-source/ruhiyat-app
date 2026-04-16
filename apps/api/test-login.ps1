
$body = @{
    email = "admin@ruhiyat.uz"
    password = "Oxunjon2002"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    $response | ConvertTo-Json
} catch {
    Write-Host "Error status code: $($_.Exception.Response.StatusCode)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "Error body: $errorBody"
}
