$ruleBlockName = "DocuVerifica-AI: Block Supabase External"
$ports = "54321,54322,54323,54324"

# Eliminar reglas existentes
Remove-NetFirewallRule -DisplayName $ruleBlockName -ErrorAction SilentlyContinue

# Regla de bloqueo especificando RemoteAddress diferente a las locales.
# Bloquea todo excepto localhost (127.0.0.1)
New-NetFirewallRule -DisplayName $ruleBlockName -Direction Inbound -LocalPort $ports -Protocol TCP -Action Block -RemoteAddress "0.0.0.0-127.0.0.0", "127.0.0.2-255.255.255.255" -Profile Any

Write-Host "Regla de firewall creada: $ruleBlockName"
Write-Host "Se bloquean todas las IPs externas para los puertos de Supabase ($ports). Solo el Localhost tiene acceso."
