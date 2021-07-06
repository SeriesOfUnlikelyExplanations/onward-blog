const fs = require("fs");
const AWS = require("aws-sdk");
const path = require("path");
const { execSync } = require('child_process');

hexo.extend.deployer.register('cdk', function(args) {
  //deploy cdk first
  console.log('Deploying CDK...')
  let stdout = execSync('cdk deploy --require-approval never --outputs-file output.json');
  console.log(stdout)
  console.log('CDK deployment complete.')

  //Now deploy the s3 contents
  console.log('Deploying files to S3...')
  const s3bucket = new AWS.S3({
    accessKeyId: args.aws_key || process.env.AWS_ACCESS_KEY_ID || process.env.AWS_KEY,
    secretAccessKey: args.aws_secret || process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET,
  });

  function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
      var filePath = path.join(currentDirPath, name);
      var stat = fs.statSync(filePath);
      if (stat.isFile()) {
        callback(filePath, stat);
      } else if (stat.isDirectory()) {
        walkSync(filePath, callback);
      }
    });
  }

  walkSync(this.config.public_dir, function(filePath, stat) {
    let bucketPath = filePath.substring(this.config.public_dir.length+1);
    let params = {Bucket: bucketName, Key: bucketPath, Body: fs.readFileSync(filePath) };
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err)
      } else {
        console.log('Successfully uploaded '+ bucketPath +' to ' + bucketName);
      }
    });
  });
  console.log('S3 deployment complete.')
  return
});


//~var config = {
     //~maxAsyncS3: args.concurrency || 20,
     //~s3Options: {
       //~accessKeyId:
       //~secretAccessKey:
       //~region: args.region
     //~}
   //~};

   //~var client = s3.createClient(config);
   //~if (!args.bucket || !config.s3Options.accessKeyId || !config.s3Options.secretAccessKey) {
     //~console.log('You are missing one or more required parameters.');
     //~return;
   //~}

   //~var params = {
     //~localDir: this.config.public_dir,
     //~deleteRemoved: args.hasOwnProperty('delete_removed') ? Boolean(args.delete_removed): true,
     //~s3Params: {
       //~Bucket: args.bucket,
       //~Prefix: args.prefix
     //~}
   //~}

   //~var uploader = client.uploadDir(params);
   //~this.log.info('Uploading...');

   //~return uploader
     //~.on('progress', function() {
       //~//   log.info(uploader.progressAmount + ' / ' + uploader.progressTotal);
     //~}).on('end', function() {
       //~this.log.info('Done!');
     //~}).on('error', function(err) {
       //~this.log.error(err)
     //~});
