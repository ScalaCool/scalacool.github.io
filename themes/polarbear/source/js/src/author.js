var authors = {
  yison: {
    avatar: '/images/avatar/yison.jpg'
  },
  jilen: {
    blog: 'http://jilen.moe',
    avatar: '/images/avatar/jilen.png'
  },
  shaw: {
    blog: 'http://shawdubie.com',
    avatar: '/images/avatar/shaw.jpg'
  },
  godpan: {
    blog: 'http://www.godpan.me',
    avatar: '/images/avatar/godpan.png'
  },
  prefert: {
    blog: 'http://prefer-tyl.site',
    avatar: '/images/avatar/prefert.jpg'
  },
  koon: {
    blog: 'http://zpkoon.xyz',
    avatar: '/images/avatar/zpkoon.png'
  },
  knewhow: {
    blog: 'http://knewhow.me',
    avatar: '/images/avatar/knewhow.png'
  },
  scalacool: {
    blog: 'http://twitter.com/scala_cool',
    avatar: '/images/avatar/scalacool.png'
  },
  rhyme: {
    blog: 'http://www.rhyme.ink/',
    avatar: '/images/avatar/rhyme.png'
  },
  captain: {
    avatar: '/images/avatar/captain.png',
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
function blink () {
  $('#logo img').attr('src', '/images/avatar/scalacool-blind.png')
    setTimeout(function () {
      $('#logo img').attr('src', '/images/avatar/scalacool.png')
    }, 200)
}
$(document).ready(function () {
  var isHome = $('#primary').hasClass('home')
  var isPost = $('article').hasClass('post')
  if (isHome) {
    var $authorAvatarHolders = $('._author-avatar-holder')
    $authorAvatarHolders.each(function () {
      var html = '';
      var authors = $(this).data('author').split('/')
      for (var i=0; i < authors.length; i++) {
        html += generateAvatarAuthorHtml(authors[i])
      }
      $(this).replaceWith(html)
    })
  }
  if (isPost) {
    var $authorTextHolders = $('._author-text-holder')
    $authorTextHolders.each(function () {
      var html = ''
      var authors = $(this).data('author').split('/')
      for (var i=0; i < authors.length; i++) {
        html += generateTextAuthorHtml(authors[i])
        if (i < authors.length - 1) {
          html += ' / ';
        }
      }
      $(this).replaceWith(html)
    })
  }
  setInterval(function () {
    blink()
  }, 5000)
  setTimeout(function () {
    blink()
  }, 1000)
});