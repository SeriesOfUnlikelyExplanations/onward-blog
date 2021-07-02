/**
* Fancybox Gallery tag
*
* Syntax:
*   {% fancygallery /path/to/image [/path/to/thumbnail] [title] %}
*/

hexo.extend.tag.register('gallery', function(args, content){
  var title = args.shift()
  var titleHtml = `<span class="caption">${title}</span>`
  var mainHtml = '<div id="mainCarousel" class="carousel mb-4 w-10/12 max-w-xl mx-auto">'
  var thumbHtml = '<div id="thumbCarousel" class="carousel max-w-xl mx-auto">'
  for (const arg of args) {
    var dotIndex = arg.lastIndexOf("/");
    if (dotIndex != -1) {
      var tinyurl = arg.substring(0, dotIndex+1) + 'tiny_' + this.src.substring(dotIndex+1)
      var smallurl = arg.substring(0, dotIndex+1) + 'small_' + this.src.substring(dotIndex+1)
    } else {
      var tinyurl = 'tiny_' + arg
      var smallurl = 'small_' + arg
    }
    mainHtml += `<div class="carousel__slide"><div class="panzoom"><img class="panzoom__content" src="${this.path+smallurl}" /></div></div>`
    thumbHtml += `<div class="carousel__slide"><img class="panzoom__content" src="${this.path+tinyurl}" /></div>`
  }
  mainHtml += '</div>'
  thumbHtml += '</div>'
  return mainHtml + titleHtml + thumbHtml
});


