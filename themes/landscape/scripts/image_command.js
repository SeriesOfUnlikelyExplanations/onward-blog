//https://hexo.io/api/console
const fs = require('fs');
const path = require('path');

var options = {
  usage: '<title>',
  arguments: [
    {name: 'title', desc: 'Post title'}
  ]
}

hexo.extend.console.register('image', "adds all images to the post, so you don't forget any", options, function(args){
  var title = args._[0];
  var regex = new RegExp( `.*${title}.*\.(md)`, 'ig' )
  let postNames = fs.readdirSync(path.join(this.source_dir, '_posts')).filter( function( elm ) {return elm.match(regex);});
  if (postNames.length != 1) {
    console.log('file name does not match')
    return
  }
  let post = fs.readFileSync(path.join(this.source_dir, '_posts', postNames[0])).toString()
  console.log(post)


  fs.writeFile('output.txt', 'Hello Node', function (err) {
    if (err) throw err;
    console.log('It\'s saved!');
});
});
