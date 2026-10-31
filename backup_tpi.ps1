# backup_tpi
# Este script crea un respaldo completo de restaurante_tpi desde MongoDB Atlas

# Detiene el script si falla un comando de PowerShell.
$ErrorActionPreference = "Stop"

# Trabaja desde la carpeta donde está guardado este script
Set-Location -LiteralPath $PSScriptRoot

# Lee MONGODB_URI desde el archivo .env ubicado junto a este script.
$uri = (Get-Content -LiteralPath "$PSScriptRoot\.env" -Raw | ConvertFrom-StringData).MONGODB_URI
# Detiene el respaldo si el archivo no contiene la variable de conexion.
if (-not $uri) {
    throw "Falta MONGODB_URI en el archivo .env."
}

# Base de datos a la que estamos referenciando
$base = "restaurante_tpi"

# (Opcional) Comprueba que mongodump esté disponible en el PATH
Get-Command mongodump -ErrorAction Stop | Out-Null

# Obtiene la fecha del equipo y construye una ruta relativa.
$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$destino = ".\resguardos_tpi\$fecha"

# Evita reutilizar una carpeta con exactamente la misma fecha y hora.
if (Test-Path -LiteralPath $destino) {
    throw "Ya existe $destino. Conserva esa carpeta con otro nombre antes de repetir el respaldo."
}

# Crea resguardos_tpi y su subcarpeta con la fecha actual.
# Cada vez que se ejecuta el script, se crea una nueva subcarpeta dentro de resguardos_tpi, identificada con la fecha y hora de ejecución.
New-Item -ItemType Directory -Path $destino -Force | Out-Null

# Descarga la base completa: documentos activos e inactivos.
mongodump --uri="$uri" --db="$base" --out="$destino"

# Comprueba el codigo de salida del programa externo, si este falla, muestra un mensaje por consola.
if ($LASTEXITCODE -ne 0) {
    throw "mongodump fallo. La carpeta $destino puede contener un respaldo incompleto. Revisala antes de volver a ejecutar."
}

Write-Host "Respaldo finalizado correctamente en $destino\$base"
