

hexo.extend.console.register('upload', options.desc, options, function(args){
  console.log('Pushing changes to main (if any)...')
  let stdout = execSync('');
  console.log(stdout)
  console.log('CDK deployment complete.')
  console.log(args);
//tewst
});
