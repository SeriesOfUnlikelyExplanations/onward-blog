"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnwardBlogStack = void 0;
const cdk = require("@aws-cdk/core");
const aws_cloudfront_1 = require("@aws-cdk/aws-cloudfront");
const aws_s3_1 = require("@aws-cdk/aws-s3");
const lambda = require("@aws-cdk/aws-lambda");
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
exports.OnwardBlogStack = OnwardBlogStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib253YXJkLWJsb2ctc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvbndhcmQtYmxvZy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBc0M7QUFDdEMsNERBQStHO0FBQy9HLDRDQUE0RDtBQUU1RCw4Q0FBOEM7QUFDOUMsZ0RBQWlEO0FBQ2pELHdEQUF5RDtBQUN6RCxNQUFNLHFCQUFxQixHQUFHLFVBQVUsQ0FBQztBQUN6QyxNQUFNLGNBQWMsR0FBRyxxRkFBcUYsQ0FBQztBQUM3RyxNQUFNLFlBQVksR0FBRyxzQkFBc0IsQ0FBQztBQUM1QyxNQUFNLFFBQVEsR0FBRyx3QkFBd0IsQ0FBQztBQUMxQyxNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQztBQUVyQyxNQUFhLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDNUMsWUFBWSxLQUFjLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLDJCQUEyQjtRQUMzQixNQUFNLFlBQVksR0FBRyxJQUFJLGVBQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxHQUFHLFVBQVUsRUFBRTtZQUMzRCxvQkFBb0IsRUFBRSxZQUFZO1lBQ2xDLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDeEMsZ0JBQWdCLEVBQUUsSUFBSTtTQUN2QixDQUFDLENBQUM7UUFDSCx3REFBd0Q7UUFDeEQsTUFBTSxZQUFZLEdBQUcsSUFBSSwwQ0FBeUIsQ0FBQyxJQUFJLEVBQUUsUUFBUSxHQUFHLFNBQVMsRUFBRTtZQUM3RSxhQUFhLEVBQUU7Z0JBQ2I7b0JBQ0Usa0JBQWtCLEVBQUU7d0JBQ2xCLFVBQVUsRUFBRSxZQUFZLENBQUMsdUJBQXVCO3dCQUNoRCxvQkFBb0IsRUFBRSxxQ0FBb0IsQ0FBQyxTQUFTO3FCQUNyRDtvQkFDRCxTQUFTLEVBQUcsQ0FBRSxFQUFDLGlCQUFpQixFQUFFLElBQUksRUFBQyxDQUFDO2lCQUN6QzthQUNGO1lBQ0Qsa0JBQWtCLEVBQUU7Z0JBQ2xCLFVBQVUsRUFBRSxjQUFjO2dCQUMxQixLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUM7YUFDbEI7U0FDRixDQUFDLENBQUM7UUFFSCxtREFBbUQ7UUFDbkQsTUFBTSxPQUFPLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUM1RCxZQUFZLEVBQUUsa0JBQWtCO1lBQ2hDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7WUFDckMsT0FBTyxFQUFFLHFCQUFxQjtZQUM5QixVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDbEMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxhQUFhLEVBQUUsQ0FBQztTQUNqQixDQUFDLENBQUM7UUFDSCx1QkFBdUI7UUFDdkIscURBQXFEO1FBQ25ELHlGQUF5RjtRQUN6RixtREFBbUQ7UUFDckQsT0FBTztRQUdQLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsSUFBSSxFQUFFLFFBQVEsR0FBRyxjQUFjLEVBQUU7WUFDaEcsWUFBWTtZQUNaLFFBQVE7U0FDVCxDQUFDLENBQUM7UUFFSCxNQUFNLFdBQVcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsR0FBRyxlQUFlLEVBQUU7WUFDeEUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2xGLElBQUksRUFBRSxZQUFZO1lBQ2xCLFVBQVUsRUFBRSxRQUFRO1NBQ3JCLENBQUMsQ0FBQztRQUNILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1lBQ2hDLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLEtBQUssRUFBRSxZQUFZLENBQUMsY0FBYztTQUNsQyxDQUFDLENBQUM7UUFDSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNyQyxVQUFVLEVBQUUsWUFBWTtZQUN4QixLQUFLLEVBQUUsWUFBWSxDQUFDLFVBQVU7U0FDOUIsQ0FBQyxDQUFDO0lBSU4sQ0FBQztDQUNGO0FBbEVELDBDQWtFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjZGsgPSByZXF1aXJlKCdAYXdzLWNkay9jb3JlJyk7XG5pbXBvcnQgeyBDbG91ZEZyb250V2ViRGlzdHJpYnV0aW9uLCBPcmlnaW5BY2Nlc3NJZGVudGl0eSwgT3JpZ2luUHJvdG9jb2xQb2xpY3kgfSBmcm9tICdAYXdzLWNkay9hd3MtY2xvdWRmcm9udCdcbmltcG9ydCB7IEJ1Y2tldCwgQmxvY2tQdWJsaWNBY2Nlc3MgfSBmcm9tICdAYXdzLWNkay9hd3MtczMnO1xuaW1wb3J0IHsgQnVja2V0RGVwbG95bWVudCwgU291cmNlIH0gZnJvbSAnQGF3cy1jZGsvYXdzLXMzLWRlcGxveW1lbnQnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHJvdXRlNTMgPSByZXF1aXJlKCdAYXdzLWNkay9hd3Mtcm91dGU1MycpO1xuaW1wb3J0IHRhcmdldHMgPSByZXF1aXJlKCdAYXdzLWNkay9hd3Mtcm91dGU1My10YXJnZXRzJyk7XG5jb25zdCB3ZWJzaXRlRGlzdFNvdXJjZVBhdGggPSAnLi9wdWJsaWMnO1xuY29uc3QgY2VydGlmaWNhdGVBcm4gPSAnYXJuOmF3czphY206dXMtZWFzdC0xOjcxODUyMzEyNjMyMDpjZXJ0aWZpY2F0ZS83NTlhMjg2Yy1jNTdmLTQ0YjQtYTQwZi00Yzg2NGE4YWI0NDcnO1xuY29uc3QgaG9zdGVkWm9uZUlkID0gJ1owMDkyMTc1RVcwQUJQUzUxR1FCJztcbmNvbnN0IHNpdGVOYW1lID0gJ2Jsb2cuYWx3YXlzLW9ud2FyZC5jb20nO1xuY29uc3Qgem9uZU5hbWUgPSAnYWx3YXlzLW9ud2FyZC5jb20nO1xuXG5leHBvcnQgY2xhc3MgT253YXJkQmxvZ1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5BcHAsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcbiAgICAvL0NyZWF0ZSB0aGUgd2Vic2l0ZSBidWNrZXRcbiAgICBjb25zdCBzb3VyY2VCdWNrZXQgPSBuZXcgQnVja2V0KHRoaXMsIHNpdGVOYW1lICsgJy13ZWJzaXRlJywge1xuICAgICAgd2Vic2l0ZUluZGV4RG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcbiAgICAgIGJ1Y2tldE5hbWU6IHNpdGVOYW1lLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IHRydWUsXG4gICAgfSk7XG4gICAgLy9DcmVhdGUgdGhlIGNsb3VkZnJvbnQgZGlzdHJpYnV0aW9uIHRvIGNhY2hlIHRoZSBidWNrZXRcbiAgICBjb25zdCBkaXN0cmlidXRpb24gPSBuZXcgQ2xvdWRGcm9udFdlYkRpc3RyaWJ1dGlvbih0aGlzLCBzaXRlTmFtZSArICctY2Zyb250Jywge1xuICAgICAgb3JpZ2luQ29uZmlnczogW1xuICAgICAgICB7XG4gICAgICAgICAgY3VzdG9tT3JpZ2luU291cmNlOiB7XG4gICAgICAgICAgICBkb21haW5OYW1lOiBzb3VyY2VCdWNrZXQuYnVja2V0V2Vic2l0ZURvbWFpbk5hbWUsXG4gICAgICAgICAgICBvcmlnaW5Qcm90b2NvbFBvbGljeTogT3JpZ2luUHJvdG9jb2xQb2xpY3kuSFRUUF9PTkxZLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYmVoYXZpb3JzIDogWyB7aXNEZWZhdWx0QmVoYXZpb3I6IHRydWV9XVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgYWxpYXNDb25maWd1cmF0aW9uOiB7XG4gICAgICAgIGFjbUNlcnRSZWY6IGNlcnRpZmljYXRlQXJuLFxuICAgICAgICBuYW1lczogW3NpdGVOYW1lXVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBsYW1iZGEgZm9yIGFsbCBvZiB0aGUgYmFja2VuZCBzdXBwb3J0XG4gICAgY29uc3QgaGFuZGxlciA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ29ud2FyZEJsb2dMYW1iZGEnLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGBvbndhcmRCbG9nTGFtYmRhYCxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGFtYmRhJyksXG4gICAgICBoYW5kbGVyOiAnaW5kZXguZXZlbnRfaGFuZGxlcicsXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMjApLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzEwX1gsXG4gICAgICByZXRyeUF0dGVtcHRzOiAwXG4gICAgfSk7XG4gICAgLy9MZXQgTGFtYmRhIHNlbmQgZW1haWxcbiAgICAvL34gaGFuZGxlci5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgLy9+IHJlc291cmNlczogWydhcm46YXdzOnNlczp1cy1lYXN0LTE6NzMyOTU2MjQ3NDMxOmlkZW50aXR5L2Rhc2gtcmVwb3J0aW5nQGFtYXpvbi5jb20nXSxcbiAgICAgIC8vfiBhY3Rpb25zOiBbJ3NlczpTZW5kRW1haWwnLCAnc2VzOlNlbmRSYXdFbWFpbCddLFxuICAgIC8vfiB9KSlcblxuXG4gICAgY29uc3QgbXlIb3N0ZWRab25lID0gcm91dGU1My5Ib3N0ZWRab25lLmZyb21Ib3N0ZWRab25lQXR0cmlidXRlcyh0aGlzLCBzaXRlTmFtZSArICctaG9zdGVkLXpvbmUnLCB7XG4gICAgICBob3N0ZWRab25lSWQsXG4gICAgICB6b25lTmFtZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFsaWFzUmVjb3JkID0gbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCBzaXRlTmFtZSArICctYWxpYXMtcmVjb3JkJywge1xuICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMobmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldChkaXN0cmlidXRpb24pKSxcbiAgICAgIHpvbmU6IG15SG9zdGVkWm9uZSxcbiAgICAgIHJlY29yZE5hbWU6IHNpdGVOYW1lLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiZGlzdElEXCIsIHtcbiAgICAgIGV4cG9ydE5hbWU6IFwiZGlzdElEXCIsXG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkXG4gICAgIH0pO1xuICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcImJ1Y2tldE5hbWVcIiwge1xuICAgICAgZXhwb3J0TmFtZTogXCJidWNrZXROYW1lXCIsXG4gICAgICB2YWx1ZTogc291cmNlQnVja2V0LmJ1Y2tldE5hbWVcbiAgICAgfSk7XG5cblxuXG4gIH1cbn1cbiJdfQ==