# restauracion_tpi
# Restaura restaurante_tpi desde un respaldo generado con mongodump.

# Detiene el script si falla un comando de PowerShell.
$ErrorActionPreference = "Stop"

# Trabaja desde la carpeta donde esta guardado este script.
Set-Location -LiteralPath $PSScriptRoot

    # Obtiene los respaldos del mas reciente al mas antiguo.
    $backups = @(
        Get-ChildItem -Path ".\resguardos_tpi" -Directory |
            Sort-Object Name -Descending
    )

    if ($backups.Count -eq 0) {
        throw "No se encontraron respaldos disponibles."
    }

    $indice = 0

    do {
        Clear-Host
        Write-Host "Seleccione el respaldo a restaurar"
        Write-Host "Use las flechas. Enter: confirmar. Esc: cancelar."
        Write-Host ""

        # Resalta el respaldo seleccionado.
        for ($i = 0; $i -lt $backups.Count; $i++) {
            if ($i -eq $indice) {
                Write-Host "> $($backups[$i].Name)" -ForegroundColor Cyan
            } else {
                Write-Host "  $($backups[$i].Name)"
            }
        }

        # Espera una tecla sin mostrarla en pantalla.
        $tecla = [Console]::ReadKey($true).Key

        switch ($tecla) {
            "UpArrow" {
                if ($indice -gt 0) {
                    $indice--
                }
            }
            "DownArrow" {
                if ($indice -lt ($backups.Count - 1)) {
                    $indice++
                }
            }
            "Escape" {
                Write-Host "`nRestauracion cancelada."
                return
            }
        }
    } until ($tecla -eq "Enter")

    $respaldo = $backups[$indice].FullName

Write-Host ""

# Lee MONGODB_URI desde el archivo .env ubicado junto a este script.
$uri = (Get-Content -LiteralPath "$PSScriptRoot\.env" -Raw | ConvertFrom-StringData).MONGODB_URI
# Detiene la restauracion si el archivo no contiene la variable de conexion.
if (-not $uri) {
    throw "Falta MONGODB_URI en el archivo .env."
}

# Comprueba que mongorestore este disponible en el PATH.
Get-Command mongorestore -ErrorAction Stop | Out-Null

# Comprueba que la carpeta del respaldo exista.
if (-not (Test-Path -LiteralPath $respaldo -PathType Container)) {
    throw "No se encontro la carpeta del respaldo: $respaldo"
}

# Restaura las colecciones en restaurante_tpi sin eliminarlas previamente.
mongorestore --uri="$uri" --nsInclude="restaurante_tpi.*" "$respaldo"

# Comprueba el codigo de salida del programa externo.
if ($LASTEXITCODE -ne 0) {
    throw "La restauracion fallo. Revisa los mensajes de mongorestore."
}

Write-Host "Restauracion finalizada correctamente en restaurante_tpi."
