{% macro render(post) %}
  <article class="post">
    <header class="post-header">
      <h1 class="post-title">
        {% if is_home() %}
          <a class="post-link" href="{{ url_for(post.path) }}">{{ post.title }}</a>
        {% else %}
          {{ post.title }}
        {% endif %}
      </h1>

      <time class="post-time">
          {{ full_date(post.date, 'MMMD日') }}
      </time>
      {% if is_post() && post.author %}
        <span class="author-split">|</span>
        <span class="author-info">
          by <span class="_author-text-holder" data-author="{{ post.author }}"></span>
        </span>
      {% endif %}
      {% if post.author %}
        <div class="avatar-holder">
          <span class="_author-avatar-holder" data-author="{{ post.author }}"></span>
        </div>
      {% endif %}
    </header>



    {% if is_home() %}
        <div class="post-excerpt">
            {% set excerpt = "" %}
            {% if post.description %}
              {% set excerpt = post.description %}
            {% elif post.excerpt %}
              {% set excerpt = post.excerpt %}
            {% endif %}

            {% if excerpt %}
              {{ excerpt }}
        </div>
            {% endif %}
          {% else %}
            <div class="post-content">
            {{ post.content }}
            </div>
          {% endif %}

    {% if post.tags and post.tags.length and not is_home() %}
      <footer class="post-footer">
        <div class="post-tags">
          {% for tag in post.tags %}
            <a href="{{ url_for(tag.path) }}">{{ tag.name }}</a>
          {% endfor %}
        </div>

        {# Post Pagination #}
        {% include "../_partial/pagination.swig" %}
        {% include "../_partial/comments.swig" %}
      </footer>
    {% endif %}
  </article>
{% endmacro %}
