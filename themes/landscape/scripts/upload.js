const { execSync } = require('child_process');

var options = {
  usage: 'None',
  arguments: [],
  desc: "uploads local changes and syncs to live for deployment in Github"
}

hexo.extend.console.register('upload', options.desc, options, function(args){
  var stdout;

  console.log('Pushing local changes to main (if any)...')
  stdout = execSync("git commit -a -m 'deploy push' && git push");
  console.log(stdout)
  console.log('Local changes pushed.')

  console.log('Pushing Main to Live...')
  stdout = execSync("git push origin main:live")
  console.log(stdout)
  console.log('Main pushed to Live.')
  console.log(args);
});
