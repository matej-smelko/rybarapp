$outputCsv = "C:\Users\pc\OneDrive\Plocha\fishapp\reviry_cr.csv"
$wc = New-Object System.Net.WebClient
$encoding = [System.Text.Encoding]::GetEncoding(1250)

$results = @()

$pages = @(
    @{menuid=5;  type="kaprové"; region="Praha"}
    @{menuid=6;  type="kaprové"; region="Středočeský"}
    @{menuid=7;  type="kaprové"; region="Jihočeský"}
    @{menuid=8;  type="kaprové"; region="Západočeský"}
    @{menuid=9;  type="kaprové"; region="Severočeský"}
    @{menuid=10; type="kaprové"; region="Východočeský"}
    @{menuid=11; type="kaprové"; region="Severní Morava a Slezsko"}
    @{menuid=12; type="kaprové"; region="Moravský rybářský svaz"}
    @{menuid=13; type="kaprové"; region="Rada ÚS"}
    @{menuid=21; type="pstruhové"; region="Praha"}
    @{menuid=22; type="pstruhové"; region="Středočeský"}
    @{menuid=23; type="pstruhové"; region="Jihočeský"}
    @{menuid=24; type="pstruhové"; region="Západočeský"}
    @{menuid=25; type="pstruhové"; region="Severočeský"}
    @{menuid=26; type="pstruhové"; region="Východočeský"}
    @{menuid=27; type="pstruhové"; region="Severní Morava a Slezsko"}
    @{menuid=28; type="pstruhové"; region="Moravský rybářský svaz"}
    @{menuid=29; type="pstruhové"; region="Rada ÚS"}
)

foreach ($page in $pages) {
    $url = "https://www.mrk.cz/rybarske-reviry.php?menuid=" + $page.menuid
    Write-Host ("Fetching " + $page.type + " - " + $page.region + " (menuid=" + $page.menuid + ")...")
    
    $bytes = $wc.DownloadData($url)
    $html = $encoding.GetString($bytes)
    
    # Extract count
    $count = 0
    if ($html -match 'Nalezeno revírů:\s*(\d+)') {
        $count = [int]$matches[1]
    }
    Write-Host ("  Found " + $count + " revírů")
    
    # Parse all <li> items
    $liPattern = '<a\s+href="rybarske-reviry\.php\?id=(\d+)"[^>]*>\s*([\d\s]+)\s*-\s*(.+?)\s*</a>\s*&nbsp;\s*(?:<span\s+class="break768"></span>\s*)?<span\s+style="color:#888">\s*(.*?)\s*</span>'
    $matches = [regex]::Matches($html, $liPattern)
    
    foreach ($m in $matches) {
        $id = $m.Groups[1].Value.Trim()
        $cisloRaw = $m.Groups[2].Value.Trim()
        $nazev = $m.Groups[3].Value.Trim()
        $detail = $m.Groups[4].Value.Trim()
        
        # Extract obec (town) from detail - it's before the first comma
        $obec = ""
        $km = ""
        $ha = ""
        if ($detail -match '^([^,]+),\s*(.+)$') {
            $obec = $matches[1].Trim()
            $rest = $matches[2].Trim()
            if ($rest -match '(\d+[,\d]*)\s*km') { $km = $matches[1] }
            if ($rest -match '(\d+[,\d]*)\s*ha') { $ha = $matches[1] }
        }
        
        $results += [PSCustomObject]@{
            id = $id
            cislo = $cisloRaw
            nazev = $nazev
            obec = $obec
            km = $km
            ha = $ha
            typ = $page.type
            region = $page.region
        }
    }
}

$results | Export-Csv -Path $outputCsv -Encoding UTF8 -NoTypeInformation -Delimiter ","
Write-Host ("`nTotal exported: " + $results.Count + " revírů to " + $outputCsv)
