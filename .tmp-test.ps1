$resp = Invoke-WebRequest -Uri 'http://localhost:3000/api/dev/login?role=OWNER' -UseBasicParsing
$match = [regex]::Match($resp.Content, 'access_token=([^;]+)')
if (-not $match.Success) { Write-Error 'login token not found'; exit 1 }
$token = $match.Groups[1].Value
$body = '{"recipients":[{"name":"Test User","phoneNumber":"+233241234567","amount":10,"network":"MTN"}],"currency":"GHS","reference":"TEST-123"}'
$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
$response = Invoke-WebRequest -Uri 'http://localhost:3000/api/payments/disburse' -Method POST -Headers $headers -Body $body -UseBasicParsing
Write-Output "STATUS:$($response.StatusCode)"
Write-Output $response.Content
