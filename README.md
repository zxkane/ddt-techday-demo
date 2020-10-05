# ddt-techday-demo
DDT Tech Day Demo CDK Part.

## Create asg web server. 
![](./image/asg.png)

## Need two value .
1. ROUTE53_HOST_ZONE_ID and ROUTE53_HOST_ZONE_NAME  like `example.com` and `ZXXXXXXXXXX` .
![](./image/ddt-tech-r53-1.png)
2. AMAZON_Certificates_Manager_ARN like
    `arn:aws:acm:region:account-id:certificate/xxxxxxx-oooo-oooo-oooo-xxxxxxxx` .
![](./image/ddt-tech-acm-1.png)

## How to use ?!
```bash
To synth 
yarn synth -c zoneId=${ROUTE53_HOST_ZONE_ID} -c zoneId=${ROUTE53_HOST_ZONE_NAME} -c acm=${AMAZON_Certificates_Manager_ARN} 
To Diff
yarn diff -c zoneId=${ROUTE53_HOST_ZONE_ID} -c zoneId=${ROUTE53_HOST_ZONE_NAME} -c acm=${AMAZON_Certificates_Manager_ARN} 
To Deploy
yarn deploy --require-approval never -c zoneId=${ROUTE53_HOST_ZONE_ID} -c zoneId=${ROUTE53_HOST_ZONE_NAME} -c acm=${AMAZON_Certificates_Manager_ARN} 
To Destroy
yarn destroy -f -c zoneId=${ROUTE53_HOST_ZONE_ID} -c zoneId=${ROUTE53_HOST_ZONE_NAME} -c acm=${AMAZON_Certificates_Manager_ARN} 
```