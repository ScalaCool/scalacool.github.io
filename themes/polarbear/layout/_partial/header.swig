{% if is_home() %}
<div class="colored-header">
    <div class="wrap clearfix">
        <div id="clogo">
            <a href="/">
                <img src="/images/avatar/scalacool.png" onmouseover="this.src='/images/avatar/scalacool-blind.png'" onmouseout="this.src='/images/avatar/scalacool.png'" />
            </a>
        </div>
        <div id="blog-name">
            <img src="/images/blog-name.svg" />
        </div>
        <div class="dive-into-kotlin">
            <a
                href="https://book.douban.com/subject/33419618/"
                title="《Kotlin核心编程》"
                target="_blank"><img src="/images/dive-into-kotlin.svg" /></a>
        </div>
        <nav id="menu">
            {% if theme.menu %}
                <ul id="menu-top" class="nav-top-items">
                    {% for name, path in theme.menu %}
                        <li class="menu-item">
                            <a href="{{ url_for(path) }}">
                                {% set itemName = 'menu.' + name.toLowerCase() %}
                                {% if itemName.startsWith('menu') %}
                                    {{ name }}
                                {% else %}
                                    {{ __(itemName) }}
                                {% endif %}
                            </a>
                        </li>
                    {% endfor %}
                </ul>
            {% endif %}
    </nav>
    </div>
</div>
{% else %}
<div class="site-header-inner">
    <h1 class="site-title">
        <a href="{{ url_for('.') }}" class="logo">{{ config.title }}</a>
    </h1>
    <nav id="nav-top">
        {% if theme.menu %}
            <ul id="menu-top" class="nav-top-items">
                {% for name, path in theme.menu %}
                    <li class="menu-item">
                        <a href="{{ url_for(path) }}">
                            {% set itemName = 'menu.' + name.toLowerCase() %}
                            {% if itemName.startsWith('menu') %}
                                {{ name }}
                            {% else %}
                                {{ __(itemName) }}
                            {% endif %}
                        </a>
                    </li>
                {% endfor %}
            </ul>
        {% endif %}
  </nav>
</div>
{% endif %}