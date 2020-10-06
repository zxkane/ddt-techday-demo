import { App } from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import { DemoStack } from '../src/stack';

const devEnv = {
  account: '1234567890xx',
  region: 'ap-northeast-1',
};

test('Snapshot', () => {
  const app = new App({
    context: {
      acm: 'arn:aws:acm:region:account-id:certificate/zzzzzzz-2222-3333-4444-3edc4rfv5t',
      zoneId: 'XXXXXXXXXXXXX',
      zoneName: 'example.com',
    },
  });
  const stack = new DemoStack(app, 'testing', {
    env: devEnv,
  } );
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

