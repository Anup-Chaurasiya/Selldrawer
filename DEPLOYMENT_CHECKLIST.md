# 🚀 Production Deployment Checklist

Use this checklist to ensure you've completed all steps for deploying Upsellity AI to production at `https://app.upsellity.com`.

## Pre-Deployment Setup

### AWS Infrastructure
- [ ] ECR repository created: `upsellity/app` in `ap-south-1`
- [ ] ECS cluster created: `upsellity`
- [ ] ECS task definition created: `upsellity-app`
- [ ] ECS service created: `upsellity-app-service`
- [ ] Application Load Balancer configured
- [ ] Target group created pointing to port 3000
- [ ] Health checks configured
- [ ] SSL certificate for `app.upsellity.com` in ACM
- [ ] HTTPS listener (443) configured on ALB
- [ ] Security groups configured:
  - [ ] ALB allows inbound 443 from internet
  - [ ] ECS tasks allow inbound 3000 from ALB
  - [ ] ECS tasks allow outbound to database
  - [ ] ECS tasks allow outbound to internet (for Shopify API)

### DNS Configuration
- [ ] A record or CNAME created: `app.upsellity.com` → ALB DNS
- [ ] DNS propagated (test with `nslookup app.upsellity.com`)
- [ ] SSL certificate validated

### Database Setup
- [ ] Production database provisioned (PostgreSQL/MySQL recommended)
- [ ] Database accessible from ECS tasks
- [ ] Database connection string ready
- [ ] Initial migration tested

### GitHub Configuration
- [ ] Repository has Actions enabled
- [ ] GitHub Secrets configured:
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `DATABASE_URL`
  - [ ] `SHOPIFY_API_KEY`
  - [ ] `SHOPIFY_API_SECRET`
  - [ ] `SHOPIFY_CART_UPSELL_EXTENSION_ID`

## Shopify Configuration

### App Configuration
- [ ] Production config file created: `shopify.app.prod.toml`
- [ ] App URL updated to `https://app.upsellity.com`
- [ ] Redirect URLs updated:
  - [ ] `https://app.upsellity.com/auth/callback`
  - [ ] `https://app.upsellity.com/auth/shopify/callback`
  - [ ] `https://app.upsellity.com/api/auth/callback`
- [ ] App deployed: `shopify app deploy` (using prod config)

### Extension Configuration
- [ ] Cart upsell extension deployed: `shopify app deploy` in `extensions/cart-upsell`
- [ ] Extension ID copied to GitHub Secrets
- [ ] Extension tested on development store

### Shopify Partner Dashboard
- [ ] App URL updated to: `https://app.upsellity.com`
- [ ] Redirect URLs updated (see above)
- [ ] Scopes match `shopify.app.prod.toml`
- [ ] Webhooks configured (if not auto-configured)

## Code Changes

- [✅] GitHub Actions workflow updated with all environment variables
- [✅] `SHOPIFY_APP_URL` added to workflow
- [✅] `SHOPIFY_API_SECRET` added to workflow
- [✅] `SCOPES` added to workflow
- [✅] Production config file created: `shopify.app.prod.toml`
- [✅] Dockerfile optimized for production builds
- [✅] Documentation created:
  - [✅] `DEPLOYMENT.md`
  - [✅] `ENVIRONMENT.md`
  - [✅] `DEPLOYMENT_CHECKLIST.md`

## Deployment

### First Deployment
- [ ] All above items completed
- [ ] Code pushed to `main` branch
- [ ] GitHub Actions workflow triggered
- [ ] Workflow completed successfully
- [ ] ECS service shows healthy tasks
- [ ] Application accessible at `https://app.upsellity.com`

### Verification Tests
- [ ] Health check: `curl https://app.upsellity.com/`
- [ ] App loads in browser without errors
- [ ] OAuth flow works (install on test store)
- [ ] App dashboard loads
- [ ] Database connection working
- [ ] Environment variables loaded correctly
- [ ] Extension API endpoint works: `/api/cart-config`

### Extension Verification
- [ ] Install app on development store
- [ ] Go to theme editor
- [ ] Add "Cart Upsell Widget" block to cart
- [ ] Set "App URL" to `https://app.upsellity.com`
- [ ] Create a cart configuration in app
- [ ] Test cart with products
- [ ] Verify upsell widget displays
- [ ] Check browser console for errors

