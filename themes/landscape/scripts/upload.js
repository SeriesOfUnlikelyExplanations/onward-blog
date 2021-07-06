const { execSync } = require('child_process');

var options = {
  usage: 'None',
  arguments: [],
  desc: "uploads local changes and syncs to live for deployment in Github"
}

hexo.extend.console.register('upload', options.desc, options, function(args){


  // first push any local changes to main branch
  console.log('Pushing local changes to main (if any)...')
  execSync("git commit -a -m 'deploy push' && git push");
  console.log('Local changes pushed.')
  // then sync the main branch to the live branch - which will trigger the github workflow
  console.log('Pushing Main to Live...')
  execSync("git push origin main:live")
  console.log('Main pushed to Live.')
});
