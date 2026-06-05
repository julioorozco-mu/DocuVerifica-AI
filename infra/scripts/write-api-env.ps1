param(
  [string]$OutputPath = "apps/api/.env"
)

$ErrorActionPreference = "Stop"

function Read-SupabaseStatusEnv {
  $raw = supabase status -o env
  $values = @{}

  foreach ($line in $raw) {
    if ($line -match "^\s*([^=\s]+)\s*=\s*(.+?)\s*$") {
      $values[$matches[1]] = $matches[2].Trim('"')
    }
  }

  return $values
}

$status = Read-SupabaseStatusEnv
$supabaseUrl = $status["SUPABASE_URL"]
if (-not $supabaseUrl) { $supabaseUrl = $status["API_URL"] }

$anonKey = $status["SUPABASE_ANON_KEY"]
if (-not $anonKey) { $anonKey = $status["ANON_KEY"] }

$dbUrl = $status["SUPABASE_DB_URL"]
if (-not $dbUrl) { $dbUrl = $status["DB_URL"] }
if (-not $dbUrl) { $dbUrl = "postgresql://postgres:postgres@127.0.0.1:54322/postgres" }
$dbUrl = $dbUrl -replace "^postgresql://", "postgresql://"

if (-not $supabaseUrl -or -not $anonKey) {
  throw "No pude leer SUPABASE_URL/SUPABASE_ANON_KEY desde 'supabase status -o env'. Ejecuta 'supabase start' y reintenta."
}

$storageDir = (Resolve-Path "storage/documents").Path

$content = @(
  "DATABASE_URL=$dbUrl",
  "SUPABASE_URL=$supabaseUrl",
  "SUPABASE_ANON_KEY=$anonKey",
  "STORAGE_DIR=$storageDir"
) -join [Environment]::NewLine

Set-Content -LiteralPath $OutputPath -Value $content -Encoding UTF8
Write-Host "Archivo actualizado: $OutputPath"
