; installer/setup.iss
#define MyAppName "CAL Time Billing"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Your Org"
#define MyAppExeName "Start-CAL.bat"

[Setup]
AppId={{F8B6B1C9-1169-4F2E-9C3E-7B9E949F0A10}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={pf}\CAL Time Billing
DisableDirPage=yes
DisableProgramGroupPage=yes
OutputDir=installer\dist
OutputBaseFilename=Setup-CalTimeBilling
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin

[Files]
; Copy backend and frontend sources, but not node_modules or built dist
Source: "backend\*"; DestDir: "{app}\backend"; Flags: recursesubdirs createallsubdirs; Excludes: "node_modules\*"
Source: "frontend\*"; DestDir: "{app}\frontend"; Flags: recursesubdirs createallsubdirs; Excludes: "node_modules\*;dist\*"
Source: "scripts\windows\*"; DestDir: "{app}\scripts\windows"; Flags: recursesubdirs createallsubdirs
; Optional icon, only if present

[Icons]
Name: "{autodesktop}\CAL Time Billing"; Filename: "{app}\scripts\windows\Start-CAL.bat"; WorkingDir: "{app}"; IconFilename: "{app}\assets\cal.ico"; IconIndex: 0
Name: "{group}\CAL Time Billing"; Filename: "{app}\scripts\windows\Start-CAL.bat"; WorkingDir: "{app}"; IconFilename: "{app}\assets\cal.ico"; IconIndex: 0

[Run]
; This script installs Node and Postgres if needed (via winget), runs npm, builds frontend, seeds DB, and creates the desktop shortcut.
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\windows\Install-CAL.ps1"""; Flags: runhidden waituntilterminated

[Code]
function FileExists2(FileName: string): Boolean;
begin
  Result := FileExists(FileName);
end;
