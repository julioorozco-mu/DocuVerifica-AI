param(
  [Parameter(Mandatory = $true)]
  [string]$Email,

  [Parameter(Mandatory = $true)]
  [string]$Password,

  [string]$FullName = "",

  [ValidateSet("admin", "revisor")]
  [string]$Role = "revisor"
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

$serviceRoleKey = $status["SUPABASE_SERVICE_ROLE_KEY"]
if (-not $serviceRoleKey) { $serviceRoleKey = $status["SERVICE_ROLE_KEY"] }

if (-not $supabaseUrl -or -not $serviceRoleKey) {
  throw "No pude leer SUPABASE_URL/SERVICE_ROLE_KEY desde 'supabase status -o env'. Ejecuta 'supabase start' y reintenta."
}

if (-not $FullName) {
  $FullName = $Email.Split("@")[0]
}

$body = @{
  email = $Email
  password = $Password
  email_confirm = $true
  user_metadata = @{
    full_name = $FullName
    role = $Role
  }
} | ConvertTo-Json -Depth 5

$headers = @{
  "Authorization" = "Bearer $serviceRoleKey"
  "apikey" = $serviceRoleKey
  "Content-Type" = "application/json"
}

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "$($supabaseUrl.TrimEnd('/'))/auth/v1/admin/users" `
  -Headers $headers `
  -Body $body

Write-Host "Usuario GoTrue creado: $($response.email) [$Role]"
