#!/usr/bin/env pwsh
<#
Restore RDS snapshot into existing VPC subnet group (PowerShell)
Edit the variables below as needed, then run in PowerShell with AWS CLI configured.
#>
Set-StrictMode -Version Latest

$Region = 'eu-central-1'
$SrcDb = 'aws'
$SnapId = "rowdy-snapshot-$(Get-Date -Format 'yyyyMMddHHmmss')"
$RestoreDb = 'rowdy-db-restored'
$DbSubnetGroup = 'rowdy-db-subnet-group'
# Subnets provided by user
$SubnetIds = @('subnet-0a49772b72649f45b','subnet-0c5dba6d21245b53c')
$RdsSg = 'sg-01727cc7d772f18a6'
$Ec2Sg = 'sg-0b547744babcd9ecb'
$DbClass = 'db.t3.medium'

function Run-Aws {
    param([string[]]$Args)
    $out = & aws @Args --region $Region 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "$($Args -join ' ') failed:`n$out"
    }
    return $out
}

Write-Host "Region: $Region"
Write-Host "DB subnet group: $DbSubnetGroup"
Write-Host "Subnets: $($SubnetIds -join ', ')"

try {
    # Create DB subnet group if missing
    try {
        Run-Aws 'rds' 'describe-db-subnet-groups' '--db-subnet-group-name' $DbSubnetGroup | Out-Null
        Write-Host "DB subnet group $DbSubnetGroup already exists. Skipping creation."
    } catch {
        Write-Host "Creating DB subnet group $DbSubnetGroup..."
        Run-Aws 'rds' 'create-db-subnet-group' '--db-subnet-group-name' $DbSubnetGroup '--db-subnet-group-description' 'Rowdy DB subnet group' '--subnet-ids' $SubnetIds
        Write-Host "Created DB subnet group."
    }

    Write-Host "1) Creating snapshot $SnapId from DB instance $SrcDb..."
    Run-Aws 'rds' 'create-db-snapshot' '--db-snapshot-identifier' $SnapId '--db-instance-identifier' $SrcDb

    Write-Host "Waiting for snapshot to become available..."
    & aws rds wait db-snapshot-available --db-snapshot-identifier $SnapId --region $Region
    if ($LASTEXITCODE -ne 0) { throw 'Snapshot wait failed' }
    Write-Host "Snapshot available: $SnapId"

    Write-Host "2) Restoring snapshot into DB instance $RestoreDb..."
    Run-Aws 'rds' 'restore-db-instance-from-db-snapshot' '--db-instance-identifier' $RestoreDb '--db-snapshot-identifier' $SnapId '--db-subnet-group-name' $DbSubnetGroup '--vpc-security-group-ids' $RdsSg '--db-instance-class' $DbClass '--no-publicly-accessible'

    Write-Host "Waiting for restored DB instance to become available (may take several minutes)..."
    & aws rds wait db-instance-available --db-instance-identifier $RestoreDb --region $Region
    if ($LASTEXITCODE -ne 0) { throw 'DB instance wait failed' }

    $endpoint = Run-Aws 'rds' 'describe-db-instances' '--db-instance-identifier' $RestoreDb '--query' 'DBInstances[0].Endpoint.Address' '--output' 'text'
    $endpoint = $endpoint.Trim()
    Write-Host "Restored DB endpoint: $endpoint"

    Write-Host "3) Adding ingress rule in RDS SG $RdsSg to allow EC2 SG $Ec2Sg on port 5432..."
    # ignore error if rule already exists
    try {
        Run-Aws 'ec2' 'authorize-security-group-ingress' '--group-id' $RdsSg '--protocol' 'tcp' '--port' '5432' '--source-group' $Ec2Sg | Out-Null
    } catch {
        Write-Host "Ingress rule may already exist or failed to add: $($_.Exception.Message)"
    }

    Write-Host ""
    Write-Host "Done. Next actions:`n- SSH to your EC2 app host and update Backend/.env DATABASE_URL to:`n  postgres://<user>:<pass>@$endpoint:5432/<dbname>`n- Restart the app: pm2 restart rowdy-cloud-api" -ForegroundColor Cyan

    Write-Host "Verify from EC2:`n  dig +short $endpoint`n  nc -vz -w 5 $endpoint 5432`n  PGPASSWORD='<password>' psql -h $endpoint -U <user> -d <dbname> -c '\\l'  # if psql available`n  curl -v http://127.0.0.1:5000/api/health"

} catch {
    Write-Error "Operation failed: $($_.Exception.Message)"
    exit 1
}

exit 0
