const { execSync } = require('child_process');
var fs = require('fs');
var path = require('path');
const mime = require('mime');
const AWS = require("aws-sdk");
const stream = require("stream")
async = require("async")
const zlib = require('zlib');
var tar = require('tar');
var tars = require('tar-stream');

execSync('tsc');
const config = require('../../../lib/config');
AWS.config.update({region:config.region});

var options = {
  usage: 'None',
  arguments: [],
  desc: "Uploads all local images to the sync and downloads all synced images for deployment. Can be run locally - but ideally will run on the remote."
}

hexo.extend.console.register('s3Sync', options.desc, options, async function(args){
  // get SSM keys
  var ssm = new AWS.SSM();
  var ssmData = await ssm.getParameters({Names: [config.photosKey]}).promise();

  // initialize S3
    const s3 = new AWS.S3({
    accessKeyId: args.aws_key || process.env.AWS_ACCESS_KEY_ID || process.env.AWS_KEY,
    secretAccessKey: args.aws_secret || process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET,
  });

  //upload tar files
  const files = fs.readdirSync(path.join(this.source_dir, '_posts'));
  await new Promise((resolve, reject) => {
    async.eachSeries(files, (file, cb) => {
      const filePath = path.join(this.source_dir, '_posts', file);
      const stat = fs.statSync(filePath)
      if (stat && stat.isDirectory()) {
        console.log('Compressing '+file)
        const pass = new stream.PassThrough()
        const s3params = {
          Bucket: ssmData.Parameters.find(p => p.Name === config.photosKey).Value,
          Key: path.basename(file) + '.tar.gz',
          Body: pass,
          ContentType: 'application/gzip'
        }
        s3.upload(s3params, (err, data) => {
          if (err) console.log(err)
          if (data) {
            cb()
            console.log('Successfully uploaded ' + file + '.tar.gz')
          }
        })
        console.log(filePath);
        tar.c({ gzip: true, C: path.join(this.source_dir, '_posts') }, [file])
          .pipe(pass)
      } else {
        cb()
      }
    }, function(err) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve();
      }
    });
  });

  //download tar files
  const data = await s3.listObjects({Bucket: ssmData.Parameters.find(p => p.Name === config.photosKey).Value}).promise()
  async.eachSeries(data.Contents, async (fileObj, cb) => {
    var key = fileObj.Key;
    console.log('Downloading: ' + key);
    var fileParams = {
      Bucket: ssmData.Parameters.find(p => p.Name === config.photosKey).Value,
      Key: key
    }
    var outputPath = path.join(this.source_dir, '_posts', key.replace('.tar.gz', ""))
    const s3ReadStream = s3.getObject(fileParams).createReadStream();
    var extract = tars.extract();
    extract.on('warn', (e) => {console.log(e)})
    extract.on('entry', (header, inputStream, next) => {
      if (header.type === 'directory') {
        fs.mkdir(path.join(this.source_dir, '_posts', header.name), {recursive:true}, (err) => {
          inputStream.resume()
          if (err) return console.error(err);
          console.log('Directory created ' + header.name);
          next()
        })
      } else {
        console.log('Processing: '+ header.name);
        inputStream.pipe(fs.createWriteStream(path.join(this.source_dir, '_posts', header.name)));
        inputStream.on('finish', () => {
          console.log('Finished processing '+header.name)
          next()
        });
        inputStream.resume();
      }
    });

    extract.on('finish', () => {
      console.log('Finished download ' + outputPath)
    });
    s3ReadStream
      .on('warn', (e) => {console.log(e)})
      .pipe(zlib.createGunzip())
      .pipe(extract);
  });
});
