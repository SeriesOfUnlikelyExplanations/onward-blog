import cdk = require('@aws-cdk/core');
import { CloudFrontWebDistribution, OriginAccessIdentity } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import route53 = require('@aws-cdk/aws-route53');
import targets = require('@aws-cdk/aws-route53-targets');
const websiteDistSourcePath = './public';
const certificateArn = 'arn:aws:acm:us-east-1:718523126320:certificate/759a286c-c57f-44b4-a40f-4c864a8ab447';
const hostedZoneId = 'Z0092175EW0ABPS51GQB';
const siteName = 'blog.always-onward.com';
const zoneName = 'always-onward.com';

export class OnwardBlogStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceBucket = new Bucket(this, siteName + '-website', {
      websiteIndexDocument: 'index.html',
      bucketName: siteName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const oia = new OriginAccessIdentity(this, 'OIA', {
      comment: "Created by CDK"
    });
    sourceBucket.grantRead(oia);

    const distribution = new CloudFrontWebDistribution(this, siteName + '-cfront', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: sourceBucket,
            originAccessIdentity: oia
          },
          behaviors : [ {isDefaultBehavior: true}]
        }
      ],
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [siteName]
      }
    });

    const myHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, siteName + '-hosted-zone', {
      hostedZoneId,
      zoneName,
    });

    const aliasRecord = new route53.ARecord(this, siteName + '-alias-record', {
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: myHostedZone,
      recordName: siteName,
    });
    new cdk.CfnOutput(this, "distID", {
      exportName: "distID",
      value: distribution.distributionId
     });
     new cdk.CfnOutput(this, "bucketName", {
      exportName: "bucketName",
      value: sourceBucket.bucketName
     });
  }
}
