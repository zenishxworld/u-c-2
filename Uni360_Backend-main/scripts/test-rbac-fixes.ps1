$BASE_URL = "http://54.206.87.129:8080"

$ADMIN31_EMAIL    = "vicky.adminnew@email.com"
$ADMIN31_PASSWORD = "Admin@123"

$ADMIN3_EMAIL     = "testadmin.admin1@email.com"
$ADMIN3_PASSWORD  = "Admin@123"

function Invoke-Api {
    param($method, $path, $token = $null, $body = $null)
    $headers = @{ "Content-Type" = "application/json" }
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    $uri = "$BASE_URL$path"
    try {
        if ($body) {
            return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers -Body ($body | ConvertTo-Json) -ErrorAction Stop
        } else {
            return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers -ErrorAction Stop
        }
    } catch {
        Write-Host "  HTTP ERROR on $path : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STEP 1: Login" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$login31 = Invoke-Api POST "/api/v1/auth/login" -body @{ email = $ADMIN31_EMAIL; password = $ADMIN31_PASSWORD }
$TOKEN31  = $login31.data.token
if ($TOKEN31) {
    Write-Host "  [PASS] Admin 31 logged in OK" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Admin 31 login failed - check credentials" -ForegroundColor Red
    Write-Host "  Response: $($login31 | ConvertTo-Json)" -ForegroundColor Yellow
}

$login3 = Invoke-Api POST "/api/v1/auth/login" -body @{ email = $ADMIN3_EMAIL; password = $ADMIN3_PASSWORD }
$TOKEN3  = $login3.data.token
if ($TOKEN3) {
    Write-Host "  [PASS] Admin 3 logged in OK" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Admin 3 login failed - check credentials" -ForegroundColor Red
    Write-Host "  Response: $($login3 | ConvertTo-Json)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUG 2: Applications" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$apps31  = Invoke-Api GET "/api/v1/admin/applications" -token $TOKEN31
$total31 = $apps31.data.pagination.total
Write-Host "  Admin 31 total apps: $total31" -ForegroundColor Yellow

$apps3   = Invoke-Api GET "/api/v1/admin/applications" -token $TOKEN3
$total3  = $apps3.data.pagination.total
Write-Host "  Admin 3  total apps: $total3" -ForegroundColor Yellow

if ($total31 -lt 76 -and $total31 -gt 0) {
    Write-Host "  [PASS] Admin 31 is scoped (not all 76)" -ForegroundColor Green
} elseif ($total31 -eq 76) {
    Write-Host "  [FAIL] Admin 31 still sees ALL 76 apps!" -ForegroundColor Red
} else {
    Write-Host "  [INFO] Admin 31 has $total31 apps (0 = no assigned apps yet)" -ForegroundColor Yellow
}

if ($total31 -ne $total3) {
    Write-Host "  [PASS] Different counts - isolation working" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Same count ($total31) for both admins" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUG 1: Support Tickets" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$tickets31     = Invoke-Api GET "/api/v1/admin/support/tickets" -token $TOKEN31
$ticketCount31 = $tickets31.data.totalCount
Write-Host "  Admin 31 tickets: $ticketCount31" -ForegroundColor Yellow

$tickets3     = Invoke-Api GET "/api/v1/admin/support/tickets" -token $TOKEN3
$ticketCount3 = $tickets3.data.totalCount
Write-Host "  Admin 3  tickets: $ticketCount3" -ForegroundColor Yellow

if ($null -ne $tickets31) {
    Write-Host "  [PASS] Admin 31 got ticket response" -ForegroundColor Green
}
if ($null -ne $tickets3) {
    Write-Host "  [PASS] Admin 3 got ticket response" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUG 3: Pending Documents" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$docs31 = Invoke-Api GET "/api/v1/admin/documents/workflow/pending-review" -token $TOKEN31
if ($docs31 -is [array]) {
    $docCount31 = $docs31.Count
} else {
    $docCount31 = ($docs31.data | Measure-Object).Count
}
Write-Host "  Admin 31 pending docs: $docCount31" -ForegroundColor Yellow

$docs3 = Invoke-Api GET "/api/v1/admin/documents/workflow/pending-review" -token $TOKEN3
if ($docs3 -is [array]) {
    $docCount3 = $docs3.Count
} else {
    $docCount3 = ($docs3.data | Measure-Object).Count
}
Write-Host "  Admin 3  pending docs: $docCount3" -ForegroundColor Yellow

if ($null -ne $docs31) {
    Write-Host "  [PASS] Pending docs endpoint responded for Admin 31" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUG 4: Notification Students" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$students31  = Invoke-Api GET "/api/v1/notifications/students?page=0&size=50" -token $TOKEN31
$stuCount31  = $students31.data.pagination.total
Write-Host "  Admin 31 students: $stuCount31" -ForegroundColor Yellow

$students3   = Invoke-Api GET "/api/v1/notifications/students?page=0&size=50" -token $TOKEN3
$stuCount3   = $students3.data.pagination.total
Write-Host "  Admin 3  students: $stuCount3" -ForegroundColor Yellow

if ($null -ne $students31) {
    Write-Host "  [PASS] Students endpoint responded for Admin 31" -ForegroundColor Green
}

$ids31 = @($students31.data.students | ForEach-Object { $_.id })
$ids3  = @($students3.data.students  | ForEach-Object { $_.id })
$overlap = $ids31 | Where-Object { $ids3 -contains $_ }
if ($overlap.Count -eq 0) {
    Write-Host "  [PASS] Zero student overlap between admins" -ForegroundColor Green
} else {
    Write-Host "  [INFO] $($overlap.Count) shared students (may be correct if same app)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUG 5: Tasks" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$tasks31     = Invoke-Api GET "/api/v1/admin/tasks" -token $TOKEN31
$taskCount31 = $tasks31.totalCount
Write-Host "  Admin 31 tasks: $taskCount31" -ForegroundColor Yellow

$tasks3     = Invoke-Api GET "/api/v1/admin/tasks" -token $TOKEN3
$taskCount3 = $tasks3.totalCount
Write-Host "  Admin 3  tasks: $taskCount3" -ForegroundColor Yellow

if ($taskCount31 -gt 0) {
    Write-Host "  [PASS] Admin 31 has tasks" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Admin 31 has 0 tasks" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FINAL SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bug 1 Tickets  : Admin31=$ticketCount31 | Admin3=$ticketCount3" -ForegroundColor White
Write-Host "  Bug 2 Apps     : Admin31=$total31 | Admin3=$total3 (was 76 for both)" -ForegroundColor White
Write-Host "  Bug 3 Docs     : Admin31=$docCount31 | Admin3=$docCount3" -ForegroundColor White
Write-Host "  Bug 4 Students : Admin31=$stuCount31 | Admin3=$stuCount3" -ForegroundColor White
Write-Host "  Bug 5 Tasks    : Admin31=$taskCount31 | Admin3=$taskCount3" -ForegroundColor White
Write-Host ""
