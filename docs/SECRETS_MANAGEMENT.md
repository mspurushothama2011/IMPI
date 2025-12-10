# Secrets Management Guide

**Last Updated:** October 2, 2025  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Supported Secret Stores](#supported-secret-stores)
3. [Migration from .env Files](#migration-from-env-files)
4. [GitHub Actions Secrets](#github-actions-secrets)
5. [AWS Secrets Manager](#aws-secrets-manager)
6. [HashiCorp Vault](#hashicorp-vault)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🔐 Overview

This guide covers the migration from local `.env` files to secure secret management solutions for production environments.

### Why Move Away from .env Files?

❌ **Problems with .env files:**
- Can be accidentally committed to version control
- No audit trail for access
- No rotation mechanism
- Shared across team members insecurely
- No encryption at rest
- Hard to manage across multiple environments

✅ **Benefits of Secret Managers:**
- Centralized secret storage
- Encryption at rest and in transit
- Audit logging
- Automated rotation
- Fine-grained access control
- Integration with CI/CD pipelines

---

## 📦 Supported Secret Stores

### 1. GitHub Actions Secrets (for CI/CD)
**Best for:** CI/CD pipelines, automated testing

```yaml
# .github/workflows/ci.yml
env:
  SECRET_KEY: ${{ secrets.SECRET_KEY }}
  MONGO_URI: ${{ secrets.MONGO_URI }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### 2. AWS Secrets Manager
**Best for:** Production AWS deployments

```python
import boto3
import json

def get_secret(secret_name):
    client = boto3.client('secretsmanager', region_name='us-east-1')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

secrets = get_secret('imip/production')
SECRET_KEY = secrets['SECRET_KEY']
MONGO_URI = secrets['MONGO_URI']
```

### 3. HashiCorp Vault
**Best for:** Multi-cloud, Kubernetes deployments

```python
import hvac

client = hvac.Client(url='https://vault.company.com:8200')
client.token = os.environ['VAULT_TOKEN']

secret = client.secrets.kv.v2.read_secret_version(
    path='imip/production',
    mount_point='secret'
)
secrets = secret['data']['data']
```

### 4. Azure Key Vault
**Best for:** Azure deployments

```python
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

credential = DefaultAzureCredential()
client = SecretClient(vault_url="https://imip-vault.vault.azure.net/", credential=credential)

SECRET_KEY = client.get_secret("SECRET-KEY").value
MONGO_URI = client.get_secret("MONGO-URI").value
```

---

## 🔄 Migration from .env Files

### Step 1: Audit Current Secrets

List all secrets currently in `.env`:

```bash
# Current secrets in .env
SECRET_KEY=your-secret-key
REFRESH_SECRET_KEY=your-refresh-secret-key
MONGO_URI=mongodb://user:pass@localhost:27017/imip
OPENAI_API_KEY=sk-...
```

### Step 2: Choose Secret Store

**Development:** Continue using `.env` (never commit!)
**Staging/Production:** Use AWS Secrets Manager or Vault

### Step 3: Create Secrets in Manager

#### For AWS Secrets Manager:

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Create secret
aws secretsmanager create-secret \
  --name imip/production \
  --description "IMIP Production Secrets" \
  --secret-string file://secrets.json
```

**secrets.json:**
```json
{
  "SECRET_KEY": "your-production-secret-key-here",
  "REFRESH_SECRET_KEY": "your-refresh-secret-key-here",
  "MONGO_URI": "mongodb+srv://user:pass@cluster.mongodb.net/imip",
  "OPENAI_API_KEY": "sk-production-key-here"
}
```

### Step 4: Update Application Code

Use the provided `app/secrets_loader.py` module:

```python
# app/config.py
from app.secrets_loader import load_secrets

# Load secrets based on environment
secrets = load_secrets()

SECRET_KEY = secrets.get('SECRET_KEY')
MONGO_URI = secrets.get('MONGO_URI')
OPENAI_API_KEY = secrets.get('OPENAI_API_KEY')
```

### Step 5: Update Deployment

**Docker Compose (Production):**
```yaml
version: '3.8'
services:
  backend:
    image: imip-backend:latest
    environment:
      - ENVIRONMENT=production
      - AWS_REGION=us-east-1
      - SECRET_NAME=imip/production
      # AWS credentials via IAM role (no keys needed)
```

**Kubernetes:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: imip-backend
spec:
  serviceAccountName: imip-sa  # Has IAM role for Secrets Manager
  containers:
  - name: backend
    image: imip-backend:latest
    env:
    - name: ENVIRONMENT
      value: "production"
    - name: SECRET_NAME
      value: "imip/production"
    - name: AWS_REGION
      value: "us-east-1"
```

### Step 6: Remove .env from Production

```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# Remove any accidentally committed secrets
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (⚠️ WARNING: coordinate with team)
git push origin --force --all
```

---

## 🎭 GitHub Actions Secrets

### Adding Secrets to Repository

1. Go to GitHub repository settings
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

```
Name: SECRET_KEY
Value: your-secret-key-here

Name: MONGO_URI
Value: mongodb://...

Name: OPENAI_API_KEY
Value: sk-...
```

### Using in Workflows

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to server
        env:
          SECRET_KEY: ${{ secrets.SECRET_KEY }}
          MONGO_URI: ${{ secrets.MONGO_URI }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          ./deploy.sh
```

### Organization vs Repository Secrets

**Organization Secrets:** Shared across all repos
```
Settings → Organization Settings → Secrets → Actions
```

**Repository Secrets:** Specific to one repo
```
Settings → Repository Settings → Secrets → Actions
```

---

## ☁️ AWS Secrets Manager

### Setup IAM Policy

Create IAM policy for Secrets Manager access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:imip/*"
    }
  ]
}
```

Attach policy to IAM role used by EC2/ECS/Lambda.

### Create Secret

```bash
# Create secret
aws secretsmanager create-secret \
  --name imip/production \
  --description "IMIP Production Environment Secrets" \
  --secret-string '{
    "SECRET_KEY": "prod-secret-key-here",
    "REFRESH_SECRET_KEY": "prod-refresh-key-here",
    "MONGO_URI": "mongodb+srv://...",
    "OPENAI_API_KEY": "sk-..."
  }'

# Update existing secret
aws secretsmanager update-secret \
  --secret-id imip/production \
  --secret-string '{
    "SECRET_KEY": "new-secret-key"
  }'
```

### Access from Application

```python
# app/secrets_loader.py (AWS)
import boto3
import json
import os
from botocore.exceptions import ClientError

def load_aws_secrets():
    """Load secrets from AWS Secrets Manager."""
    secret_name = os.getenv('SECRET_NAME', 'imip/production')
    region_name = os.getenv('AWS_REGION', 'us-east-1')
    
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    
    try:
        response = client.get_secret_value(SecretId=secret_name)
        if 'SecretString' in response:
            return json.loads(response['SecretString'])
        else:
            # Binary secret (decode if needed)
            return json.loads(base64.b64decode(response['SecretBinary']))
    except ClientError as e:
        print(f"Error retrieving secret: {e}")
        raise
```

### Enable Automatic Rotation

```bash
# Enable rotation every 30 days
aws secretsmanager rotate-secret \
  --secret-id imip/production \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:ACCOUNT_ID:function:SecretsManagerRotation \
  --rotation-rules AutomaticallyAfterDays=30
```

### Cost Estimation

- **Storage:** $0.40 per secret per month
- **API Calls:** $0.05 per 10,000 API calls
- **Example:** 5 secrets, 1M API calls/month = $2.00 + $5.00 = $7/month

---

## 🔐 HashiCorp Vault

### Setup Vault

```bash
# Start Vault (dev mode for testing)
vault server -dev

# Set environment
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='dev-token'

# Enable KV v2 secrets engine
vault secrets enable -path=secret kv-v2

# Store secrets
vault kv put secret/imip/production \
  SECRET_KEY="vault-secret-key" \
  MONGO_URI="mongodb://..." \
  OPENAI_API_KEY="sk-..."
```

### Access from Application

```python
# app/secrets_loader.py (Vault)
import hvac
import os

def load_vault_secrets():
    """Load secrets from HashiCorp Vault."""
    vault_url = os.getenv('VAULT_ADDR', 'https://vault.company.com:8200')
    vault_token = os.getenv('VAULT_TOKEN')
    
    client = hvac.Client(url=vault_url, token=vault_token)
    
    if not client.is_authenticated():
        raise Exception("Vault authentication failed")
    
    secret_path = os.getenv('VAULT_SECRET_PATH', 'imip/production')
    response = client.secrets.kv.v2.read_secret_version(
        path=secret_path,
        mount_point='secret'
    )
    
    return response['data']['data']
```

### Dynamic Database Credentials

```bash
# Configure database secrets engine
vault secrets enable database

vault write database/config/mongodb \
  plugin_name=mongodb-database-plugin \
  allowed_roles="imip-app" \
  connection_url="mongodb://{{username}}:{{password}}@mongodb:27017/admin" \
  username="vault-admin" \
  password="vault-password"

# Create role
vault write database/roles/imip-app \
  db_name=mongodb \
  creation_statements='{ "db": "imip", "roles": [{ "role": "readWrite" }] }' \
  default_ttl="1h" \
  max_ttl="24h"

# Application gets fresh credentials
vault read database/creds/imip-app
```

---

## ✅ Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore
.env
.env.*
*.key
*.pem
secrets.json
```

### 2. Use Different Secrets per Environment

```
imip/development
imip/staging
imip/production
```

### 3. Rotate Secrets Regularly

```bash
# Schedule rotation every 90 days
0 0 1 */3 * /usr/local/bin/rotate_secrets.sh
```

### 4. Audit Access

```bash
# AWS CloudTrail for Secrets Manager
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=imip/production

# Vault audit log
vault audit enable file file_path=/var/log/vault_audit.log
```

### 5. Principle of Least Privilege

Only grant access to secrets that are absolutely necessary:

```json
{
  "Effect": "Allow",
  "Action": "secretsmanager:GetSecretValue",
  "Resource": "arn:aws:secretsmanager:*:*:secret:imip/production-*",
  "Condition": {
    "StringEquals": {
      "aws:RequestedRegion": "us-east-1"
    }
  }
}
```

### 6. Monitor for Exposed Secrets

Use tools like:
- **git-secrets** - Prevent committing secrets
- **TruffleHog** - Scan for secrets in git history
- **detect-secrets** - Pre-commit hook

```bash
# Install git-secrets
brew install git-secrets

# Setup
git secrets --install
git secrets --register-aws
```

---

## 🐛 Troubleshooting

### Secret Not Found

```
Error: ResourceNotFoundException: Secrets Manager can't find the specified secret.
```

**Solution:**
```bash
# Verify secret exists
aws secretsmanager list-secrets

# Check region
aws secretsmanager describe-secret --secret-id imip/production --region us-east-1
```

### Access Denied

```
Error: AccessDeniedException: User is not authorized to perform: secretsmanager:GetSecretValue
```

**Solution:**
```bash
# Check IAM permissions
aws iam get-role-policy --role-name imip-backend-role --policy-name SecretsAccess

# Verify instance profile attached
aws ec2 describe-instances --instance-ids i-xxx --query 'Reservations[0].Instances[0].IamInstanceProfile'
```

### Cached Secrets Not Updating

**Solution:**
```python
# Implement cache with TTL
from functools import lru_cache
import time

@lru_cache(maxsize=1)
def get_secrets_with_ttl():
    current_time = time.time()
    if not hasattr(get_secrets_with_ttl, 'last_fetch') or \
       (current_time - get_secrets_with_ttl.last_fetch) > 300:  # 5 min TTL
        get_secrets_with_ttl.last_fetch = current_time
        return load_aws_secrets()
```

---

## 📚 Additional Resources

- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [GitHub Actions Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Remember:** The goal is defense in depth. Even with secret managers, follow security best practices like encryption in transit, network isolation, and regular security audits.

---

**Last Updated:** October 2, 2025  
**Version:** 1.0  
**Maintainer:** DevOps Team
