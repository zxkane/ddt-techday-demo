import * as asing from '@aws-cdk/aws-autoscaling';
import * as certmgr from '@aws-cdk/aws-certificatemanager';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2';
import * as iam from '@aws-cdk/aws-iam';
import * as r53 from '@aws-cdk/aws-route53';
import * as r53tg from '@aws-cdk/aws-route53-targets';
import { App, Construct, Stack, StackProps, CfnOutput, Duration } from '@aws-cdk/core';
import { PolicyStatementFactory, Action } from 'iam-policy-generator';

interface DemoStackProps extends StackProps {
  zoneId?: string;
  zoneName?: string;
  acm?: string;
}

export class DemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: DemoStackProps) {
    super(scope, id, props);
    const userData = ec2.UserData.forLinux();
    userData.addCommands(`
set -xe
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1
yum update -y
yum install docker -y
systemctl start docker
systemctl enable docker
docker run -d -p 80:80 guanyebo/demohttpd:v1
systemctl status amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl restart amazon-ssm-agent
exit 0`);
    // define resources here...
    const vpc = new ec2.Vpc(this, 'newVpc', {
      maxAzs: 2,
      natGateways: 1,
    });
    const acm = certmgr.Certificate.fromCertificateArn(this, 'demoAcm', props?.acm ?? `${this.node.tryGetContext('acm')}`);
    const alb = new elb.ApplicationLoadBalancer(this, 'myalb', {
      vpc,
      internetFacing: true,
      loadBalancerName: 'demoalb',
    } );
    const asg = new asing.AutoScalingGroup(this, 'webASG', {
      vpc,
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux(
        { generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      desiredCapacity: 3,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: asing.BlockDeviceVolume.ebs(30),
        },
      ],
      userData,
    });
    asg.addToRolePolicy(
      new PolicyStatementFactory()
        .setEffect(iam.Effect.ALLOW)
        .addResource('*')
        .addActions([
          Action.SESSION_MANAGER_MESSAGE_GATEWAY_SERVICE.CREATE_CONTROL_CHANNEL,
          Action.SESSION_MANAGER_MESSAGE_GATEWAY_SERVICE.CREATE_DATA_CHANNEL,
          Action.SESSION_MANAGER_MESSAGE_GATEWAY_SERVICE.OPEN_CONTROL_CHANNEL,
          Action.SESSION_MANAGER_MESSAGE_GATEWAY_SERVICE.OPEN_DATA_CHANNEL,
          Action.SYSTEMS_MANAGER.UPDATE_INSTANCE_INFORMATION,
          Action.MESSAGE_DELIVERY_SERVICE.ACKNOWLEDGE_MESSAGE,
          Action.MESSAGE_DELIVERY_SERVICE.DELETE_MESSAGE,
          Action.MESSAGE_DELIVERY_SERVICE.FAIL_MESSAGE,
          Action.MESSAGE_DELIVERY_SERVICE.GET_ENDPOINT,
          Action.MESSAGE_DELIVERY_SERVICE.GET_MESSAGES,
          Action.MESSAGE_DELIVERY_SERVICE.SEND_REPLY,
        ]).build(),
    );
    asg.connections.allowFrom( ec2.Peer.ipv4('0.0.0.0/0'), ec2.Port.tcp(80));
    alb.addListener('myWebhttp', {
      port: 80,
      open: true,
      defaultAction: elb.ListenerAction.redirect( {
        protocol: 'HTTPS',
        host: '#{host}',
        path: '/#{path}',
        query: '/#{query}',
        port: '443',
      }),
    });
    const httpslistener = alb.addListener('myWebhttps', {
      certificates: [acm],
      port: 443,
      open: true,
    });
    httpslistener.addTargets('webServer', {
      port: 80,
      targets: [asg],
    });
    const zone = r53.HostedZone.fromHostedZoneAttributes(this, 'myZone', {
      hostedZoneId: props?.zoneId ?? this.node.tryGetContext('zoneId'),
      zoneName: props?.zoneName ?? this.node.tryGetContext('zoneName'),
    });
    const r53alias = new r53.ARecord(this, 'alias-alb', {
      zone,
      target: r53.RecordTarget.fromAlias(new r53tg.LoadBalancerTarget(alb)),
      recordName: 'cdkdemo',
      ttl: Duration.minutes(5),
    });
    new CfnOutput(this, 'aliasalbOutput', {
      value: r53alias.domainName,
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new DemoStack(app, 'asg-stack-dev', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();