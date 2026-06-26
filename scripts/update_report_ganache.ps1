$ErrorActionPreference = 'Stop'

$dataPath = Join-Path (Get-Location) 'scripts\update_report_ganache_data.json'
$json = [System.IO.File]::ReadAllText($dataPath, [System.Text.Encoding]::UTF8)
$data = $json | ConvertFrom-Json

if (-not (Test-Path -LiteralPath $data.backupPath)) {
  Copy-Item -LiteralPath $data.docPath -Destination $data.backupPath
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $word.Documents.Open($data.docPath, $false, $false)

function Replace-All {
  param(
    [Parameter(Mandatory = $true)] $Document,
    [Parameter(Mandatory = $true)] [string] $FindText,
    [Parameter(Mandatory = $true)] [string] $ReplaceText
  )

  $find = $Document.Content.Find
  $find.ClearFormatting()
  $find.Replacement.ClearFormatting()
  $find.Text = $FindText
  $find.Replacement.Text = $ReplaceText
  $find.Forward = $true
  $find.Wrap = 1
  $find.Format = $false
  $find.MatchCase = $false
  $find.MatchWholeWord = $false
  $find.MatchWildcards = $false
  [void] $find.Execute($FindText, $false, $false, $false, $false, $false, $true, 1, $false, $ReplaceText, 2)
}

foreach ($pair in $data.replacements) {
  Replace-All $doc ([string] $pair[0]) ([string] $pair[1])
}

foreach ($prop in $data.paragraphs.PSObject.Properties) {
  $idx = [int] $prop.Name
  $doc.Paragraphs.Item($idx).Range.Text = ([string] $prop.Value) + "`r"
}

$doc.Save()
$doc.Close($true)
try { $word.Quit() } catch {}

Write-Output ('UPDATED ' + $data.docPath)
