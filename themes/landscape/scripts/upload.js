const { execSync } = require('child_process');
var fs = require('fs');
var path = require('path');
const mime = require('mime');
const AWS = require("aws-sdk");
execSync('tsc');
const config = require('../../../lib/config');
AWS.config.update({region:config.region});

var options = {
  usage: 'None',
  arguments: [],
  desc: "uploads local changes and syncs to live for deployment in Github"
}

hexo.extend.console.register('upload', options.desc, options, async function(args){
  // get SSM keys
  var ssm = new AWS.SSM();
  console.log(config.photosKey)
  var ssmData = await ssm.getParameters({Names: [config.photosKey]}).promise();

  //find image files for upload
  function walkSync(sourceDir) {
    return new Promise((resolve, reject) => {
      var walk = (dir, done) => {
        var results = [];
        fs.readdir(dir, (err, list) => {
          if (err) return done(err);
          var pending = list.length;
          if (!pending) return done(null, results);
          list.forEach((file) => {
            file = path.resolve(dir, file);
            fs.stat(file, (err, stat) => {
              if (stat && stat.isDirectory()) {
                walk(file, (err, res) => {
                  results = results.concat(res);
                  if (!--pending) done(null, results);
                });
              } else {
                if (file.match(/.(jpg|jpeg|png|gif)$/i)) {
                  results.push({
                    file: file,
                    key: file.replace(sourceDir + '/','')
                  });
                }
                if (!--pending) done(null, results);
              }
            });
          });
        });
      };
      walk(sourceDir, (err, data) => {
        if (err !== null) reject(err);
        else resolve(data);
      });
    });
  }
  var results = await walkSync(path.join(this.source_dir, '_posts'))
  console.log(results)

  //upload the images
  const s3 = new AWS.S3({
    accessKeyId: args.aws_key || process.env.AWS_ACCESS_KEY_ID || process.env.AWS_KEY,
    secretAccessKey: args.aws_secret || process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET,
  });
  const promises = [];
  results.forEach((artifact) => {
    let params = {
      Bucket: ssmData.Parameters.find(p => p.Name === config.photosKey).Value,
      Key: artifact.key,
      Body: fs.readFileSync(artifact.file),
      ContentType: mime.getType(artifact.file)
    };
    promises.push(s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err)
      } else {
        console.log('Successfully uploaded '+ artifact.key +' to ' + params.Bucket);
      }
    }).promise());
  });
  await Promise.all(promises)
  // first push any local changes to main branch
  console.log('Pushing local changes to main (if any)...')
  try {
    execSync("git commit -a -m 'deploy push' && git push");
  } catch {
    console.log("Already up to date");
  }
  console.log('Local changes pushed.')

  // then sync the main branch to the live branch - which will trigger the github workflow
  //~ console.log('Pushing Main to Live...')
  //~ execSync("git push origin main:live")
  //~ console.log('Main pushed to Live.')
});
