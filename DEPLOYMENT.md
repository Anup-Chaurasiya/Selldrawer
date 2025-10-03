# Deployment Guide for Upsellity AI on AWS ECS

This guide covers the complete setup for deploying your Shopify app to AWS ECS with the production URL `https://app.upsellity.com`.

## Prerequisites

1. AWS Account with ECS, ECR, and appropriate IAM permissions
2. Domain `app.upsellity.com` configured with SSL certificate in AWS Certificate Manager
3. Load Balancer configured to route traffic to ECS service
4. GitHub repository with Actions enabled

## Required GitHub Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

```
AWS_ACCESS_KEY_ID          # AWS credentials for deployment
AWS_SECRET_ACCESS_KEY      # AWS secret key
DATABASE_URL               # Production database URL (PostgreSQL recommended)
SHOPIFY_API_KEY           # From Shopify Partner Dashboard
SHOPIFY_API_SECRET        # From Shopify Partner Dashboard
SHOPIFY_CART_UPSELL_EXTENSION_ID  # Extension ID after deploying extension
```

### How to Get These Values

#### AWS Credentials
1. Go to AWS IAM Console
2. Create a user with policies: `AmazonECS_FullAccess`, `AmazonEC2ContainerRegistryFullAccess`
3. Generate access keys

#### Shopify Credentials
1. Go to [Shopify Partner Dashboard](https://partners.shopify.com/)
2. Select your app
3. Copy the Client ID (API Key) and Client Secret (API Secret)

#### Database URL
For production, use PostgreSQL or MySQL instead of SQLite:
```
# PostgreSQL example:
postgresql://username:password@host:5432/database_name

# MySQL example:
mysql://username:password@host:3306/database_name
```

## AWS Infrastructure Setup

### 1. Create ECR Repository
```bash
aws ecr create-repository \
  --repository-name upsellity/app \
  --region ap-south-1
```

### 2. Create ECS Cluster
```bash
aws ecs create-cluster \
  --cluster-name upsellity \
  --region ap-south-1
```

### 3. Create Task Definition

Create a task definition with the following key configurations:

**Task Definition Name:** `upsellity-app`  
**Container Name:** `app`  
**Port Mappings:** 3000  
**Memory:** 512 MB (minimum)  
**CPU:** 256 units (minimum)

Environment Variables (these will be injected by GitHub Actions):
- `NODE_ENV=production`
- `SHOPIFY_APP_URL=https://app.upsellity.com`
- `SHOPIFY_API_KEY=<from secrets>`
- `SHOPIFY_API_SECRET=<from secrets>`
- `DATABASE_URL=<from secrets>`
- `SCOPES=write_products,read_products,read_product_listings,write_checkouts,read_checkouts`

### 4. Create ECS Service

```bash
aws ecs create-service \
  --cluster upsellity \
  --service-name upsellity-app-service \
  --task-definition upsellity-app \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=app,containerPort=3000"
```

### 5. Configure Load Balancer

1. Create Application Load Balancer (ALB)
2. Add HTTPS listener on port 443 with SSL certificate for `app.upsellity.com`
3. Create target group pointing to ECS tasks on port 3000
4. Configure health check path: `/` or `/auth/login`

### 6. DNS Configuration

Add A record or CNAME in your DNS provider:
```
app.upsellity.com → ALB DNS name (or use Route53 Alias)
```

## Shopify App Configuration

### Update Shopify Partner Dashboard

1. Go to your app in Shopify Partner Dashboard
2. Update **App URL** to: `https://app.upsellity.com`
3. Update **Allowed redirection URLs**:
   - `https://app.upsellity.com/auth/callback`
   - `https://app.upsellity.com/auth/shopify/callback`
   - `https://app.upsellity.com/api/auth/callback`

### Deploy Using Production Config

The repository now includes `shopify.app.prod.toml` for production deployments.

To deploy the app configuration to Shopify:

```bash
# Link to production configuration
shopify app config use shopify.app.prod.toml

# Deploy the app
shopify app deploy
```

## Extension Deployment

### Deploy Cart Upsell Extension

```bash
cd extensions/cart-upsell
shopify app deploy
```

After deployment, copy the Extension ID and add it to GitHub Secrets as `SHOPIFY_CART_UPSELL_EXTENSION_ID`.

### Configure Extension in Theme

1. Install the app on a test store
2. Go to theme editor
3. Add the "Cart Upsell Widget" block to the cart page
4. **Important:** Set the "App URL" setting to `https://app.upsellity.com`

## Deployment Process

### Automatic Deployment via GitHub Actions

The deployment is automated through GitHub Actions. Every push to `main` branch will:

1. Build Docker image
2. Push to ECR
3. Update ECS task definition with new image and environment variables
4. Deploy to ECS service
5. Wait for deployment to stabilize

### Manual Deployment

If you need to deploy manually:

```bash
# Build and push Docker image
docker build -t upsellity-app .
docker tag upsellity-app:latest <ECR_REGISTRY>/upsellity/app:latest
docker push <ECR_REGISTRY>/upsellity/app:latest

# Update ECS service
aws ecs update-service \
  --cluster upsellity \
  --service upsellity-app-service \
  --force-new-deployment
```

## Database Migrations

The app runs migrations automatically on startup via the `docker-start` script:

```json
"docker-start": "npm run setup && npm run start",
"setup": "prisma generate && prisma migrate deploy"
```

### Manual Migration (if needed)

```bash
# Connect to ECS task
aws ecs execute-command \
  --cluster upsellity \
  --task <TASK_ID> \
  --container app \
  --interactive \
  --command "/bin/sh"

# Inside container
npm run prisma migrate deploy
```

## Monitoring and Troubleshooting

### View Logs

```bash
# View ECS service logs
aws logs tail /ecs/upsellity-app --follow --region ap-south-1
```

### Common Issues

#### 1. APP_URL Not Defined Error
**Solution:** Ensure `SHOPIFY_APP_URL` is set in the GitHub Actions workflow (already fixed in `.github/workflows/deploy-to-ecs.yml`)

#### 2. Database Connection Error
**Solution:** 
- Verify `DATABASE_URL` secret is correctly configured
- Ensure security groups allow traffic from ECS to database
- For RDS, ensure it's in the same VPC or VPC peering is configured

#### 3. Extension Not Loading
**Solution:**
- Verify the extension "App URL" setting is set to `https://app.upsellity.com`
- Check browser console for CORS or network errors
- Ensure the API route `/api/cart-config` is accessible

#### 4. OAuth/Authentication Errors
**Solution:**
- Verify redirect URLs in Shopify Partner Dashboard match exactly
- Ensure `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are correct
- Check that `SCOPES` match what's configured in `shopify.app.prod.toml`

### Health Check

Test if your app is running:

```bash
curl https://app.upsellity.com/
```

## Security Considerations

1. **Never commit secrets** - All sensitive data should be in GitHub Secrets or AWS Secrets Manager
2. **Use HTTPS only** - Shopify requires HTTPS for all app URLs
3. **Rotate credentials regularly** - Update API keys and database passwords periodically
4. **Enable AWS CloudWatch Logs** - Monitor for security issues
5. **Use IAM roles** - For ECS tasks accessing AWS services, use task roles instead of credentials

## Scaling

### Horizontal Scaling

Update the desired count in ECS service:

```bash
aws ecs update-service \
  --cluster upsellity \
  --service upsellity-app-service \
  --desired-count 3
```

### Vertical Scaling

Modify task definition CPU/memory and redeploy:

```bash
# Update task definition with more resources
aws ecs register-task-definition \
  --family upsellity-app \
  --cpu 512 \
  --memory 1024 \
  ...
```

## Cost Optimization

1. **Use Fargate Spot** for non-critical workloads (not recommended for production)
2. **Right-size resources** - Start small and scale based on metrics
3. **Enable container insights** only if needed (adds cost)
4. **Use CloudWatch Logs retention** - Set to 7-30 days instead of infinite

## Backup and Disaster Recovery

1. **Database Backups**: Enable automated backups for RDS
2. **Configuration Backup**: Keep `shopify.app.prod.toml` in version control
3. **Image Versioning**: ECR images are tagged with git commit SHA for rollback

### Rollback Procedure

```bash
# Find previous task definition revision
aws ecs describe-task-definition --task-definition upsellity-app

# Update service to previous revision
aws ecs update-service \
  --cluster upsellity \
  --service upsellity-app-service \
  --task-definition upsellity-app:<PREVIOUS_REVISION>
```

## Next Steps After Deployment

1. ✅ Test app installation on a development store
2. ✅ Verify all features work in production environment
3. ✅ Set up CloudWatch alarms for CPU, memory, and errors
4. ✅ Configure log aggregation and monitoring
5. ✅ Test extension functionality in a live theme
6. ✅ Submit app for review in Shopify Partner Dashboard (if going to App Store)

## Support

For issues specific to:
- **AWS Infrastructure**: Check AWS documentation or contact AWS support
- **Shopify Integration**: Check [Shopify Dev Docs](https://shopify.dev) or Shopify Partners support
- **GitHub Actions**: Check workflow logs and [GitHub Actions docs](https://docs.github.com/en/actions)

