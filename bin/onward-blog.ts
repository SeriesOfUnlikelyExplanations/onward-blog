#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { OnwardBlogStack } from '../lib/onward-blog-stack';
import * as config from '../lib/config';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: config.region
}

new OnwardBlogStack(app, 'OnwardBlogStack', {
  stackName: 'Onward-blog-stack',
  env: env
});
