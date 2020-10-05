#!/usr/bin/env bash
set -xe
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1
yum update -y
yum install httpd -y
systemctl start httpd
systemctl enable httpd
systemctl status amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl restart amazon-ssm-agent
exit 0