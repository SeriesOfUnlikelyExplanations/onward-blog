const { execSync } = require('child_process');
var fs = require('fs');
var path = require('path');

var options = {
  usage: 'None',
  arguments: [],
  desc: "uploads local changes and syncs to live for deployment in Github"
}

hexo.extend.console.register('upload', options.desc, options, async function(args){
  function walkSync(dir) {
    return new Promise(function(resolve, reject) {
      var walk = function(dir, done) {
        var results = [];
        fs.readdir(dir, function(err, list) {
          if (err) return done(err);
          var pending = list.length;
          if (!pending) return done(null, results);
          list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
              if (stat && stat.isDirectory()) {
                walk(file, function(err, res) {
                  results = results.concat(res);
                  if (!--pending) done(null, results);
                });
              } else {
                results.push(file);
                if (!--pending) done(null, results);
              }
            });
          });
        });
      };
      walk(dir, (err, data) => {
        if (err !== null) reject(err);
        else resolve(data);
      });
    });
  }

  var results = await walkSync(path.join(this.source_dir, '_posts'))
  console.log(results)

  // first push any local changes to main branch
  console.log('Pushing local changes to main (if any)...')
  execSync("git commit -a -m 'deploy push' && git push");
  console.log('Local changes pushed.')

  // then sync the main branch to the live branch - which will trigger the github workflow
  console.log('Pushing Main to Live...')
  execSync("git push origin main:live")
  console.log('Main pushed to Live.')
});
