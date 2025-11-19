<#
Setup helper for Windows (PowerShell).

Usage: run this from the `backend` folder in an elevated PowerShell or normal PowerShell.
    .\setup_windows.ps1

What it does:
- Checks for `python` or `py` launcher
- If missing and `winget` is available, attempts to install Python 3
- Creates a virtualenv `venv`, activates it, installs requirements and starts the app

Notes:
- If Windows shows the "Install from the Microsoft Store" prompt, open
  Settings > Apps > App execution aliases and disable the `python.exe`/`python3.exe` entries
  from the Microsoft Store to avoid that behavior.
#>

function Has-Command($name) {
    return (Get-Command $name -ErrorAction SilentlyContinue) -ne $null
}

Write-Host "Checking for Python on PATH..."

$pyExists = Has-Command python
$pyLauncher = Has-Command py

if (-not $pyExists -and -not $pyLauncher) {
    Write-Warning "Python not found on PATH."

    if (Has-Command winget) {
        Write-Host "winget found. Attempting to install Python 3 via winget (may require elevation)."
        try {
            winget install --id Python.Python.3 -e --silent
        } catch {
            Write-Warning "winget install failed or requires user interaction. Please install Python manually from https://www.python.org/downloads/ and ensure 'Add Python to PATH' is checked."
            exit 1
        }

        # re-check
        Start-Sleep -Seconds 2
        if (-not Has-Command python -and -not Has-Command py) {
            Write-Warning "Python still not found after winget install. Please restart your shell or add Python to PATH manually."
            exit 1
        }
    } else {
        Write-Warning "winget not available. Please install Python from https://www.python.org/downloads/ and ensure 'Add Python to PATH' is checked."
        exit 1
    }
}

if (Has-Command py) {
    $pythonCmd = 'py'
} else {
    $pythonCmd = 'python'
}

Write-Host "Using Python command: $pythonCmd"

# Create virtual environment
if (-not (Test-Path .\venv)) {
    Write-Host "Creating virtual environment (venv)..."
    & $pythonCmd -3 -m venv venv
}

Write-Host "Activating virtual environment..."
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
. .\venv\Scripts\Activate.ps1

Write-Host "Upgrading pip and installing requirements..."
python -m pip install --upgrade pip
if (Test-Path .\requirements.txt) {
    python -m pip install -r requirements.txt
} else {
    Write-Warning "requirements.txt not found. Skipping pip install -r requirements.txt"
}

Write-Host "Starting the application..."
python run.py
