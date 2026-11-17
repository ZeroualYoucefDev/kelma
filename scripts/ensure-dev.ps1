$listening = Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue
if ($listening) { exit 0 }
Set-Location (Join-Path $PSScriptRoot '..')
npm run dev
