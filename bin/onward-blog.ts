#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { OnwardBlogStack } from '../lib/onward-blog-stack';

const app = new cdk.App();
new OnwardBlogStack(app, 'OnwardPhotosStack', {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1'
});
