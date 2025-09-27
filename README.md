# Cal Time Billing for Windows

Simple Windows installer for the Cal Time Billing desktop app.

## System requirements

- Windows 10 or Windows 11, 64-bit  
- About 200 MB free disk space  
- Standard user account is fine. Installer may ask for admin if you choose Program Files.

## Download

Get the latest installer from the Releases page:  
https://github.com/owaisitoru/cal-time-billing/releases/latest/download/Setup-CalTimeBilling.exe

## Verify the download

Optional but recommended.

**SHA256 checksum**  
```
e88083143e156c98352252f315ea66dcc115f23e2daadeaea4996b1672723305
```

**PowerShell**  
```powershell
Get-FileHash .\Setup-CalTimeBilling.exe -Algorithm SHA256
```
The value must match the checksum shown above.

The installer is not digitally signed, so Windows SmartScreen may show a warning. Click "More info" then "Run anyway" if you trust the source.

## Install

1. Close the app if it is already running.  
2. Double click `Setup-CalTimeBilling.exe`.  
3. Choose the install location.  
   - If you do not have admin rights, choose a folder in your user profile, for example `C:\Users\%USERNAME%\AppData\Local\CalTimeBilling`.  
4. Leave the default options unless you know you need something different.  
5. Click Install and wait for completion.  
6. Click Finish to launch the app or launch it later from the Start menu.

## First run

- Open Start and search for **Cal Time Billing**.  
- The app will start with the default settings.  
- If you are using company antivirus or application control, allow the app if prompted.

## Update

- Download the new installer from Releases and run it.  
- You do not need to uninstall first. Your settings and data stay in place.

## Uninstall

1. Open **Settings -> Apps -> Installed apps**.  
2. Find **Cal Time Billing**, click **Uninstall**, and follow the prompts.  
3. If you chose a custom folder at install time, remove that folder after uninstall if you want to delete leftover files.

## Troubleshooting

**SmartScreen or antivirus warns about the file**  
This installer is unsigned. Verify the SHA256 checksum. If it matches and you downloaded from this repository's Releases, it is the same file we published.

**I cannot install without admin rights**  
Choose a folder inside your user profile when the installer asks for the install location.

**Nothing happens when I run the installer**  
Right click the installer, choose **Properties**, check **Unblock**, click **OK**, then run it again.

**App does not start**  
Reboot and try again. If it still fails, reinstall using the newest installer from Releases.

## Advanced install options

These are standard Inno Setup options for IT and power users.

**Silent install to a custom folder:**  
```bat
Setup-CalTimeBilling.exe /VERYSILENT /NORESTART /DIR="C:\CalTimeBilling"
```

**Create an install log:**  
```bat
Setup-CalTimeBilling.exe /LOG=install.log
```

**Silent uninstall:**  
```bat
"%ProgramFiles%\Cal Time Billing\unins000.exe" /VERYSILENT
```

Adjust paths if you installed to a different folder.

## Privacy

The installer does not contact any server. The app runs locally. If your firewall asks, you can block the installer. The app may need network access only if you enable online features in the app.

## Support

Open an issue in this repository with details and steps to reproduce the problem.  
Include your Windows version and whether you installed as admin or per user.
