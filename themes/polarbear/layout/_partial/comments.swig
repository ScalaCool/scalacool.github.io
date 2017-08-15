{% if page.comments and not is_home() %}
  <div class="comments" id="comments">
    {% if theme.disqus_shortname %}
    <div style="text-align:center;">
        <button class="btn" id="load-disqus" onclick="disqus.load();">加载 Disqus 评论</button>
    </div>
      <div id="disqus_thread">
        <noscript>
          Please enable JavaScript to view the
          <a href="//disqus.com/?ref_noscript">comments powered by Disqus.</a>
        </noscript>
      </div>
    {% elif theme.duoshuo_shortname %}
      <div class="ds-thread" data-thread-key="{{ page.path }}"
           data-title="{{ page.title }}" data-url="{{ page.permalink }}">
      </div>
    {% endif %}
    <!--<div style="text-align:center;margin-top: 50px;">
      <a class="btn" href="https://gitter.im/scala_cool/Lobby?source=orgpage" target="_blank">评论这篇文章</a>
    </div>-->
    <div id="gitalk-container"></div>
    <script>
      var gitalk = new Gitalk({
        clientID: '23770b27c2837a5e79a1',
        clientSecret: 'd41712ccd45d7142b31d3b9f355e77f107b29ef2',
        repo: 'scalacool.github.io',
        owner: 'ScalaCool',
        admin: ['yison-dripower'],
        id: 'Demo',
        distractionFreeMode: true
      });
      gitalk.render('gitalk-container');
    </script>
  </div>
{% endif %}
