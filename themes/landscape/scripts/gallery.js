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
    //~var dotIndex = this.src.lastIndexOf("/");
    //~if (dotIndex != -1) this.src = this.src.substring(0, dotIndex+1) + 'small_' + this.src.substring(dotIndex+1)
    mainHtml += `<div class="carousel__slide"><div class="panzoom"><img class="panzoom__content" src="${this.path+arg}" /></div></div>`
    thumbHtml += `<div class="carousel__slide"><img class="panzoom__content" src="${this.path+arg}" /></div>`
  }
  mainHtml += '</div>'
  thumbHtml += '</div>'
  return mainHtml + titleHtml + thumbHtml
});
//------------------------------------------------------------------------------------------------------------
// the HTML

//~<div id="mainCarousel" class="carousel mb-4 w-10/12 max-w-xl mx-auto">
  //~<div class="carousel__slide">
    //~<div class="panzoom">
      //~<img class="panzoom__content" src="https://lipsum.app/id/55/1200x675" />
    //~</div>
  //~</div>
  //~<div class="carousel__slide">
    //~<div class="panzoom">
      //~<img class="panzoom__content" src="https://lipsum.app/id/66/1200x675" />
    //~</div>
  //~</div>
  //~<div class="carousel__slide">
    //~<div class="panzoom">
      //~<img class="panzoom__content" src="https://lipsum.app/id/77/1200x675" />
    //~</div>
  //~</div>
//~</div>

//~<div id="thumbCarousel" class="carousel max-w-xl mx-auto">
  //~<div class="carousel__slide">
    //~<img class="panzoom__content" src="https://lipsum.app/id/55/100x100" />
  //~</div>
  //~<div class="carousel__slide">
    //~<img class="panzoom__content" src="https://lipsum.app/id/66/100x100" />
  //~</div>
  //~<div class="carousel__slide">
    //~<img class="panzoom__content" src="https://lipsum.app/id/77/100x100" />
  //~</div>
//~</div>



