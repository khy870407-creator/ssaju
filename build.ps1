# index.html + style.css + content.js + app.js + vendor/ssaju.mjs 를 파일 하나(사주보기.html)로 합칩니다.
# 합친 파일은 서버 없이 더블클릭으로 열 수 있습니다.  실행: powershell -ExecutionPolicy Bypass -File build.ps1
$root = $PSScriptRoot
$enc = New-Object Text.UTF8Encoding $false
function Read-Text($name) { [IO.File]::ReadAllText((Join-Path $root $name), [Text.Encoding]::UTF8) }

$html = Read-Text "index.html"
$css = Read-Text "style.css"
$lib = Read-Text "vendor\ssaju.mjs"
$content = Read-Text "content.js"
$app = Read-Text "app.js"

# 라이브러리: export 문을 return 으로 바꿔 즉시실행 함수 안에 가둡니다 (이름 충돌 방지)
$m = [regex]::Match($lib, 'export\s*\{([^}]*)\};?\s*$')
if (-not $m.Success) { throw "ssaju.mjs export 문을 찾지 못했습니다." }
$pairs = $m.Groups[1].Value.Split(',') | ForEach-Object { $a = $_.Trim() -split '\s+as\s+'; "$($a[1]):$($a[0])" }
$libBody = $lib.Substring(0, $m.Index)
$libJs = "const { calculateSaju, solarToLunar, lunarToSolar } = (() => {`n$libBody`nreturn {$($pairs -join ',')};`n})();"

$contentJs = [regex]::Replace($content, '(?m)^export\s+', '')
$appJs = [regex]::Replace($app, '(?s)^\s*import\s*\{.*?\}\s*from\s*"[^"]+";\s*', '', 'Multiline')
$appJs = [regex]::Replace($appJs, '(?ms)^import\s*\{.*?\}\s*from\s*"[^"]+";\s*$', '')

$script = "<script>`n$libJs`n</script>`n<script>`n{`n$contentJs`n$appJs`n}`n</script>"
$out = $html.Replace('<link rel="stylesheet" href="style.css" />', "<style>`n$css`n</style>")
$out = $out.Replace('<script type="module" src="app.js"></script>', $script)
if ($out.Contains('src="app.js"') -or $out.Contains('href="style.css"')) { throw "치환 실패" }

$dest = Join-Path $root "사주보기.html"
[IO.File]::WriteAllText($dest, $out, $enc)
Write-Host "만들어진 파일: $dest ($([Math]::Round((Get-Item $dest).Length / 1KB)) KB)"
