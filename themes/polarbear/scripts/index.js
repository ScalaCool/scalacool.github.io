hexo.extend.helper.register('list_custom_tags', function (tags, options) {
  if (!options && (!tags || !tags.hasOwnProperty('length'))) {
    options = tags;
    tags = this.site.tags;
  }

  if (!tags || !tags.length) return '';
  options = options || {};

  var style = options.hasOwnProperty('style') ? options.style : 'list';
  var showCount = options.hasOwnProperty('show_count') ? options.show_count : true;
  var className = options.class || 'tag';
  var orderby = options.orderby || 'name';
  var order = options.order || 1;
  var transform = options.transform;
  var suffix = options.suffix || '';
  var isSpecial = options.isSpecial || false
  var separator = options.hasOwnProperty('separator') ? options.separator : ', ';
  var result = '';
  var self = this;

  // Sort the tags
  tags = tags.sort(orderby, order);

  // Ignore tags with zero posts
  tags = tags.filter(function(tag) {
    if (!tag.length) {
      return false
    } else {
      var kwd = '~';
      if (isSpecial) {
        return tag.name.indexOf(kwd) !== -1;
      } else {
        return tag.name.indexOf(kwd) === -1;
      }
    }
  });

  // Limit the number of tags
  if (options.amount) tags = tags.limit(options.amount);

  if (style === 'list') {
    result += '<ul class="' + className + '-list">';

    tags.forEach(function(tag) {
      result += '<li class="' + className + '-list-item">';

      result += '<a class="' + className + '-list-link" href="' + self.url_for(tag.path) + suffix + '">';
      result += transform ? transform(tag.name.replace('~', '')) : tag.name.replace('~', '');
      result += '</a>';

      if (showCount) {
        result += '<span class="' + className + '-list-count">' + tag.length + '</span>';
      }

      result += '</li>';
    });

    result += '</ul>';
  } else {
    tags.forEach(function(tag, i) {
      if (i) result += separator;

      result += '<a class="' + className + '-link" href="' + self.url_for(tag.path) + suffix + '">';
      result += transform ? transform(tag.name) : tag.name;

      if (showCount) {
        result += '<span class="' + className + '-count">' + tag.length + '</span>';
      }

      result += '</a>';
    });
  }

  return result;
});