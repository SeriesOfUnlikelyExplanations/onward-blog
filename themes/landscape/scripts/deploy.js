const fs = require("fs");
const AWS = require("aws-sdk");
const path = require("path");
const mime = require('mime');
const { execSync } = require('child_process');
const config = require('../../../lib/config');
AWS.config.update({region:config.region});

hexo.extend.deployer.register('cdk', async function(args) {
  //deploy cdk first
  console.log('Deploying CDK...')
  let stdout = execSync('cdk deploy --require-approval never --outputs-file output.json');
  console.log(stdout)
  console.log('CDK deployment complete.')

  // get SSM keys
  var ssm = new AWS.SSM();
  var ssmData = await ssm.getParameters({Names: [args.bucket, args.distID]}).promise();
  //Now deploy the s3 contents
  console.log('Deploying files to S3...')
  const s3= new AWS.S3({
    accessKeyId: args.aws_key || process.env.AWS_ACCESS_KEY_ID || process.env.AWS_KEY,
    secretAccessKey: args.aws_secret || process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET,
  });
  function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach((name) => {
      var filePath = path.join(currentDirPath, name);
      var stat = fs.statSync(filePath);
      if (stat.isFile()) {
        callback(filePath, stat);
      } else if (stat.isDirectory()) {
        walkSync(filePath, callback);
      }
    });
  }
  walkSync(this.config.public_dir, (filePath, stat) => {
    let bucketPath = filePath.substring(this.config.public_dir.length+1);
    let params = {
      Bucket: ssmData.Parameters.find(p => p.Name = args.bucket).Value,
      Key: bucketPath,
      Body: fs.readFileSync(filePath),
      ContentType: mime.getType(filePath)
    };
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err)
      } else {
        console.log('Successfully uploaded '+ bucketPath +' to ' + params.Bucket);
      }
    });
  });
  console.log('S3 deployment complete.')

  //Kickoff the cloudfront invalidation
  console.log('Starting cloudfront invalidation...')
  var cloudfront = new AWS.CloudFront();
  var params = {
    DistributionId: ssmData.Parameters.find(p => p.Name = args.distID).Value;,
    InvalidationBatch: {
      CallerReference: new Date(), /* required */
      Paths: { /* required */
        Quantity: '1', /* required */
        Items: [
          '/*'
        ]
      }
    }
  };
  cloudfront.createInvalidation(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
  //~ "invalidate": "aws cloudfront create-invalidation --distribution-id `jq -r '.OnwardBlogStack.distID' output.json` --paths '/*'",
  return
});
