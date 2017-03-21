var authors = {
  yison: {
    avatar: 'https://avatars2.githubusercontent.com/u/12131115?v=3&s=460'
  },
  jilen: {
    blog: 'http://jilen.moe',
    avatar: 'https://avatars3.githubusercontent.com/u/546573?v=3&s=100'
  },
  shaw: {
    blog: 'http://shawdubie.com',
    avatar: 'http://shawdubie.com/assets/img/shaw.jpeg'
  },
  godpan: {
    blog: 'http://www.godpan.me',
    avatar: 'http://www.godpan.me/images/site-logo.png'
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
