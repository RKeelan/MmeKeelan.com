aws s3 sync dist "s3://mmekeelan.com/" --delete
aws cloudfront create-invalidation --distribution-id E35C2EO7G0XV54 --paths "/*"