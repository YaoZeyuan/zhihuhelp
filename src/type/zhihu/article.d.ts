export type Record = {
  topics: [
    {
      url: 'https://www.zhihu.com/api/v4/topics/19590813' | string
      type: 'topic' | string
      id: '19590813' | string
      name: '前端入门' | string
    },
  ]
  excerpt:
    | '本来想写很多东西，但认真想想还是不浪费大家时间了。直接上结论： 如果真的有什么计算机名著可以只看目录的话，09年出版的《高性能网站建设进阶》显然算一本。09年在前端历史上是什么概念？直到09年5月，Chrome都还没有Mac版如果你不是<strong>专业</strong>的前端工程师，…'
    | string
  admin_closed_comment: false | boolean
  can_tip: false | boolean
  contributions: [
    {
      column: {
        updated: 1451801027 | number
        description: '东风夜放花千树，山长水阔知何处' | string
        can_manage: false | boolean
        intro: '东风夜放花千树，山长水阔知何处' | string
        is_following: false | boolean
        url_token: 'zhihuhelp' | string
        id: 'zhihuhelp' | string
        articles_count: 2 | number
        accept_submission: true | boolean
        title: '知乎助手的日常' | string
        url: 'https://zhuanlan.zhihu.com/zhihuhelp' | string
        comment_permission: 'all' | string
        created: 1451620108 | number
        image_url: 'https://pic3.zhimg.com/feedb41842166fae4b008d2addee9cab_b.jpg' | string
        author: {
          is_followed: false | boolean
          avatar_url_template: 'https://pic4.zhimg.com/dce9dde98c91a4d1e3cb86e627ecca86_{size}.jpg' | string
          uid: '27865550684160' | string
          user_type: 'people' | string
          is_following: false | boolean
          url_token: '404-Page-Not-found' | string
          id: '57842aac37ccd0de3965f9b6e17cb555' | string
          description: '' | string
          name: '姚泽源' | string
          is_advertiser: false | boolean
          headline: '专业填坑' | string
          gender: 1 | number
          url: '/people/57842aac37ccd0de3965f9b6e17cb555' | string
          avatar_url: 'https://pic4.zhimg.com/dce9dde98c91a4d1e3cb86e627ecca86_l.jpg' | string
          is_org: false | boolean
          type: 'people' | string
        }
        followers: 71 | number
        type: 'column' | string
      }
      state: 'accepted' | string
      type: 'first_publish' | string
      id: 455405 | number
    },
  ]
  id: 23141946 | number
  commercial_info: {
    is_commercial: false | boolean
  }
  voteup_count: 6 | number
  upvoted_followees: []
  title: '出版五年以上的前端书最好就别买了——读《高性能网站建设进阶》' | string
  image_width: 0 | number
  content:
    | '<p>本来想写很多东西，但认真想想还是不浪费大家时间了。直接上结论：</p><br><ol><li>如果真的有什么计算机名著可以只看目录的话，09年出版的《高性能网站建设进阶》显然算一本。09年在前端历史上是什么概念？直到09年5月，Chrome都还没有Mac版</li><li><p>如果你不是<strong>专业</strong>的前端工程师，平常的工作只是用选择器给元素加颜色调边距的话，那你几乎不需要优化CSS性能。网上流传的CSS选择器性能列表就是从这本书里传出来的，但传播的人显然没有及时跟进——作者在11年的时候就发布<a href="http://link.zhihu.com/?target=http%3A//calendar.perfplanet.com/2011/css-selector-performance-has-changed-for-the-better/" class=" wrap external" target="_blank" rel="nofollow noreferrer">博文</a>，宣布CSS选择器不再是性能瓶颈。</p><blockquote><p>结论：学前端，还是 <a href="http://link.zhihu.com/?target=https%3A//developer.mozilla.org/" class=" wrap external" target="_blank" rel="nofollow noreferrer">MDN</a> + 英语 靠谱</p></blockquote></li><li>(本书中唯一有用且没有过时的地方)<br>判断web应用相应时间的准则为:<ol><li>0.1秒 : 用户直接操作UI对象的感觉极限。比如，从用户选择一列到这一列高亮的间隔时间。理想情况下，这也应该是按列进行排序的时间——这种情况下用户会赶到他们正在给表格排序</li><li>1秒 ： 用户随意的进行操作儿无需过度等待的感觉极限。0.2~1.0秒的延迟会被用户注意到，因此会感到计算机处于对指令的“处理中”。如果操作超过1秒，用户就会感觉到UI变得缓慢且在执行任务中失去“流畅(flow)”的体验。超过一秒的延迟要提示用户计算机正在解决这个问题——例如改变光标的形状</li><li>10秒 ： 用户专注于任务的极限。超过10秒的任何任务都需要一个百分比指示器，以及一个方便用户中断操作且有清晰标识的方法</li></ol></li><li>如果你真的想建设高性能网站的话，用<a href="http://link.zhihu.com/?target=http%3A//vuejs.org/" class=" wrap external" target="_blank" rel="nofollow noreferrer">Vue</a>啊同志！<ol><li>整个页面一共就一个script标签布上完事哪还用得着整这些劳什子。。。</li></ol></li></ol>'
    | string
  comment_count: 0 | number
  is_title_image_full_screen: false | boolean
  title_image: '' | string
  type: 'article' | string
  annotation_action: []
  tipjarors_count: 0 | number
  status: 0 | number
  updated: 1477160518 | number
  is_labeled: false | boolean
  state: 'published' | string
  column?: {
    updated: 1451801027 | number
    description: '东风夜放花千树，山长水阔知何处' | string
    can_manage: false | boolean
    intro: '东风夜放花千树，山长水阔知何处' | string
    is_following: false | boolean
    url_token: 'zhihuhelp' | string
    id: 'zhihuhelp' | string
    articles_count: 2 | number
    accept_submission: true | boolean
    title: '知乎助手的日常' | string
    url: 'https://zhuanlan.zhihu.com/zhihuhelp' | string
    comment_permission: 'all' | string
    created: 1451620108 | number
    image_url: 'https://pic3.zhimg.com/feedb41842166fae4b008d2addee9cab_b.jpg' | string
    author: {
      is_followed: false | boolean
      avatar_url_template: 'https://pic4.zhimg.com/dce9dde98c91a4d1e3cb86e627ecca86_{size}.jpg' | string
      uid: '27865550684160' | string
      user_type: 'people' | string
      is_following: false | boolean
      url_token: '404-Page-Not-found' | string
      id: '57842aac37ccd0de3965f9b6e17cb555' | string
      description: '' | string
      name: '姚泽源' | string
      is_advertiser: false | boolean
      headline: '专业填坑' | string
      gender: 1 | number
      url: '/people/57842aac37ccd0de3965f9b6e17cb555' | string
      avatar_url: 'https://pic4.zhimg.com/dce9dde98c91a4d1e3cb86e627ecca86_l.jpg' | string
      is_org: false | boolean
      type: 'people' | string
    }
    followers: 71 | number
    type: 'column' | string
  }
  reason: '' | string
  share_text:
    | '出版五年以上的前端书最好就别买了——读《高性能网站建设进阶》 - 来自知乎专栏「知乎助手的日常」，作者: 姚泽源 https://zhuanlan.zhihu.com/p/23141946 （想看更多？下载 @知乎 App：http://weibo.com/p/100404711598 ）'
    | string
  voting: 0 | number
  created: 1477158948 | number
  has_publishing_draft: false | boolean
  comment_permission: 'all' | string
  author: {
    is_followed: false | boolean
    avatar_url_template: 'https://pic4.zhimg.com/dce9dde98c91a4d1e3cb86e627ecca86_{size}.jpg' | string
    uid: '27865550684160' | string
    user_type: 'people' | string
    is_following: false | boolean
    type: 'people' | string
    url_token: '404-Page-Not-found' | string
    id: '57842aac37ccd0de3965f9b6e17cb555' | string
    description: '' | string
    name: '姚泽源' | string
    is_advertiser: false | boolean
    headline: '专业填坑' | string
    gender: 1 | number
    url: '/people/57842aac37ccd0de3965f9b6e17cb555' | string
    avatar_url: 'https://pic4.zhimg.com/dce9dde98c91a4d1e3cb86e627ecca86_l.jpg' | string
    is_org: false | boolean
    badge: []
  }
  suggest_edit: {
    status: false | boolean
    url: '' | string
    reason: '' | string
    tip: '' | string
    title: '' | string
  }
  url: 'https://zhuanlan.zhihu.com/p/23141946' | string
  image_height: 0 | number
  image_url: '' | string
  is_favorited: false | boolean
  excerpt_title: '' | string
  can_comment: {
    status: true | boolean
    reason: '' | string
  }
  is_normal: true | boolean
}
