//~ var fs = require('fs');
//~ var ini = require('ini');
//~ var path = require('path');
//~ const s3 = require('s3');
const { execSync  } = require('child_process');

hexo.extend.deployer.register('cdk', function(args) {
  //deploy cdk first
  let stdout = execSync('cdk deploy --require-approval never --outputs-file output.json');
  console.log(stdout)
  var config = {
     maxAsyncS3: args.concurrency || 20,
     s3Options: {
       accessKeyId: args.aws_key || process.env.AWS_ACCESS_KEY_ID || process.env.AWS_KEY,
       secretAccessKey: args.aws_secret || process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET,
       region: args.region
     }
   };
   if (!config.s3Options.accessKeyId && !config.s3Options.secretAccessKey && args.aws_cli_profile) {
     /* User configured their access and secret keys in ~/.aws/credentials, check there */
     var iniFile = path.join(process.env.HOME, '.aws');
     var iniCredentials = ini.parse(fs.readFileSync(path.join(iniFile, 'credentials'), 'utf-8'));
     config.s3Options.accessKeyId = (iniCredentials[args.aws_cli_profile] || {}).aws_access_key_id;
     config.s3Options.secretAccessKey = (iniCredentials[args.aws_cli_profile] || {}).aws_secret_access_key;
     if (!config.s3Options.region) {
       var iniConfig = ini.parse(fs.readFileSync(path.join(iniFile, 'config'), 'utf-8'));
       var profilePath = (args.aws_cli_profile === 'default') ? args.aws_cli_profile : "profile " + args.aws_cli_profile;
       config.s3Options.region = (iniConfig[profilePath] || {}).region;
     }
   }

   var client = s3.createClient(config);
   if (!args.bucket || !config.s3Options.accessKeyId || !config.s3Options.secretAccessKey) {
     console.log('You are missing one or more required parameters.');
     return;
   }

   var params = {
     localDir: this.config.public_dir,
     deleteRemoved: args.hasOwnProperty('delete_removed') ? Boolean(args.delete_removed): true,
     s3Params: {
       Bucket: args.bucket,
       Prefix: args.prefix
     }
   }

   var uploader = client.uploadDir(params);
   this.log.info('Uploading...');

   return uploader
     .on('progress', function() {
       //   log.info(uploader.progressAmount + ' / ' + uploader.progressTotal);
     }).on('end', function() {
       this.log.info('Done!');
     }).on('error', function(err) {
       this.log.error(err)
     });
});
