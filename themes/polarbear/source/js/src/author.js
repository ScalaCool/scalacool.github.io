var authors = {
  yison: {
    avatar: '/avatar/yison.jpg'
  },
  jilen: {
    blog: 'http://jilen.moe',
    avatar: '/avatar/jilen.png'
  },
  shaw: {
    blog: 'http://shawdubie.com',
    avatar: '/avatar/shaw.jpg'
  },
  godpan: {
    blog: 'http://www.godpan.me',
    avatar: '/avatar/yison.png'
  },
  scalacool: {
    avatar: '/avatar/scalacool.png'
  }
}
function generateAvatarAuthorHtml (nick) {
  var author = authors[nick.toLowerCase()]
  return [
    '<a' + (author.blog ? ' href="' + author.blog + '" target="_blank" ' : ''),
    ' class="js-author">',
    '<img src="' + author.avatar + '" />',
    '</a>'
  ].join('')
}
function generateTextAuthorHtml (nick) {
  var author = authors[nick.toLowerCase()]
  return [
    author.blog ? '<a href="' + author.blog + '" target="blank" class="js-author">' : '',
    nick,
    author.blog ? '</a>' : ''
  ].join('')
}
$(document).ready(function () {
  var isHome = $('#primary').hasClass('home')
  var isPost = $('article').hasClass('post')
  if (isHome) {
    var $authorAvatarHolders = $('._author-avatar-holder')
    $authorAvatarHolders.each(function () {
      var author = $(this).data('author')
      var html = generateAvatarAuthorHtml(author)
      $(this).replaceWith(html)
    })
  }
  if (isPost) {
    var $authorTextHolders = $('._author-text-holder')
    $authorTextHolders.each(function () {
      var author = $(this).data('author')
      var html = generateTextAuthorHtml(author)
      $(this).replaceWith(html)
    })
  }
});