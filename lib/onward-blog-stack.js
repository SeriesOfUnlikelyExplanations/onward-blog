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
const websiteDistSourcePath = './public';
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
            runtime: lambda.Runtime.NODEJS_10_X,
            retryAttempts: 0
        });
        //Let Lambda send email
        handler.addToRolePolicy(new iam.PolicyStatement({
            resources: ['arn:aws:ses:us-west-2:718523126320:identity/woodard.thomas@gmail.com'],
            actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib253YXJkLWJsb2ctc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvbndhcmQtYmxvZy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBc0M7QUFDdEMsNERBQStHO0FBQy9HLDRDQUE0RDtBQUU1RCw4Q0FBK0M7QUFDL0Msd0NBQXlDO0FBQ3pDLGdEQUFpRDtBQUNqRCx3REFBeUQ7QUFDekQsTUFBTSxxQkFBcUIsR0FBRyxVQUFVLENBQUM7QUFDekMsTUFBTSxjQUFjLEdBQUcscUZBQXFGLENBQUM7QUFDN0csTUFBTSxZQUFZLEdBQUcsc0JBQXNCLENBQUM7QUFDNUMsTUFBTSxRQUFRLEdBQUcsd0JBQXdCLENBQUM7QUFDMUMsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUM7QUFFckMsTUFBYSxlQUFnQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzVDLFlBQVksS0FBYyxFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4QiwyQkFBMkI7UUFDM0IsTUFBTSxZQUFZLEdBQUcsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFFLFFBQVEsR0FBRyxVQUFVLEVBQUU7WUFDM0Qsb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxVQUFVLEVBQUUsUUFBUTtZQUNwQixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FBQyxDQUFDO1FBQ0gsd0RBQXdEO1FBQ3hELE1BQU0sWUFBWSxHQUFHLElBQUksMENBQXlCLENBQUMsSUFBSSxFQUFFLFFBQVEsR0FBRyxTQUFTLEVBQUU7WUFDN0UsYUFBYSxFQUFFO2dCQUNiO29CQUNFLGtCQUFrQixFQUFFO3dCQUNsQixVQUFVLEVBQUUsWUFBWSxDQUFDLHVCQUF1Qjt3QkFDaEQsb0JBQW9CLEVBQUUscUNBQW9CLENBQUMsU0FBUztxQkFDckQ7b0JBQ0QsU0FBUyxFQUFHLENBQUUsRUFBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUMsQ0FBQztpQkFDekM7YUFDRjtZQUNELGtCQUFrQixFQUFFO2dCQUNsQixVQUFVLEVBQUUsY0FBYztnQkFDMUIsS0FBSyxFQUFFLENBQUMsUUFBUSxDQUFDO2FBQ2xCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsbURBQW1EO1FBQ25ELE1BQU0sT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDNUQsWUFBWSxFQUFFLGtCQUFrQjtZQUNoQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1lBQ3JDLE9BQU8sRUFBRSxxQkFBcUI7WUFDOUIsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ2xDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsYUFBYSxFQUFFLENBQUM7U0FDakIsQ0FBQyxDQUFDO1FBQ0gsdUJBQXVCO1FBQ3ZCLE9BQU8sQ0FBQyxlQUFlLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQzlDLFNBQVMsRUFBRSxDQUFDLHNFQUFzRSxDQUFDO1lBQ25GLE9BQU8sRUFBRSxDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQztTQUMvQyxDQUFDLENBQUMsQ0FBQTtRQUdILE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsSUFBSSxFQUFFLFFBQVEsR0FBRyxjQUFjLEVBQUU7WUFDaEcsWUFBWTtZQUNaLFFBQVE7U0FDVCxDQUFDLENBQUM7UUFFSCxNQUFNLFdBQVcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsR0FBRyxlQUFlLEVBQUU7WUFDeEUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2xGLElBQUksRUFBRSxZQUFZO1lBQ2xCLFVBQVUsRUFBRSxRQUFRO1NBQ3JCLENBQUMsQ0FBQztRQUNILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1lBQ2hDLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLEtBQUssRUFBRSxZQUFZLENBQUMsY0FBYztTQUNsQyxDQUFDLENBQUM7UUFDSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNyQyxVQUFVLEVBQUUsWUFBWTtZQUN4QixLQUFLLEVBQUUsWUFBWSxDQUFDLFVBQVU7U0FDOUIsQ0FBQyxDQUFDO0lBSU4sQ0FBQztDQUNGO0FBbEVELDBDQWtFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjZGsgPSByZXF1aXJlKCdAYXdzLWNkay9jb3JlJyk7XG5pbXBvcnQgeyBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uLCBPcmlnaW5BY2Nlc3NJZGVudGl0eSwgT3JpZ2luUHJvdG9jb2xQb2xpY3kgfSBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWRmcm9udCdcbmltcG9ydCB7IEJ1Y2tldCwgQmxvY2tQdWJsaWNBY2Nlc3MgfSBmcm9tICdAYXdzLWNkay9hd3MtczMnO1xuaW1wb3J0IHsgQnVja2V0RGVwbG95bWVudCwgU291cmNlIH0gZnJvbSAnQGF3cy1jZGsvYXdzLXMzLWRlcGxveW1lbnQnO1xuaW1wb3J0IGxhbWJkYSA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnKTtcbmltcG9ydCBpYW0gPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtaWFtJyk7XG5pbXBvcnQgcm91dGU1MyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1yb3V0ZTUzJyk7XG5pbXBvcnQgdGFyZ2V0cyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1yb3V0ZTUzLXRhcmdldHMnKTtcbmNvbnN0IHdlYnNpdGVEaXN0U291cmNlUGF0aCA9ICcuL3B1YmxpYyc7XG5jb25zdCBjZXJ0aWZpY2F0ZUFybiA9ICdhcm46YXdzOmFjbTp1cy1lYXN0LTE6NzE4NTIzMTI2MzIwOmNlcnRpZmljYXRlLzc1OWEyODZjLWM1N2YtNDRiNC1hNDBmLTRjODY0YThhYjQ0Nyc7XG5jb25zdCBob3N0ZWRab25lSWQgPSAnWjAwOTIxNzVFVzBBQlBTNTFHUUInO1xuY29uc3Qgc2l0ZU5hbWUgPSAnYmxvZy5hbHdheXMtb253YXJkLmNvbSc7XG5jb25zdCB6b25lTmFtZSA9ICdhbHdheXMtb253YXJkLmNvbSc7XG5cbmV4cG9ydCBjbGFzcyBPbndhcmRCbG9nU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuICAgIC8vQ3JlYXRlIHRoZSB3ZWJzaXRlIGJ1Y2tldFxuICAgIGNvbnN0IHNvdXJjZUJ1Y2tldCA9IG5ldyBCdWNrZXQodGhpcywgc2l0ZU5hbWUgKyAnLXdlYnNpdGUnLCB7XG4gICAgICB3ZWJzaXRlSW5kZXhEb2N1bWVudDogJ2luZGV4Lmh0bWwnLFxuICAgICAgYnVja2V0TmFtZTogc2l0ZU5hbWUsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgcHVibGljUmVhZEFjY2VzczogdHJ1ZSxcbiAgICB9KTtcbiAgICAvL0NyZWF0ZSB0aGUgY2xvdWRmcm9udCBkaXN0cmlidXRpb24gdG8gY2FjaGUgdGhlIGJ1Y2tldFxuICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uKHRoaXMsIHNpdGVOYW1lICsgJy1jZnJvbnQnLCB7XG4gICAgICBvcmlnaW5Db25maWdzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjdXN0b21PcmlnaW5Tb3VyY2U6IHtcbiAgICAgICAgICAgIGRvbWFpbk5hbWU6IHNvdXJjZUJ1Y2tldC5idWNrZXRXZWJzaXRlRG9tYWluTmFtZSxcbiAgICAgICAgICAgIG9yaWdpblByb3RvY29sUG9saWN5OiBPcmlnaW5Qcm90b2NvbFBvbGljeS5IVFRQX09OTFksXG4gICAgICAgICAgfSxcbiAgICAgICAgICBiZWhhdmlvcnMgOiBbIHtpc0RlZmF1bHRCZWhhdmlvcjogdHJ1ZX1dXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBhbGlhc0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgYWNtQ2VydFJlZjogY2VydGlmaWNhdGVBcm4sXG4gICAgICAgIG5hbWVzOiBbc2l0ZU5hbWVdXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIGxhbWJkYSBmb3IgYWxsIG9mIHRoZSBiYWNrZW5kIHN1cHBvcnRcbiAgICBjb25zdCBoYW5kbGVyID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnb253YXJkQmxvZ0xhbWJkYScsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYG9ud2FyZEJsb2dMYW1iZGFgLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGEnKSxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5ldmVudF9oYW5kbGVyJyxcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEyMCksXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTBfWCxcbiAgICAgIHJldHJ5QXR0ZW1wdHM6IDBcbiAgICB9KTtcbiAgICAvL0xldCBMYW1iZGEgc2VuZCBlbWFpbFxuICAgIGhhbmRsZXIuYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIHJlc291cmNlczogWydhcm46YXdzOnNlczp1cy13ZXN0LTI6NzE4NTIzMTI2MzIwOmlkZW50aXR5L3dvb2RhcmQudGhvbWFzQGdtYWlsLmNvbSddLFxuICAgICAgYWN0aW9uczogWydzZXM6U2VuZEVtYWlsJywgJ3NlczpTZW5kUmF3RW1haWwnXSxcbiAgICB9KSlcblxuXG4gICAgY29uc3QgbXlIb3N0ZWRab25lID0gcm91dGU1My5Ib3N0ZWRab25lLmZyb21Ib3N0ZWRab25lQXR0cmlidXRlcyh0aGlzLCBzaXRlTmFtZSArICctaG9zdGVkLXpvbmUnLCB7XG4gICAgICBob3N0ZWRab25lSWQsXG4gICAgICB6b25lTmFtZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFsaWFzUmVjb3JkID0gbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCBzaXRlTmFtZSArICctYWxpYXMtcmVjb3JkJywge1xuICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMobmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldChkaXN0cmlidXRpb24pKSxcbiAgICAgIHpvbmU6IG15SG9zdGVkWm9uZSxcbiAgICAgIHJlY29yZE5hbWU6IHNpdGVOYW1lLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiZGlzdElEXCIsIHtcbiAgICAgIGV4cG9ydE5hbWU6IFwiZGlzdElEXCIsXG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkXG4gICAgIH0pO1xuICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcImJ1Y2tldE5hbWVcIiwge1xuICAgICAgZXhwb3J0TmFtZTogXCJidWNrZXROYW1lXCIsXG4gICAgICB2YWx1ZTogc291cmNlQnVja2V0LmJ1Y2tldE5hbWVcbiAgICAgfSk7XG5cblxuXG4gIH1cbn1cbiJdfQ==