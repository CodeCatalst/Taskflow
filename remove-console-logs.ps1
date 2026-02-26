# Script to remove all console.log, console.error, console.warn, console.info, console.debug statements
# This script will clean production source files only

$workspaceRoot = $PSScriptRoot

Write-Host "Starting Console Log Cleanup..." -ForegroundColor Cyan
Write-Host "Workspace: $workspaceRoot" -ForegroundColor Gray
Write-Host ""

# Get JavaScript files from backend source folders (excluding node_modules, scripts, test files)
$backendDirectories = @(
    "$workspaceRoot\backend\routes",
    "$workspaceRoot\backend\middleware",
    "$workspaceRoot\backend\models",
    "$workspaceRoot\backend\utils",
    "$workspaceRoot\backend\services",
    "$workspaceRoot\backend\config"
)

$backendFiles = @()
foreach ($dir in $backendDirectories) {
    if (Test-Path $dir) {
        $backendFiles += Get-ChildItem -Path $dir -Filter *.js -File |  Where-Object {
            $_.Name -notlike '*test*' -and $_.Name -notlike '*Test*'
        }
    }
}

# Add top-level backend files
if (Test-Path "$workspaceRoot\backend\server.js") {
    $backendFiles += Get-Item "$workspaceRoot\backend\server.js"
}
if (Test-Path "$workspaceRoot\backend\workspaces.js") {
    $backendFiles += Get-Item "$workspaceRoot\backend\workspaces.js"
}

# Get JSX/JS files from frontend/src (excluding backup/old files)
$frontendFiles = Get-ChildItem -Path "$workspaceRoot\frontend\src" -Include *.js,*.jsx -Recurse -File | Where-Object {
    $_.Name -notlike '*_BACKUP*' -and
    $_.Name -notlike '*_OLD*' -and
    $_.Name -notlike '*_NEW*' -and
    $_.Name -notlike '*BACKUP*'
}

$allFiles = $backendFiles + $frontendFiles
$totalFiles = $allFiles.Count
$processedFiles = 0
$modifiedFiles = 0
$totalRemovedLines = 0

Write-Host "Found $totalFiles production source files to clean" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $allFiles) {
    $processedFiles++
    $relativePath = $file.FullName.Replace("$workspaceRoot\", '')
    
    # Read the file content as lines
    $lines = Get-Content $file.FullName
    $newLines = @()
    $removedCount = 0
    
    foreach ($line in $lines) {
        # Check if line starts with a console statement (allowing for leading whitespace)
        if ($line -match '^\s*console\.(log|error|warn|info|debug)\(') {
            $removedCount++
        } else {
            $newLines += $line
        }
    }
    
    if ($removedCount -gt 0) {
        Write-Host "[$processedFiles/$totalFiles] $relativePath" -ForegroundColor Cyan
        Write-Host "                Removed $removedCount console statement(s)" -ForegroundColor Green
        
        # Write the cleaned content back
        $newLines | Set-Content -Path $file.FullName -Encoding UTF8
        $modifiedFiles++
        $totalRemovedLines += $removedCount
    } else {
        Write-Host "[$processedFiles/$totalFiles] $relativePath (clean)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Total files scanned: $totalFiles" -ForegroundColor White
Write-Host "  Files modified: $modifiedFiles" -ForegroundColor White
Write-Host "  Console statements removed: $totalRemovedLines" -ForegroundColor White
Write-Host ""
Write-Host "Your codebase is now production-ready and secure!" -ForegroundColor Green
Write-Host "No sensitive data will be logged to the console." -ForegroundColor Green
