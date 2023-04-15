$srcFolder = "Site"
$destFolder = "teach"
$dateTime = Get-Date -Format "yyyy-MM-dd_HH'h'-mm'm'-ss's'"
$zipFile = "teach_$dateTime.zip"

# Create the zip archive
Copy-Item $srcFolder $destFolder -recurse -force
Add-Type -Assembly System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($destFolder, $zipFile)
Remove-Item -Recurse -Force teach

# Copy to the server
$username = "richato4"
$hostname = "rkeelan.com"
$userhost = "$username@$hostname"

scp $zipFile $userhost":"$destFolder".zip"