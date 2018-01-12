{% if theme.widget.Tags %}
    <section id="tags" class="widget-area widget_tags">
        <h3 class="widget-title" style="padding-right: 10px;">分类</h3>
        {{ list_custom_tags({show_count: true, amount: 30, orderby: 'count', type: 0}) }}
    </section>
    <section id="tags" class="widget-area widget_tags">
        <h3 class="widget-title" style="padding-right: 10px;">专题</h3>
        {{  list_custom_tags({show_count: true, amount: 30, orderby: 'count', type: 1}) }}
    </section>
    <section id="tags" class="widget-area widget_tags">
        <h3 class="widget-title" style="padding-right: 10px;">作者</h3>
        {{  list_custom_tags({show_count: true, amount: 30, orderby: 'count', type: 2}) }}
    </section>
{% endif %}
