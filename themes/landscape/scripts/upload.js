

hexo.extend.console.register('upload', options.desc, options, function(args){


  console.log('Pushing local changes to main (if any)...')
  let stdout = execSync("git commit -a -m 'deploy push' && git push");
  console.log(stdout)
  console.log('Local changes pushed.')
  console.log('Pushing Main to Live...')
  let stdout = execSync("git push origin main:live");
  console.log(stdout)
  console.log('Main pushed to Live.'
  console.log(args);
});