## Post-Deployment

### Monitoring Setup
- [ ] CloudWatch Logs configured
- [ ] Log retention set (7-30 days recommended)
- [ ] CloudWatch alarms configured:
  - [ ] CPU utilization > 80%
  - [ ] Memory utilization > 80%
  - [ ] Error rate > threshold
  - [ ] Health check failures
- [ ] Dashboard created for key metrics

### Security Review
- [ ] All secrets in GitHub Secrets (not in code)
- [ ] `.env` files in `.gitignore`
- [ ] No credentials in logs
- [ ] HTTPS enforced everywhere
- [ ] Security groups follow least privilege
- [ ] IAM roles have minimal permissions

### Documentation
- [ ] Update internal documentation
- [ ] Document rollback procedure
- [ ] Document incident response plan
- [ ] Share deployment guide with team

### Testing
- [ ] Install on development store
- [ ] Create cart configurations
- [ ] Test all condition types
- [ ] Test all action types
- [ ] Test with different cart values
- [ ] Test with different products
- [ ] Load testing (if expecting high traffic)

## Ongoing Maintenance

### Regular Tasks
- [ ] Monitor CloudWatch metrics daily
- [ ] Review logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate credentials quarterly
- [ ] Review and update scopes as needed
- [ ] Test backup restoration procedure

### Before Each Deployment
- [ ] Test in staging environment (if available)
- [ ] Review all code changes
- [ ] Run database migration locally first
- [ ] Verify no breaking changes
- [ ] Plan rollback strategy
- [ ] Notify team of deployment

## Rollback Plan

If something goes wrong:

1. **Immediate Rollback** (revert to previous version):
   ```bash
   aws ecs update-service \
     --cluster upsellity \
     --service upsellity-app-service \
     --task-definition upsellity-app:<PREVIOUS_REVISION>
   ```

2. **Check logs**:
   ```bash
   aws logs tail /ecs/upsellity-app --follow
   ```

3. **Database rollback** (if needed):
   - Restore from backup
   - Or run reverse migration

4. **Verify rollback successful**:
   - Check app loads
   - Test key functionality
   - Monitor error logs

## Common Issues and Solutions

### Issue: APP_URL not defined
- ✅ **Fixed**: Added `SHOPIFY_APP_URL=https://app.upsellity.com` to GitHub Actions

### Issue: Missing SHOPIFY_API_SECRET
- ✅ **Fixed**: Added to GitHub Actions workflow

### Issue: Database migration fails
- **Solution**: Check DATABASE_URL, test connection manually, verify schema

### Issue: Extension not loading
- **Solution**: Verify "App URL" setting in theme editor, check CORS, test API endpoint

### Issue: OAuth fails
- **Solution**: Verify redirect URLs in Partner Dashboard match exactly

### Issue: ECS tasks failing health checks
- **Solution**: Check container logs, verify port 3000 exposed, test endpoint locally

## Success Criteria

Deployment is successful when:
- ✅ ECS service shows 100% healthy tasks
- ✅ App accessible at `https://app.upsellity.com`
- ✅ OAuth installation works on test store
- ✅ App dashboard loads without errors
- ✅ Cart configurations can be created
- ✅ Extension displays upsells in cart
- ✅ No errors in CloudWatch logs
- ✅ All environment variables loaded
- ✅ Database migrations applied
- ✅ Webhooks receiving events

## Next Steps After Successful Deployment

1. **Monitor for 24 hours**
   - Check logs frequently
   - Monitor performance metrics
   - Test all features multiple times

2. **User Acceptance Testing**
   - Install on real merchant store (test mode)
   - Create real configurations
   - Test with actual customers

3. **Performance Optimization**
   - Review response times
   - Optimize slow queries
   - Add caching if needed

4. **Scale if Needed**
   - Monitor resource usage
   - Scale ECS tasks if needed
   - Upgrade database if needed

5. **Launch**
   - Submit to Shopify App Store (if applicable)
   - Announce to users
   - Prepare support documentation

---

**Last Updated**: [Date]  
**Deployment Lead**: [Name]  
**Status**: [In Progress / Completed / Issues]

