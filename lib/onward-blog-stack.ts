import * as cdk from '@aws-cdk/core';
import { CloudFrontWebDistribution, OriginAccessIdentity, OriginProtocolPolicy } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as ssm from '@aws-cdk/aws-ssm';
import { AwsCustomResource, PhysicalResourceId, AwsCustomResourcePolicy } from '@aws-cdk/custom-resources';
import * as config from './config';

const zoneName = 'always-onward.com';

export class OnwardBlogStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    //Create the website bucket
    const sourceBucket = new Bucket(this, config.siteName + '-website', {
      websiteIndexDocument: 'index.html',
      bucketName: config.siteName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: true,
    });
    //Create the cloudfront distribution to cache the bucket
    const distribution = new CloudFrontWebDistribution(this, config.siteName + '-cfront', {
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
        acmCertRef: config.certificateArn,
        names: [config.siteName]
      }
    });

    // Create the lambda for all of the backend support
    const handler = new lambda.Function(this, 'onwardBlogLambda', {
      functionName: `onwardBlogLambda`,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.event_handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(120),
      runtime: lambda.Runtime.NODEJS_14_X,
      retryAttempts: 0
    });
    //Let Lambda send email
    handler.addToRolePolicy(new iam.PolicyStatement({
      resources: ['arn:aws:ses:us-west-2:718523126320:identity/woodard.thomas@gmail.com'],
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    }))
    // Create the s3 trigger
    const rsrc = new AwsCustomResource(this, 'S3NotificationResource', {
      policy: AwsCustomResourcePolicy.fromStatements([new iam.PolicyStatement({
        actions: ["S3:PutBucketNotification"],
        resources: [sourceBucket.bucketArn],
      })]),
      onCreate: {
        service: 'S3',
        action: 'putBucketNotificationConfiguration',
        parameters: {
          // This bucket must be in the same region you are deploying to
          Bucket: sourceBucket.bucketName,
          NotificationConfiguration: {
            LambdaFunctionConfigurations: [
              {
                Events: ['s3:ObjectCreated:*'],
                LambdaFunctionArn: handler.functionArn,
                Filter: {
                  Key: {
                    FilterRules: [{ Name: 'suffix', Value: 'html' }]
                  }
                }
              }
            ]
          }
        },
        // Always update physical ID so function gets executed
        physicalResourceId: PhysicalResourceId.of('S3NotifCustomResource' + Date.now().toString())
      }
    });

    handler.addPermission('AllowS3Invocation', {
      action: 'lambda:InvokeFunction',
      principal: new iam.ServicePrincipal('s3.amazonaws.com'),
      sourceArn: sourceBucket.bucketArn
    });

    rsrc.node.addDependency(handler.permissionsNode.findChild('AllowS3Invocation'));

    const myHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, config.siteName + '-hosted-zone', {
      hostedZoneId: config.hostedZoneId,
      zoneName: config.zoneName,
    });

    const aliasRecord = new route53.ARecord(this, config.siteName + '-alias-record', {
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: myHostedZone,
      recordName: config.siteName,
    });

    new ssm.StringParameter(this, "bucketName", {
      parameterName: '/OnwardBlog/bucketName',
      stringValue: sourceBucket.bucketName,
    });
    new ssm.StringParameter(this, "distID", {
      parameterName: '/OnwardBlog/distID',
      stringValue: distribution.distributionId,
    });

    new cdk.CfnOutput(this, "cfn-distID", {
      exportName: "distID",
      value: distribution.distributionId,
    });
    new cdk.CfnOutput(this, "cfn-bucketName", {
      exportName: "bucketName",
      value: sourceBucket.bucketName
     });
  }
}
