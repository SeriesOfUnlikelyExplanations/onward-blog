import cdk = require('@aws-cdk/core');
import { CloudFrontWebDistribution, OriginAccessIdentity, OriginProtocolPolicy } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import * as lambda from '@aws-cdk/aws-lambda';
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
    //Create the website bucket
    const sourceBucket = new Bucket(this, siteName + '-website', {
      websiteIndexDocument: 'index.html',
      bucketName: siteName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: true,
    });
    //Create the cloudfront distribution to cache the bucket
    const distribution = new CloudFrontWebDistribution(this, siteName + '-cfront', {
      originConfigs: [
        {
          customOriginSource: {
            domainName: sourceBucket.bucketWebsiteDomainName,
            originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors : [ {isDefaultBehavior: true}]
        }
      ],
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [siteName]
      }
    });

    // Create the lambda for all of the backend support
    const handler = new lambda.Function(this, 'onwardBlogLambda', {
      functionName: `onwardBlogLambda`,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.event_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(120),
      runtime: lambda.Runtime.NODEJS_10_X,
      retryAttempts: 0
    });
    //Let Lambda send email
    //~ handler.addToRolePolicy(new iam.PolicyStatement({
      //~ resources: ['arn:aws:ses:us-east-1:732956247431:identity/dash-reporting@amazon.com'],
      //~ actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    //~ }))


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
