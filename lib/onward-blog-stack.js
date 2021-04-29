"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnwardBlogStack = void 0;
const cdk = require("@aws-cdk/core");
const aws_cloudfront_1 = require("@aws-cdk/aws-cloudfront");
const aws_s3_1 = require("@aws-cdk/aws-s3");
const lambda = require("@aws-cdk/aws-lambda");
const iam = require("@aws-cdk/aws-iam");
const route53 = require("@aws-cdk/aws-route53");
const targets = require("@aws-cdk/aws-route53-targets");
const custom_resources_1 = require("@aws-cdk/custom-resources");
const certificateArn = 'arn:aws:acm:us-east-1:718523126320:certificate/759a286c-c57f-44b4-a40f-4c864a8ab447';
const hostedZoneId = 'Z0092175EW0ABPS51GQB';
const siteName = 'blog.always-onward.com';
const zoneName = 'always-onward.com';
class OnwardBlogStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        //Create the website bucket
        const sourceBucket = new aws_s3_1.Bucket(this, siteName + '-website', {
            websiteIndexDocument: 'index.html',
            bucketName: siteName,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            publicReadAccess: true,
        });
        //Create the cloudfront distribution to cache the bucket
        const distribution = new aws_cloudfront_1.CloudFrontWebDistribution(this, siteName + '-cfront', {
            originConfigs: [
                {
                    customOriginSource: {
                        domainName: sourceBucket.bucketWebsiteDomainName,
                        originProtocolPolicy: aws_cloudfront_1.OriginProtocolPolicy.HTTP_ONLY,
                    },
                    behaviors: [{ isDefaultBehavior: true }]
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
            runtime: lambda.Runtime.NODEJS_14_X,
            retryAttempts: 0
        });
        //Let Lambda send email
        handler.addToRolePolicy(new iam.PolicyStatement({
            resources: ['arn:aws:ses:us-west-2:718523126320:identity/woodard.thomas@gmail.com'],
            actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        }));
        // Create the s3 trigger
        const rsrc = new custom_resources_1.AwsCustomResource(this, 'S3NotificationResource', {
            policy: custom_resources_1.AwsCustomResourcePolicy.fromStatements([new iam.PolicyStatement({
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
                physicalResourceId: custom_resources_1.PhysicalResourceId.of('S3NotifCustomResource' + Date.now().toString())
            }
        });
        handler.addPermission('AllowS3Invocation', {
            action: 'lambda:InvokeFunction',
            principal: new iam.ServicePrincipal('s3.amazonaws.com'),
            sourceArn: sourceBucket.bucketArn
        });
        rsrc.node.addDependency(handler.permissionsNode.findChild('AllowS3Invocation'));
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
exports.OnwardBlogStack = OnwardBlogStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib253YXJkLWJsb2ctc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvbndhcmQtYmxvZy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBc0M7QUFDdEMsNERBQStHO0FBQy9HLDRDQUE0RDtBQUU1RCw4Q0FBK0M7QUFDL0Msd0NBQXlDO0FBQ3pDLGdEQUFpRDtBQUNqRCx3REFBeUQ7QUFDekQsZ0VBQTJHO0FBRTNHLE1BQU0sY0FBYyxHQUFHLHFGQUFxRixDQUFDO0FBQzdHLE1BQU0sWUFBWSxHQUFHLHNCQUFzQixDQUFDO0FBQzVDLE1BQU0sUUFBUSxHQUFHLHdCQUF3QixDQUFDO0FBQzFDLE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDO0FBRXJDLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM1QyxZQUFZLEtBQWMsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEIsMkJBQTJCO1FBQzNCLE1BQU0sWUFBWSxHQUFHLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLEdBQUcsVUFBVSxFQUFFO1lBQzNELG9CQUFvQixFQUFFLFlBQVk7WUFDbEMsVUFBVSxFQUFFLFFBQVE7WUFDcEIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUN4QyxnQkFBZ0IsRUFBRSxJQUFJO1NBQ3ZCLENBQUMsQ0FBQztRQUNILHdEQUF3RDtRQUN4RCxNQUFNLFlBQVksR0FBRyxJQUFJLDBDQUF5QixDQUFDLElBQUksRUFBRSxRQUFRLEdBQUcsU0FBUyxFQUFFO1lBQzdFLGFBQWEsRUFBRTtnQkFDYjtvQkFDRSxrQkFBa0IsRUFBRTt3QkFDbEIsVUFBVSxFQUFFLFlBQVksQ0FBQyx1QkFBdUI7d0JBQ2hELG9CQUFvQixFQUFFLHFDQUFvQixDQUFDLFNBQVM7cUJBQ3JEO29CQUNELFNBQVMsRUFBRyxDQUFF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R0FBRyxlQUFlLEVBQUU7WUFDeEUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2xGLElBQUksRUFBRSxZQUFZO1lBQ2xCLFVBQVUsRUFBRSxRQUFRO1NBQ3JCLENBQUMsQ0FBQztRQUNILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1lBQ2hDLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLEtBQUssRUFBRSxZQUFZLENBQUMsY0FBYztTQUNsQyxDQUFDLENBQUM7UUFDSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNyQyxVQUFVLEVBQUUsWUFBWTtZQUN4QixLQUFLLEVBQUUsWUFBWSxDQUFDLFVBQVU7U0FDOUIsQ0FBQyxDQUFDO0lBSU4sQ0FBQztDQUNGO0FBdkdELDBDQXVHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjZGsgPSByZXF1aXJlKCdAYXdzLWNkay9jb3JlJyk7XG5pbXBvcnQgeyBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uLCBPcmlnaW5BY2Nlc3NJZGVudGl0eSwgT3JpZ2luUHJvdG9jb2xQb2xpY3kgfSBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWRmcm9udCdcbmltcG9ydCB7IEJ1Y2tldCwgQmxvY2tQdWJsaWNBY2Nlc3MgfSBmcm9tICdAYXdzLWNkay9hd3MtczMnO1xuaW1wb3J0IHsgQnVja2V0RGVwbG95bWVudCwgU291cmNlIH0gZnJvbSAnQGF3cy1jZGsvYXdzLXMzLWRlcGxveW1lbnQnO1xuaW1wb3J0IGxhbWJkYSA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnKTtcbmltcG9ydCBpYW0gPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtaWFtJyk7XG5pbXBvcnQgcm91dGU1MyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1yb3V0ZTUzJyk7XG5pbXBvcnQgdGFyZ2V0cyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1yb3V0ZTUzLXRhcmdldHMnKTtcbmltcG9ydCB7IEF3c0N1c3RvbVJlc291cmNlLCBQaHlzaWNhbFJlc291cmNlSWQsIEF3c0N1c3RvbVJlc291cmNlUG9saWN5IH0gZnJvbSAnQGF3cy1jZGsvY3VzdG9tLXJlc291cmNlcyc7XG5cbmNvbnN0IGNlcnRpZmljYXRlQXJuID0gJ2Fybjphd3M6YWNtOnVzLWVhc3QtMTo3MTg1MjMxMjYzMjA6Y2VydGlmaWNhdGUvNzU5YTI4NmMtYzU3Zi00NGI0LWE0MGYtNGM4NjRhOGFiNDQ3JztcbmNvbnN0IGhvc3RlZFpvbmVJZCA9ICdaMDA5MjE3NUVXMEFCUFM1MUdRQic7XG5jb25zdCBzaXRlTmFtZSA9ICdibG9nLmFsd2F5cy1vbndhcmQuY29tJztcbmNvbnN0IHpvbmVOYW1lID0gJ2Fsd2F5cy1vbndhcmQuY29tJztcblxuZXhwb3J0IGNsYXNzIE9ud2FyZEJsb2dTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQXBwLCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG4gICAgLy9DcmVhdGUgdGhlIHdlYnNpdGUgYnVja2V0XG4gICAgY29uc3Qgc291cmNlQnVja2V0ID0gbmV3IEJ1Y2tldCh0aGlzLCBzaXRlTmFtZSArICctd2Vic2l0ZScsIHtcbiAgICAgIHdlYnNpdGVJbmRleERvY3VtZW50OiAnaW5kZXguaHRtbCcsXG4gICAgICBidWNrZXROYW1lOiBzaXRlTmFtZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiB0cnVlLFxuICAgIH0pO1xuICAgIC8vQ3JlYXRlIHRoZSBjbG91ZGZyb250IGRpc3RyaWJ1dGlvbiB0byBjYWNoZSB0aGUgYnVja2V0XG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IENsb3VkRnJvbnRXZWJEaXN0cmlidXRpb24odGhpcywgc2l0ZU5hbWUgKyAnLWNmcm9udCcsIHtcbiAgICAgIG9yaWdpbkNvbmZpZ3M6IFtcbiAgICAgICAge1xuICAgICAgICAgIGN1c3RvbU9yaWdpblNvdXJjZToge1xuICAgICAgICAgICAgZG9tYWluTmFtZTogc291cmNlQnVja2V0LmJ1Y2tldFdlYnNpdGVEb21haW5OYW1lLFxuICAgICAgICAgICAgb3JpZ2luUHJvdG9jb2xQb2xpY3k6IE9yaWdpblByb3RvY29sUG9saWN5LkhUVFBfT05MWSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJlaGF2aW9ycyA6IFsge2lzRGVmYXVsdEJlaGF2aW9yOiB0cnVlfV1cbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIGFsaWFzQ29uZmlndXJhdGlvbjoge1xuICAgICAgICBhY21DZXJ0UmVmOiBjZXJ0aWZpY2F0ZUFybixcbiAgICAgICAgbmFtZXM6IFtzaXRlTmFtZV1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSB0aGUgbGFtYmRhIGZvciBhbGwgb2YgdGhlIGJhY2tlbmQgc3VwcG9ydFxuICAgIGNvbnN0IGhhbmRsZXIgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdvbndhcmRCbG9nTGFtYmRhJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgb253YXJkQmxvZ0xhbWJkYWAsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYScpLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmV2ZW50X2hhbmRsZXInLFxuICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTIwKSxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNF9YLFxuICAgICAgcmV0cnlBdHRlbXB0czogMFxuICAgIH0pO1xuICAgIC8vTGV0IExhbWJkYSBzZW5kIGVtYWlsXG4gICAgaGFuZGxlci5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgcmVzb3VyY2VzOiBbJ2Fybjphd3M6c2VzOnVzLXdlc3QtMjo3MTg1MjMxMjYzMjA6aWRlbnRpdHkvd29vZGFyZC50aG9tYXNAZ21haWwuY29tJ10sXG4gICAgICBhY3Rpb25zOiBbJ3NlczpTZW5kRW1haWwnLCAnc2VzOlNlbmRSYXdFbWFpbCddLFxuICAgIH0pKVxuICAgIC8vIENyZWF0ZSB0aGUgczMgdHJpZ2dlclxuICAgIGNvbnN0IHJzcmMgPSBuZXcgQXdzQ3VzdG9tUmVzb3VyY2UodGhpcywgJ1MzTm90aWZpY2F0aW9uUmVzb3VyY2UnLCB7XG4gICAgICBwb2xpY3k6IEF3c0N1c3RvbVJlc291cmNlUG9saWN5LmZyb21TdGF0ZW1lbnRzKFtuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFtcIlMzOlB1dEJ1Y2tldE5vdGlmaWNhdGlvblwiXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbc291cmNlQnVja2V0LmJ1Y2tldEFybl0sXG4gICAgICB9KV0pLFxuICAgICAgb25DcmVhdGU6IHtcbiAgICAgICAgc2VydmljZTogJ1MzJyxcbiAgICAgICAgYWN0aW9uOiAncHV0QnVja2V0Tm90aWZpY2F0aW9uQ29uZmlndXJhdGlvbicsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAvLyBUaGlzIGJ1Y2tldCBtdXN0IGJlIGluIHRoZSBzYW1lIHJlZ2lvbiB5b3UgYXJlIGRlcGxveWluZyB0b1xuICAgICAgICAgIEJ1Y2tldDogc291cmNlQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgTm90aWZpY2F0aW9uQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgICAgTGFtYmRhRnVuY3Rpb25Db25maWd1cmF0aW9uczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgRXZlbnRzOiBbJ3MzOk9iamVjdENyZWF0ZWQ6KiddLFxuICAgICAgICAgICAgICAgIExhbWJkYUZ1bmN0aW9uQXJuOiBoYW5kbGVyLmZ1bmN0aW9uQXJuLFxuICAgICAgICAgICAgICAgIEZpbHRlcjoge1xuICAgICAgICAgICAgICAgICAgS2V5OiB7XG4gICAgICAgICAgICAgICAgICAgIEZpbHRlclJ1bGVzOiBbeyBOYW1lOiAnc3VmZml4JywgVmFsdWU6ICdodG1sJyB9XVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gQWx3YXlzIHVwZGF0ZSBwaHlzaWNhbCBJRCBzbyBmdW5jdGlvbiBnZXRzIGV4ZWN1dGVkXG4gICAgICAgIHBoeXNpY2FsUmVzb3VyY2VJZDogUGh5c2ljYWxSZXNvdXJjZUlkLm9mKCdTM05vdGlmQ3VzdG9tUmVzb3VyY2UnICsgRGF0ZS5ub3coKS50b1N0cmluZygpKVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaGFuZGxlci5hZGRQZXJtaXNzaW9uKCdBbGxvd1MzSW52b2NhdGlvbicsIHtcbiAgICAgIGFjdGlvbjogJ2xhbWJkYTpJbnZva2VGdW5jdGlvbicsXG4gICAgICBwcmluY2lwYWw6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnczMuYW1hem9uYXdzLmNvbScpLFxuICAgICAgc291cmNlQXJuOiBzb3VyY2VCdWNrZXQuYnVja2V0QXJuXG4gICAgfSk7XG5cbiAgICByc3JjLm5vZGUuYWRkRGVwZW5kZW5jeShoYW5kbGVyLnBlcm1pc3Npb25zTm9kZS5maW5kQ2hpbGQoJ0FsbG93UzNJbnZvY2F0aW9uJykpO1xuXG4gICAgY29uc3QgbXlIb3N0ZWRab25lID0gcm91dGU1My5Ib3N0ZWRab25lLmZyb21Ib3N0ZWRab25lQXR0cmlidXRlcyh0aGlzLCBzaXRlTmFtZSArICctaG9zdGVkLXpvbmUnLCB7XG4gICAgICBob3N0ZWRab25lSWQsXG4gICAgICB6b25lTmFtZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFsaWFzUmVjb3JkID0gbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCBzaXRlTmFtZSArICctYWxpYXMtcmVjb3JkJywge1xuICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMobmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldChkaXN0cmlidXRpb24pKSxcbiAgICAgIHpvbmU6IG15SG9zdGVkWm9uZSxcbiAgICAgIHJlY29yZE5hbWU6IHNpdGVOYW1lLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiZGlzdElEXCIsIHtcbiAgICAgIGV4cG9ydE5hbWU6IFwiZGlzdElEXCIsXG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkXG4gICAgIH0pO1xuICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcImJ1Y2tldE5hbWVcIiwge1xuICAgICAgZXhwb3J0TmFtZTogXCJidWNrZXROYW1lXCIsXG4gICAgICB2YWx1ZTogc291cmNlQnVja2V0LmJ1Y2tldE5hbWVcbiAgICAgfSk7XG5cblxuXG4gIH1cbn1cbiJdfQ==