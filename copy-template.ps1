param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[A-Za-z0-9._-]+$')]
  [string]$RunId
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSCommandPath
$templatePath = Join-Path $root 'packages/template'
$evaluationsPath = Join-Path $root 'evaluations'
$destinationPath = Join-Path $evaluationsPath $RunId

if (-not (Test-Path $templatePath)) {
  throw "Template directory was not found: $templatePath"
}

if (Test-Path $destinationPath) {
  throw "Evaluation directory already exists: $destinationPath"
}

New-Item -ItemType Directory -Path $evaluationsPath -Force | Out-Null
Copy-Item -Path $templatePath -Destination $destinationPath -Recurse

$packageJsonPath = Join-Path $destinationPath 'package.json'
$packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
$packageNameSegment = $RunId.ToLowerInvariant()
$packageJson.name = "@coding-agent-basic/$packageNameSegment"
$packageJson | ConvertTo-Json -Depth 20 | Set-Content -Path $packageJsonPath -Encoding utf8

Write-Host "Created evaluation project: evaluations/$RunId"
Write-Host 'Next steps:'
Write-Host '  pnpm install'
Write-Host "  pnpm --filter @coding-agent-basic/$packageNameSegment lint"
Write-Host "  pnpm --filter @coding-agent-basic/$packageNameSegment typecheck"
Write-Host "  pnpm --filter @coding-agent-basic/$packageNameSegment test"