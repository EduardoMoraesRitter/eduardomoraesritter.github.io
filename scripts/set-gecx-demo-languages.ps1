param(
  [Parameter(Mandatory = $true)][string]$AppName,
  [Parameter(Mandatory = $true)][string]$DeploymentId
)
$ErrorActionPreference = 'Stop'
if ($AppName -notmatch '^projects/[a-zA-Z0-9-]+/locations/[a-zA-Z0-9-]+/apps/[a-zA-Z0-9-]+$' -or $DeploymentId -notmatch '^[a-zA-Z0-9-]+$') { throw 'Invalid resource name.' }
$gecxToken = gcloud auth print-access-token
if ($LASTEXITCODE -ne 0) { throw 'Authenticate gcloud before continuing.' }
$gecxHeaders = @{ Authorization = "Bearer $gecxToken" }
$gecxBase = "https://ces.googleapis.com/v1beta/$AppName"
function Invoke-GecxJson([string]$Uri, [string]$Method = 'Get', $Body = $null) {
  if ($null -eq $Body) { return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $gecxHeaders }
  $gecxBytes = [System.Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 30))
  return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $gecxHeaders -ContentType 'application/json; charset=utf-8' -Body $gecxBytes
}
$gecxApp = Invoke-GecxJson $gecxBase
$gecxAgent = Invoke-GecxJson "https://ces.googleapis.com/v1beta/$($gecxApp.rootAgent)"
$gecxDeployment = Invoke-GecxJson "$gecxBase/deployments/$DeploymentId"
if ($gecxAgent.instruction -notlike '*Conduza uma conversa curta, natural e segura em português do Brasil.*') { throw 'The agent instruction changed; review before updating.' }

# Preserve a recoverable snapshot in Google before modifying the existing demo.
$gecxBackup = Invoke-GecxJson "$gecxBase/versions" 'Post' @{ displayName = 'Before multilingual browser demo'; description = 'Snapshot before the scoped language preference update.' }
$gecxInstruction = $gecxAgent.instruction.Replace('Conduza uma conversa curta, natural e segura em português do Brasil.', 'Conduza uma conversa curta, natural e segura no idioma preferido pelo utilizador, seguindo as regras de idioma abaixo.')
$gecxInstruction += @'


<idiomas>
Support Portuguese (Brazil), English (United States), Spanish (Spain), and the already configured Italian.
If the user selects a language or sends a message beginning with "Please conduct this conversation in", use that language immediately, including the first greeting. A language preference alone is not a support request: greet briefly in the chosen language and ask how you can help, without calling tools.
Maintain that explicit language preference until the user asks to change it. Without an explicit preference, respond in the language of the user's input; if there is no input yet, default to Portuguese (Brazil).
The quoted Portuguese sentences elsewhere in these instructions are semantic examples, not fixed-language responses. Translate greetings, questions, explanations and farewells naturally into the selected language. Never translate tool names, API field names, ticket IDs or returned identifiers. Keep the existing safety rules, confirmation before creating tickets, and explicit notices that transfers and data are simulated.
Do not claim that selecting Portuguese provides a Portuguese-from-Portugal voice or guaranteed accent.
</idiomas>
'@
$gecxAgentResult = Invoke-GecxJson "https://ces.googleapis.com/v1beta/$($gecxAgent.name)?updateMask=instruction" 'Patch' @{ name = $gecxAgent.name; etag = $gecxAgent.etag; instruction = $gecxInstruction }
$gecxLanguages = $gecxApp.languageSettings
$gecxLanguages.supportedLanguageCodes = @(@($gecxLanguages.supportedLanguageCodes) + @('en-US', 'es-ES') | Select-Object -Unique)
$gecxLanguages | Add-Member -NotePropertyName enableMultilingualSupport -NotePropertyValue $true -Force
$gecxAppResult = Invoke-GecxJson "${gecxBase}?updateMask=languageSettings" 'Patch' @{ name = $gecxApp.name; etag = $gecxApp.etag; languageSettings = $gecxLanguages }
$gecxVersion = Invoke-GecxJson "$gecxBase/versions" 'Post' @{ displayName = 'Multilingual browser demo'; description = 'Adds English and Spanish preferences while retaining Portuguese and Italian; preserves helpdesk tool and safety flow.' }
$gecxPublished = Invoke-GecxJson "$gecxBase/deployments/${DeploymentId}?updateMask=appVersion" 'Patch' @{ name = $gecxDeployment.name; appVersion = $gecxVersion.name }
[PSCustomObject]@{ backupVersion = $gecxBackup.name; previousPublishedVersion = $gecxDeployment.appVersion; publishedVersion = $gecxPublished.appVersion; languageSettings = $gecxAppResult.languageSettings } | ConvertTo-Json -Depth 6
