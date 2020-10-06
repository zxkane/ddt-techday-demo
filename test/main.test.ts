import { App } from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import { DemoStack } from '../src/main';

const devEnv = {
  account: '1234567890xx',
  region: 'ap-northeast-1',
};

test('Snapshot', () => {
  const app = new App();
  const stack = new DemoStack(app, 'testing', {
    env: devEnv,
  } );
  stack.node.setContext('acm', 'arn:aws:acm:region:account-id:certificate/zzzzzzz-2222-3333-4444-3edc4rfv5t' );
  stack.node.setContext('zoneId', 'XXXXXXXXXXXXX' );
  stack.node.setContext('zoneName', 'example.com' );
  expect(stack).not.toHaveResource('AWS::S3::Bucket');
  expect(stack).toHaveResource('AWS::EC2::Instance', {
    BlockDeviceMappings: [
      {
        DeviceName: '/dev/xvda',
        Ebs: {
          VolumeSize: 30,
        },
      },
    ],
  });
  expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
});

