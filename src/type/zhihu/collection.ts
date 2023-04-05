export type Info = {
  description: '我喜欢的内容，管他对不对呢= =' | string
  creator: {
    is_followed: false | boolean
    badge: [
      {
        topics: []
        type: 'best_answerer' | string
        description: '优秀回答者' | string
      },
    ]
    name: '高玄晔' | string
    url: 'https://api.zhihu.com/people/54779956889a3d72ed66eab2fd54e3cb' | string
    gender: 1 | number
    user_type: 'people' | string
    headline: '应无所住而生其心' | string
    avatar_url: 'http://pic3.zhimg.com/50/fc1f0ab619b3cb9dae7871ea8bd4213f_s.jpg' | string
    is_following: false | boolean
    type: 'people' | string
    id: '54779956889a3d72ed66eab2fd54e3cb' | string
  }
  url: 'https://www.zhihu.com/api/v4/collections/32755791' | string
  title: '摘录（有赞有感谢，仅仅是喜欢）' | string
  answer_count: 352 | number
  item_count: 352 | number
  created_time: 1395368585 | number
  comment_count: 0 | number
  follower_count: 999 | number
  is_public: true | boolean
  updated_time: 1549525381 | number
  type: 'collection' | string
  id: 32755791 | number
}
export type AnswerExcerpt = {
  question: {
    author: {
      is_followed: false | boolean
      badge: []
      name: '九斗' | string
      url: 'https://api.zhihu.com/people/9cd306943c0fdd19fd82d1bd2b2c6cdc' | string
      gender: 1 | number
      user_type: 'people' | string
      headline: '' | string
      avatar_url: 'http://pic1.zhimg.com/50/v2-7b232b3109b8f0e84b36b319437ead21_s.jpg' | string
      is_following: false | boolean
      type: 'people' | string
      id: '9cd306943c0fdd19fd82d1bd2b2c6cdc' | string
    }
    url: 'https://api.zhihu.com/questions/310424679' | string
    title: '《冰与火之歌》中有哪些不被人注意的梗？' | string
    created: 1548568065 | number
    is_muted: false | boolean
    is_following: false | boolean
    question_type: 'normal' | string
    type: 'question' | string
    id: 310424679 | number
  }
  is_copyable: true | boolean
  can_comment: {
    status: true | boolean
    reason: '' | string
  }
  is_collapsed: false | boolean
  author: {
    is_followed: false | boolean
    badge: []
    name: '戴蒙坦格利安' | string
    url: 'https://api.zhihu.com/people/03946cc8040a33c9bc66eb2821d60709' | string
    gender: 1 | number
    user_type: 'people' | string
    headline: '' | string
    avatar_url: 'http://pic4.zhimg.com/50/da8e974dc_s.jpg' | string
    is_following: false | boolean
    type: 'people' | string
    id: '03946cc8040a33c9bc66eb2821d60709' | string
  }
  url: 'https://api.zhihu.com/answers/585876967' | string
  comment_permission: 'all' | string
  excerpt:
  | '先说一个本人最喜欢、同时认为也是马丁设置的最精妙的彩蛋：冰火中某两个主要人物间的爱情，实际上是他们祖辈之间一段尚未开始就已结束的爱情的延续。在前传《七王国的骑士》中，男主“高个”邓肯曾邂逅了一位贵族小姐“红寡妇”罗翰妮·维伯，二人之间因为种种因缘际会而发展出了若有若无的情愫，当然这是段没有结果的爱情，主要是因为二人身份相差悬殊（罗翰妮是小贵族领主，邓肯只是个雇佣骑士——尽管他的侍从是未来的国王）…'
  | string
  | string
  collect_time: 1549815845 | number
  updated_time: 1548892577 | number
  comment_count: 29 | number
  created_time: 1548854227 | number
  voteup_count: 435 | number
  type: 'answer' | string
  id: 585876967 | number
  thanks_count: 55 | number
}

export type Type_Collection_Item_Pin = {
  content: {
    author: {
      id: 'ffbe1e25d78aa1aa39b6baf6a6a5c781' | string
      url_token: 'ccat' | string
      name: '汪惟' | string
      use_default_avatar: boolean
      avatar_url: 'https://pica.zhimg.com/484cac951_l.jpg?source=0df5f383' | string
      avatar_url_template: 'https://pica.zhimg.com/484cac951.jpg?source=0df5f383' | string
      is_org: boolean
      type: 'people' | string
      url: 'https://www.zhihu.com/people/ffbe1e25d78aa1aa39b6baf6a6a5c781' | string
      user_type: 'people' | string
      headline: '何事惊慌！！！！！！！！！！！！！！！！！！' | string
      gender: 1 | number
      is_advertiser: boolean
      vip_info: {
        is_vip: boolean
        rename_days: '' | string
        widget: {
          url: 'https://pic2.zhimg.com/v2-377163eddd9f6d5e5d639cf12214dc05_r.png' | string
          night_mode_url: 'https://pic2.zhimg.com/v2-26afadd8b7447d09335c5db537386ca9_r.png' | string
        }
        vip_icon: {
          url: 'https://pic2.zhimg.com/v2-4812630bc27d642f7cafcd6cdeca3d7a_r.png?source=0df5f383' | string
          night_mode_url: 'https://pic1.zhimg.com/v2-4812630bc27d642f7cafcd6cdeca3d7a_r.png?source=0df5f383' | string
        }
      }
      badge: [
        {
          type: 'best_answerer' | string
          description: '优秀答主' | string
          topics: [
            {
              id: '19550560' | string
              type: 'topic' | string
              url: 'https://www.zhihu.com/topic/19550560' | string
              name: '创业' | string
              avatar_url: 'https://pic2.zhimg.com/v2-af063bec99e4decd9aa90c38d709e46f_720w.jpg?source=32738c0c' | string
            },
            {
              id: '19604824' | string
              type: 'topic' | string
              url: 'https://www.zhihu.com/topic/19604824' | string
              name: '商业地产' | string
              avatar_url: 'https://pica.zhimg.com/v2-5280cadb3ee8356d1e433c5de7c9af50_720w.jpg?source=32738c0c' | string
            },
            {
              id: '19550803' | string
              type: 'topic' | string
              url: 'https://www.zhihu.com/topic/19550803' | string
              name: '市场营销' | string
              avatar_url: 'https://pica.zhimg.com/v2-204c2f2a2a4719fb9c43243cebe66cca_720w.jpg?source=32738c0c' | string
            },
            {
              id: '19551137' | string
              type: 'topic' | string
              url: 'https://www.zhihu.com/topic/19551137' | string
              name: '美食' | string
              avatar_url: 'https://pic1.zhimg.com/v2-81cfcb7438b1869ed6fc891461addc32_720w.jpg?source=32738c0c' | string
            },
            {
              id: '19551805' | string
              type: 'topic' | string
              url: 'https://www.zhihu.com/topic/19551805' | string
              name: '烹饪' | string
              avatar_url: 'https://pica.zhimg.com/v2-54d10632e3feeea534ab25d35aba51c5_720w.jpg?source=32738c0c' | string
            },
          ]
        },
      ]
      badge_v2: {
        title: '创业等 5 个话题下的优秀答主' | string
        merged_badges: [
          {
            type: 'best' | string
            detail_type: 'best' | string
            title: '优秀答主' | string
            description: '创业等 5 个话题下的优秀答主' | string
            url: 'https://www.zhihu.com/question/48509984' | string
            sources: [
              {
                id: '19550560' | string
                token: '19550560' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19550560' | string
                name: '创业' | string
                avatar_path: 'v2-af063bec99e4decd9aa90c38d709e46f' | string
                avatar_url:
                | 'https://pic2.zhimg.com/v2-af063bec99e4decd9aa90c38d709e46f_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19604824' | string
                token: '19604824' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19604824' | string
                name: '商业地产' | string
                avatar_path: 'v2-5280cadb3ee8356d1e433c5de7c9af50' | string
                avatar_url:
                | 'https://pica.zhimg.com/v2-5280cadb3ee8356d1e433c5de7c9af50_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19550803' | string
                token: '19550803' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19550803' | string
                name: '市场营销' | string
                avatar_path: 'v2-204c2f2a2a4719fb9c43243cebe66cca' | string
                avatar_url:
                | 'https://pica.zhimg.com/v2-204c2f2a2a4719fb9c43243cebe66cca_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19551137' | string
                token: '19551137' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19551137' | string
                name: '美食' | string
                avatar_path: 'v2-81cfcb7438b1869ed6fc891461addc32' | string
                avatar_url:
                | 'https://pic1.zhimg.com/v2-81cfcb7438b1869ed6fc891461addc32_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19551805' | string
                token: '19551805' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19551805' | string
                name: '烹饪' | string
                avatar_path: 'v2-54d10632e3feeea534ab25d35aba51c5' | string
                avatar_url:
                | 'https://pica.zhimg.com/v2-54d10632e3feeea534ab25d35aba51c5_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
            ]
            icon: '' | string
            night_icon: '' | string
          },
        ]
        detail_badges: [
          {
            type: 'best' | string
            detail_type: 'best_answerer' | string
            title: '优秀答主' | string
            description: '创业等 5 个话题下的优秀答主' | string
            url: 'https://www.zhihu.com/question/48509984' | string
            sources: [
              {
                id: '19550560' | string
                token: '19550560' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19550560' | string
                name: '创业' | string
                avatar_path: 'v2-af063bec99e4decd9aa90c38d709e46f' | string
                avatar_url:
                | 'https://pic2.zhimg.com/v2-af063bec99e4decd9aa90c38d709e46f_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19604824' | string
                token: '19604824' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19604824' | string
                name: '商业地产' | string
                avatar_path: 'v2-5280cadb3ee8356d1e433c5de7c9af50' | string
                avatar_url:
                | 'https://pica.zhimg.com/v2-5280cadb3ee8356d1e433c5de7c9af50_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19550803' | string
                token: '19550803' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19550803' | string
                name: '市场营销' | string
                avatar_path: 'v2-204c2f2a2a4719fb9c43243cebe66cca' | string
                avatar_url:
                | 'https://pica.zhimg.com/v2-204c2f2a2a4719fb9c43243cebe66cca_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19551137' | string
                token: '19551137' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19551137' | string
                name: '美食' | string
                avatar_path: 'v2-81cfcb7438b1869ed6fc891461addc32' | string
                avatar_url:
                | 'https://pic1.zhimg.com/v2-81cfcb7438b1869ed6fc891461addc32_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19551805' | string
                token: '19551805' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19551805' | string
                name: '烹饪' | string
                avatar_path: 'v2-54d10632e3feeea534ab25d35aba51c5' | string
                avatar_url:
                | 'https://pica.zhimg.com/v2-54d10632e3feeea534ab25d35aba51c5_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
            ]
            icon: 'https://pica.zhimg.com/v2-bf0eec3c31c8e866c468f60eb296696c_l.png?source=32738c0c' | string
            night_icon: 'https://pic1.zhimg.com/v2-c724649168d8f9d36d7c3d13140a2594_l.png?source=32738c0c' | string
          },
          {
            type: 'reward' | string
            detail_type: 'best_questioner' | string
            title: '优秀提问者' | string
            description: '优秀提问者' | string
            url: 'https://zhuanlan.zhihu.com/p/405412869' | string
            sources: []
            icon: 'https://pic1.zhimg.com/v2-bf0eec3c31c8e866c468f60eb296696c_l.png?source=32738c0c' | string
            night_icon: 'https://pic2.zhimg.com/v2-c724649168d8f9d36d7c3d13140a2594_l.png?source=32738c0c' | string
          },
        ]
        icon: 'https://pic1.zhimg.com/v2-bf0eec3c31c8e866c468f60eb296696c_l.png?source=32738c0c' | string
        night_icon: 'https://pic3.zhimg.com/v2-c724649168d8f9d36d7c3d13140a2594_l.png?source=32738c0c' | string
      }
      actived_at: 1 | number
    }
    comment_count: 26 | number
    content: [
      {
        content:
        | '分享一个最近最神的东西：催眠音频。神在哪里？我听了十几次，没有一次听完的。\u003cbr\u003e\u003cbr\u003e王力宏去年找人录的，优点是完全中文母语的，不用费劲。一般十几分钟就睡着了，比褪黑素还管事，就是这么神。\u003cbr\u003e\u003cbr\u003e甚至其中还有几次睡多了半夜醒来，辗转反侧，戴上耳机听着也能睡着，睡得还贼熟。\u003cbr\u003e\u003cbr\u003e亲测有效，分享出来祝大家睡个好觉。\u003cbr\u003e\u003cbr\u003e百度网盘分享的内容~复制这段内容打开「百度网盘」APP即可获取 \u003cbr\u003e链接:\u003ca href="https://link.zhihu.com/?target=https%3A//pan.baidu.com/s/1x1XVbq4FGbiuHESQn6eCvw" data-icon-type="link" data-original-url="https://pan.baidu.com/s/1x1XVbq4FGbiuHESQn6eCvw" class="external"\u003e链接\u003c/a\u003e \u003cbr\u003e提取码:wang\u003cbr\u003e\u003ca href="zhihu://pin/feedaction/fold/"\u003e收起\u003c/a\u003e'
        | string
        fold_content:
        | '分享一个最近最神的东西：催眠音频。神在哪里？我听了十几次，没有一次听完的。\u003cbr/\u003e\u003cbr/\u003e王力宏去年找人录的，优点是完全中文母语的，不用费劲。一般十几分钟就睡着了，比褪黑素还管事，就是这么神。\u003cbr/\u003e\u003ca href="zhihu://pin/feedaction/unfold/"\u003e展开\u003c/a\u003e'
        | string
        fold_type: 'normal_fold' | string
        own_text:
        | '分享一个最近最神的东西：催眠音频。神在哪里？我听了十几次，没有一次听完的。\u003cbr\u003e\u003cbr\u003e王力宏去年找人录的，优点是完全中文母语的，不用费劲。一般十几分钟就睡着了，比褪黑素还管事，就是这么神。\u003cbr\u003e\u003cbr\u003e甚至其中还有几次睡多了半夜醒来，辗转反侧，戴上耳机听着也能睡着，睡得还贼熟。\u003cbr\u003e\u003cbr\u003e亲测有效，分享出来祝大家睡个好觉。\u003cbr\u003e\u003cbr\u003e百度网盘分享的内容~复制这段内容打开「百度网盘」APP即可获取 \u003cbr\u003e链接:\u003ca href="https://link.zhihu.com/?target=https%3A//pan.baidu.com/s/1x1XVbq4FGbiuHESQn6eCvw" data-icon-type="link" data-original-url="https://pan.baidu.com/s/1x1XVbq4FGbiuHESQn6eCvw" class="external"\u003e链接\u003c/a\u003e \u003cbr\u003e提取码:wang'
        | string
        text_link_type: 'none' | string
        type: 'text' | string
      },
      {
        height: 1440 | number
        is_gif: boolean
        is_watermark: boolean
        original_url: 'https://picx.zhimg.com/80/v2-f44f435af69250922f96809a649b5f01_qhd.jpg' | string
        thumbnail: '' | string
        type: 'image' | string
        url: 'https://pica.zhimg.com/80/v2-25270d7dd9ec27671ecfb87a1da91720_qhd.jpg' | string
        watermark_url: 'https://pica.zhimg.com/80/v2-25270d7dd9ec27671ecfb87a1da91720_qhd.jpg' | string
        width: 1080 | number
      },
    ]
    created: 1642003694 | number
    excerpt_title: '分享一个最近最神的东西：催眠音频' | string
    id: '1464750338461233152' | string
    like_count: 0 | number
    reaction_count: 122 | number
    type: 'pin'
    updated: 1642003694 | number
    url: 'https://www.zhihu.com/pin/1464750338461233152' | string
    virtuals: {
      is_liked: boolean
      is_favorited: boolean
      reaction_type: 'like' | string
    }
  }
  created: '2022-01-13T00:08:14+08:00' | string
}
export type Type_Collection_Item_Article = {
  content: {
    id: '526672568' | string
    title: '趁着618 ，试搞一个私有云耍一下' | string
    type: 'article'
    excerpt_title:
    | '书接上回，去年年底的时候我萌发了一个要搞一个私有云来解决我这个电子产品存储困难的问题，当时我写过一个文章，想要跟大家探讨下，一个普通人想要的私有云是什么样子的。 [文章: 普通人想要的私有云是什么样的？] 没想到我一个技术白，在评论区里引…'
    | string
    url: 'https://zhuanlan.zhihu.com/p/526672568' | string
    image_url: '' | string
    created: 1654785387 | number
    updated: 1654835412 | number
    author: {
      id: 'fe3d812b3504241705d0c2d051be7309' | string
      url_token: 'lengzhe1984' | string
      name: '极萨学院冷哲' | string
      use_default_avatar: boolean
      avatar_url: 'https://pic2.zhimg.com/v2-2d7e4f2dde5a562ee07e4c27a2fc2b7c_l.jpg?source=0df5f383' | string
      avatar_url_template: 'https://pica.zhimg.com/v2-2d7e4f2dde5a562ee07e4c27a2fc2b7c.jpg?source=0df5f383' | string
      is_org: boolean
      type: 'people' | string
      url: 'https://www.zhihu.com/people/fe3d812b3504241705d0c2d051be7309' | string
      user_type: 'people' | string
      headline: '有时治愈，常常帮助，总是安慰' | string
      gender: 1 | number
      is_advertiser: boolean
      vip_info: {
        is_vip: boolean
        rename_days: '' | string
        widget: {
          url: 'https://pic3.zhimg.com/v2-31e495a5e14cbafe27b5c33720cba4bf_r.png?source=0df5f383' | string
          night_mode_url: 'https://pic2.zhimg.com/v2-31e495a5e14cbafe27b5c33720cba4bf_r.png?source=0df5f383' | string
        }
        vip_icon: {
          url: 'https://pica.zhimg.com/v2-4812630bc27d642f7cafcd6cdeca3d7a_r.png?source=0df5f383' | string
          night_mode_url: 'https://pic2.zhimg.com/v2-4812630bc27d642f7cafcd6cdeca3d7a_r.png?source=0df5f383' | string
        }
      }
      badge: [
        {
          type: 'best_answerer' | string
          description: '优秀答主' | string
          topics: [
            {
              id: '19575492' | string
              type: 'topic' | string
              url: 'https://www.zhihu.com/topic/19575492' | string
              name: '生物学' | string
              avatar_url: 'https://pic2.zhimg.com/v2-fd942865774a50cc4e9cff81e6550e00_720w.jpg?source=32738c0c' | string
            },
          ]
        },
        {
          type: 'identity' | string
          description: '科学盐究员' | string
        },
      ]
      badge_v2: {
        title: '知乎十年新知答主' | string
        merged_badges: [
          {
            type: 'best' | string
            detail_type: 'best' | string
            title: '新知答主' | string
            description: '知乎十年新知答主' | string
            url: 'https://zhuanlan.zhihu.com/p/344234033' | string
            sources: []
            icon: '' | string
            night_icon: '' | string
          },
          {
            type: 'identity' | string
            detail_type: 'identity' | string
            title: '认证' | string
            description: '科学盐究员' | string
            url: 'https://www.zhihu.com/account/verification/intro' | string
            sources: []
            icon: '' | string
            night_icon: '' | string
          },
        ]
        detail_badges: [
          {
            type: 'reward' | string
            detail_type: 'zhihu_10years_answerer' | string
            title: '新知答主' | string
            description: '知乎十年新知答主' | string
            url: 'https://zhuanlan.zhihu.com/p/344234033' | string
            sources: []
            icon: 'https://pic3.zhimg.com/v2-bf0eec3c31c8e866c468f60eb296696c_l.png?source=32738c0c' | string
            night_icon: 'https://pic2.zhimg.com/v2-c724649168d8f9d36d7c3d13140a2594_l.png?source=32738c0c' | string
          },
          {
            type: 'reward' | string
            detail_type: 'zhihu_yearly_answerer' | string
            title: '新知答主' | string
            description: '2020 新知答主' | string
            url: 'https://www.zhihu.com/question/510340037' | string
            sources: [
              {
                id: '2020' | string
                token: '' | string
                type: 'year' | string
                url: '' | string
                name: '' | string
                avatar_path: '' | string
                avatar_url: '' | string
                description: '' | string
              },
            ]
            icon: 'https://pic2.zhimg.com/v2-bf0eec3c31c8e866c468f60eb296696c_l.png?source=32738c0c' | string
            night_icon: 'https://pic1.zhimg.com/v2-c724649168d8f9d36d7c3d13140a2594_l.png?source=32738c0c' | string
          },
          {
            type: 'best' | string
            detail_type: 'best_answerer' | string
            title: '优秀答主' | string
            description: '生物学话题下的优秀答主' | string
            url: 'https://www.zhihu.com/question/48509984' | string
            sources: [
              {
                id: '19575492' | string
                token: '19575492' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19575492' | string
                name: '生物学' | string
                avatar_path: 'v2-fd942865774a50cc4e9cff81e6550e00' | string
                avatar_url:
                | 'https://pic2.zhimg.com/v2-fd942865774a50cc4e9cff81e6550e00_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
            ]
            icon: 'https://pic1.zhimg.com/v2-bf0eec3c31c8e866c468f60eb296696c_l.png?source=32738c0c' | string
            night_icon: 'https://pic2.zhimg.com/v2-c724649168d8f9d36d7c3d13140a2594_l.png?source=32738c0c' | string
          },
          {
            type: 'identity' | string
            detail_type: 'identity_people' | string
            title: '已认证的个人' | string
            description: '科学盐究员' | string
            url: 'https://www.zhihu.com/account/verification/intro' | string
            sources: []
            icon: 'https://pic1.zhimg.com/v2-235258cecb8a0f184c4d38483cd6f6b6_l.png?source=32738c0c' | string
            night_icon: 'https://pica.zhimg.com/v2-45e870b8f0982bcd7537ea4627afbd00_l.png?source=32738c0c' | string
          },
        ]
        icon: 'https://pic3.zhimg.com/v2-7a1a13d7531f29551f79278e9391b8ee_l.png?source=32738c0c' | string
        night_icon: 'https://pic2.zhimg.com/v2-af71f641951fd5f8b4a7d305288693df_l.png?source=32738c0c' | string
      }
      actived_at: 1 | number
    }
    comment_permission: 'all' | string
    content:
    | '\u003cp data-pid="RCcyCpOz"\u003e书接上回，去年年底的时候我萌发了一个要搞一个私有云来解决我这个电子产品存储困难的问题，当时我写过一个文章，想要跟大家探讨下，一个普通人想要的私有云是什么样子的。\u003c/p\u003e\u003ca href="https://zhuanlan.zhihu.com/p/445900932" data-draft-node="block" data-draft-type="link-card" data-image="https://pic4.zhimg.com/v2-d21f9c64a351af0f518d8cd7ba28e087_qhd.jpg" data-image-width="1482" data-image-height="1106" class="internal"\u003e极萨学院冷哲：普通人想要的私有云是什么样的？\u003c/a\u003e\u003cp data-pid="CQIerwvb"\u003e没想到我一个技术白，在评论区里引来了很多大神们的讨论，其实u1s1啊，很多评论区的讨论我都看不懂……\u003c/p\u003e\u003cp data-pid="fGOhL6qx"\u003e不过这不耽误我后来废了一番力气，在3月的时候还是弄到了一台极空间Z2s。我没有弄官方的套装，而是自己淘了2个2t的硬盘，讲道理官方的2个4t硬盘的套装价格奔着3000多去了有点承受不起，而且对于我一个普通用户来说，4T我觉得好大好大了。毕竟我一个手机和电脑都是512的选手，4t就已经是8倍了。\u003c/p\u003e\u003cfigure data-size="normal"\u003e\u003cimg src="https://pic2.zhimg.com/v2-1659a49c38c2da8273d0634a48bf5961_b.jpg" data-caption="" data-size="normal" data-rawwidth="1920" data-rawheight="1080" class="origin_image zh-lightbox-thumb" width="1920" data-original="https://pic2.zhimg.com/v2-1659a49c38c2da8273d0634a48bf5961_r.jpg"/\u003e\u003c/figure\u003e\u003cp data-pid="AtGA1BBX"\u003e组装过程还好，没有我想的那么复杂，就是在插硬盘的时候，有一点不太好插，怕太用力把硬盘弄坏，但是不用力还真就插不进去。\u003c/p\u003e\u003cfigure data-size="normal"\u003e\u003cimg src="https://pic2.zhimg.com/v2-204c006e8553b415b282f5cb2c39d665_b.jpg" data-caption="" data-size="normal" data-rawwidth="987" data-rawheight="1756" class="origin_image zh-lightbox-thumb" width="987" data-original="https://pic2.zhimg.com/v2-204c006e8553b415b282f5cb2c39d665_r.jpg"/\u003e\u003c/figure\u003e\u003cp data-pid="CjLOJfrM"\u003e总之还是顺利的装好了，就是到最后剩下了几个零件，我总有一种是不是忘了装什么的感觉。\u003c/p\u003e\u003cfigure data-size="normal"\u003e\u003cimg src="https://pic1.zhimg.com/v2-99f8e33dacbdba547c1c2b0fb7274730_b.jpg" data-caption="" data-size="normal" data-rawwidth="4032" data-rawheight="3024" class="origin_image zh-lightbox-thumb" width="4032" data-original="https://pic1.zhimg.com/v2-99f8e33dacbdba547c1c2b0fb7274730_r.jpg"/\u003e\u003c/figure\u003e\u003cp data-pid="Y_xkBGmi"\u003e最后的组成品是这样的。\u003c/p\u003e\u003cfigure data-size="normal"\u003e\u003cimg src="https://pic4.zhimg.com/v2-6a858f304303a667231a8dfda3f4fbcb_b.jpg" data-caption="" data-size="normal" data-rawwidth="2300" data-rawheight="1280" class="origin_image zh-lightbox-thumb" width="2300" data-original="https://pic4.zhimg.com/v2-6a858f304303a667231a8dfda3f4fbcb_r.jpg"/\u003e\u003c/figure\u003e\u003cp data-pid="MvlKCwwz"\u003e我想过这东西摆在桌面上，后来鉴于桌面空间不足，而且想了下，自从组装好以后在也没有去碰过这东西，所以就直接塞到脚底下了。\u003c/p\u003e\u003cp data-pid="WfzDzB6w"\u003e用了也有几个月了，说说感受。\u003c/p\u003e\u003cp data-pid="Y9nk-34F"\u003e既然是家庭私有云，其实核心功能就是解决各种电子设备的集中备份功能，极空间在这点上做的确实给力。\u003c/p\u003e\u003cfigure data-size="normal"\u003e\u003cimg src="https://pic1.zhimg.com/v2-f18db3829483a5af425759c1aef50f54_b.jpg" data-caption="" data-size="normal" data-rawwidth="1442" data-rawheight="1374" class="origin_image zh-lightbox-thumb" width="1442" data-original="https://pic1.zhimg.com/v2-f18db3829483a5af425759c1aef50f54_r.jpg"/\u003e\u003c/figure\u003e\u003cp data-pid="BX_c9A5i"\u003e首先先说基础的相册备份功能，这也是困扰我和很多人的一个问题。我前两天还在帮同事参谋买一个新的ipad，她提出来要买2T的，我都惊了，官网17000多，讲真我第一次看到有人要买2T的ipad。\u003c/p\u003e\u003cp data-pid="gQpsyGjM"\u003e我说为啥要2t呢？就是相册里的照片和视频太多了，尤其是平时给孩子拍的很多视频非常占空间。后来在我的劝导之下，还是买了个1T的ipad，然后回去考虑在弄个私有云。\u003c/p\u003e\u003cp data-pid="PpSLHV3F"\u003e从我的使用感受来说，极空间的相册备份速度是非常快的，因为我同期还用着百度云盘的年费会员和iCloud。从3者上传速度来看极空间是最快的，百度云第二，iCloud最慢。但从对使用者的感受来说，iCloud最好，而极空间和百度云都是需要打开app才开始上传。\u003c/p\u003e\u003cp data-pid="ocaYZhjg"\u003e不光是我自己在用，我媳妇和老妈的手机也把所有的相册都搬到极空间里了，直接打消了他们2个换手机的想法。\u003c/p\u003e\u003cp data-pid="KDBPvVGP"\u003e有时候翻翻相册，还能翻到6，7年前的老照片，看着孩子从小到大的成长，还是挺感慨的。\u003c/p\u003e\u003cp data-pid="s1p9LcQG"\u003e不过这里吐个槽，极空间的相册可以按年月日查看图片，月日查看是没问题的，但哪个年查看……总有bug，希望官方早点修。\u003c/p\u003e\u003cp data-pid="oQvQL77t"\u003e而除了相册以外，极空间一开始还有一个功能呢是挺吸引我的，就是微信备份。\u003c/p\u003e\u003cfigure data-size="normal"\u003e\u003cimg src="https://pic4.zhimg.com/v2-62b79e9272a29a860f230009b2fe360b_b.jpg" data-caption="" data-size="normal" data-rawwidth="824" data-rawheight="714" class="origin_image zh-lightbox-thumb" width="824" data-original="https://pic4.zhimg.com/v2-62b79e9272a29a860f230009b2fe360b_r.jpg"/\u003e\u003c/figure\u003e\u003cp data-pid="-t3QMnEp"\u003e不过可惜的是。。。我用了才发现，微信文件备份，不是备份整个微信文件，而是微信里边的聊天文件和图片一类的文件备份。同时备份的操作也略有复杂，需要用到微信里边的极空间私有云小程序。我试着备份了几本大部头的PDF图书，速度到是很快。\u003c/p\u003e\u003cp data-pid="gUg1_IyV"\u003e哎，为什么不能整体的备份微信整个的文件呢？以前每次换手机的时候我都会弄电脑上的腾讯电脑管家，花上漫长的时间来备份微信，然后在话漫长的时间导入到新手机里。现在拖iPhone换机功能的福不用这么费劲了，但我还是挺像要一个一件备份整个微信的功能。微信里边很多信息都是非常重要的，而一旦手机坏了或者丢了，损失的信息微信也是最惨的一个。\u003c/p\u003e\u003cp data-pid="Hi7zM1C_"\u003e强烈希望官方出一个微信备份和还原功能，不过这里估计是需要微信给授权才行了。\u003c/p\u003e\u003cp data-pid="Qn1VwXJy"\u003e另外就是，我用的是Macbook pro，苹果的mac系统有一个挺有用的功能就是时间机器。一般情况下是备份在自己的电脑或者外接硬盘里的，但是非常占空间，大部分人都不会开这个功能。\u003c/p\u003e\u003cp data-pid="6iWxTJp6"\u003e装上极空间以后，就可以选择备份在自己的私有云上，拯救了我这可怜的硬盘空间，而且备份速度超快。\u003c/p\u003e\u003cfigure data-size="normal"\u003e\u003cimg src="https://pic2.zhimg.com/v2-35f2be6be982f0c319ae035174dbaca1_b.jpg" data-caption="" data-size="normal" data-rawwidth="1310" data-rawheight="908" class="origin_image zh-lightbox-thumb" width="1310" data-original="https://pic2.zhimg.com/v2-35f2be6be982f0c319ae035174dbaca1_r.jpg"/\u003e\u003c/figure\u003e\u003cp data-pid="t40j1Hq6"\u003e这样才能最大的发挥出时间机器的功效，这不比以前老版本的windows一件恢复牛逼多了。\u003c/p\u003e\u003cp data-pid="n3uHvW7l"\u003e至于团队空间啊，影视和音乐这些反而不是我太看重的功能，毕竟我是一个开了4个视频网站和一个音乐app以及一个有声书app的年费会员的男人。。。。。好吧，我现在也纳闷我为什么开了这么多会员。反正我已经很久没有体验过下载xx电影然后放在电脑上播放的日子了。\u003c/p\u003e\u003cp data-pid="Mz872LL2"\u003e哦，说到这里，就不得不提极空间一个很有用的功能，就是百度云盘搬家。在网页上登录极空间后，还可以在里边登录你的百度云，然后让极空间去百度云里搬家下来，这个功能对于我这种百度云会员来说是真好用。不过为什么只有在网页里才能用啊，APP里为什么不行呢？\u003c/p\u003e\u003cp data-pid="oIL22ofV"\u003e总结下来，极空间是一个比较适合想弄个私有云，但又对技术没什么研究的新手的一个选择，主要解决的还是基础的大家手机和ipad和电脑空间存储不足的问题，有了这个相当于全家人共享了一个4T甚至更大的网盘，也不用担心续费什么的问题。\u003c/p\u003e\u003cp data-pid="Lk55_UNA"\u003e今年618，本来是没太关注极空间的，毕竟我已经入手了，打折什么与我无关。但没想到极空间在618的活动竟然是延保，不管是之前买的还是之后买的，整机质保都变成了2年，这就真香了。目测原因一是对自己产品质量的自信，二可能是跟最近融资了，身板一下硬气了有关系。\u003c/p\u003e\u003ca data-draft-node="block" data-draft-type="mcn-link-card" data-mcn-id="1518359442285969408"\u003e\u003c/a\u003e\u003ca data-draft-node="block" data-draft-type="mcn-link-card" data-mcn-id="1518357598248624128"\u003e\u003c/a\u003e\u003cp data-pid="NtWoaYY7"\u003e都说618搞活动，我竟然惊人的发现，裸机Z2S天猫和京东的价格就差了200，仔细研究下才，发现京东是4G内存，天猫是2G的，不仔细看还真注意不到。\u003c/p\u003e\u003cp data-pid="nnLC2KWu"\u003e而且套装的价格也不一样，京东的上主机带2个4T硬盘价格是3199，活动后是3099（plus会员），而天猫的同款只要2599，还有一个400的优惠，到手就是2199，但仔细比对后发现除了内存不一样以外，配的硬盘也不一样，京东配的是酷狼4T，天猫上的是西数紫盘4T。\u003c/p\u003e\u003cp data-pid="NiIX_bzo"\u003e突然有一种京东是主打高端用户的感觉。\u003c/p\u003e\u003cp data-pid="m51kyVKc"\u003e不过选哪个，这就看大家的选择了，如果就是想低价入手一个直接能用的，在哪里买，就不用我说了吧。\u003c/p\u003e\u003ca data-draft-node="block" data-draft-type="mcn-link-card" data-mcn-id="1518358292380651521"\u003e\u003c/a\u003e\u003ca data-draft-node="block" data-draft-type="mcn-link-card" data-mcn-id="1518358422524919808"\u003e\u003c/a\u003e\u003cp\u003e\u003c/p\u003e'
    | string
    voteup_count: 21 | number
    comment_count: 4 | number
  }
  created: '2022-06-09T22:36:27+08:00' | string
}
export type Type_Collection_Item_Answer = {
  content: {
    id: '2548272276' | string
    type: 'answer'
    answer_type: 'NORMAL' | string
    url: 'https://www.zhihu.com/question/523766203/answer/2548272276' | string
    created_time: 1656359365 | number
    updated_time: 1656583429 | number
    question: {
      type: 'question' | string
      id: 523766203 | number
      title: '纯军事角度，如果把现在在乌克兰的俄军换成相同人数的美军，能打得更好吗？' | string
      question_type: 'normal' | string
      created: 1648082141 | number
      updated_time: 1648082141 | number
      url: 'https://www.zhihu.com/question/523766203' | string
      is_deleted: boolean
    }
    author: {
      id: 'b830f90d42560328acfd2a85ffcfc35d' | string
      url_token: 'gashero' | string
      name: 'gashero' | string
      use_default_avatar: boolean
      avatar_url: 'https://pic1.zhimg.com/20623a6d7_l.jpg?source=0df5f383' | string
      avatar_url_template: 'https://pic1.zhimg.com/20623a6d7.jpg?source=0df5f383' | string
      is_org: boolean
      type: 'people' | string
      url: 'https://www.zhihu.com/people/b830f90d42560328acfd2a85ffcfc35d' | string
      user_type: 'people' | string
      headline: 'Overflow Engineer' | string
      gender: 1 | number
      is_advertiser: boolean
      vip_info: {
        is_vip: boolean
        rename_days: '' | string
        widget: {
          url: '' | string
          night_mode_url: '' | string
        }
        vip_icon: {
          url: '' | string
          night_mode_url: '' | string
        }
      }
      badge: [
        {
          type: 'best_answerer' | string
          description: '优秀答主' | string
          topics: [
            {
              id: '19554298' | string
              type: 'topic' | string
              url: 'https://www.zhihu.com/topic/19554298' | string
              name: '编程' | string
              avatar_url: 'https://pic4.zhimg.com/v2-27b8ba1e647956fa6f1a2a8ad90138ef_720w.jpg?source=32738c0c' | string
            },
            {
              id: '19552330' | string
              type: 'topic' | string
              url: 'https://www.zhihu.com/topic/19552330' | string
              name: '程序员' | string
              avatar_url: 'https://pic3.zhimg.com/v2-3d917fb11613b7b13ecd7bbeb1c554e6_720w.jpg?source=32738c0c' | string
            },
            {
              id: '19552832' | string
              type: 'topic' | string
              url: 'https://www.zhihu.com/topic/19552832' | string
              name: 'Python' | string
              avatar_url: 'https://pica.zhimg.com/v2-1a9bf5312114564fb132692b355b5199_720w.jpg?source=32738c0c' | string
            },
          ]
        },
        {
          type: 'identity' | string
          description: '科技盐究员' | string
        },
      ]
      badge_v2: {
        title: '编程等 3 个话题下的优秀答主' | string
        merged_badges: [
          {
            type: 'best' | string
            detail_type: 'best' | string
            title: '优秀答主' | string
            description: '编程等 3 个话题下的优秀答主' | string
            url: 'https://www.zhihu.com/question/48509984' | string
            sources: [
              {
                id: '19554298' | string
                token: '19554298' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19554298' | string
                name: '编程' | string
                avatar_path: 'v2-27b8ba1e647956fa6f1a2a8ad90138ef' | string
                avatar_url:
                | 'https://pic4.zhimg.com/v2-27b8ba1e647956fa6f1a2a8ad90138ef_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19552330' | string
                token: '19552330' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19552330' | string
                name: '程序员' | string
                avatar_path: 'v2-3d917fb11613b7b13ecd7bbeb1c554e6' | string
                avatar_url:
                | 'https://pic3.zhimg.com/v2-3d917fb11613b7b13ecd7bbeb1c554e6_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19552832' | string
                token: '19552832' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19552832' | string
                name: 'Python' | string
                avatar_path: 'v2-1a9bf5312114564fb132692b355b5199' | string
                avatar_url:
                | 'https://pica.zhimg.com/v2-1a9bf5312114564fb132692b355b5199_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
            ]
            icon: '' | string
            night_icon: '' | string
          },
          {
            type: 'identity' | string
            detail_type: 'identity' | string
            title: '认证' | string
            description: '科技盐究员' | string
            url: 'https://www.zhihu.com/account/verification/intro' | string
            sources: []
            icon: '' | string
            night_icon: '' | string
          },
        ]
        detail_badges: [
          {
            type: 'best' | string
            detail_type: 'best_answerer' | string
            title: '优秀答主' | string
            description: '编程等 3 个话题下的优秀答主' | string
            url: 'https://www.zhihu.com/question/48509984' | string
            sources: [
              {
                id: '19554298' | string
                token: '19554298' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19554298' | string
                name: '编程' | string
                avatar_path: 'v2-27b8ba1e647956fa6f1a2a8ad90138ef' | string
                avatar_url:
                | 'https://pic4.zhimg.com/v2-27b8ba1e647956fa6f1a2a8ad90138ef_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19552330' | string
                token: '19552330' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19552330' | string
                name: '程序员' | string
                avatar_path: 'v2-3d917fb11613b7b13ecd7bbeb1c554e6' | string
                avatar_url:
                | 'https://pic3.zhimg.com/v2-3d917fb11613b7b13ecd7bbeb1c554e6_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
              {
                id: '19552832' | string
                token: '19552832' | string
                type: 'topic' | string
                url: 'https://www.zhihu.com/topic/19552832' | string
                name: 'Python' | string
                avatar_path: 'v2-1a9bf5312114564fb132692b355b5199' | string
                avatar_url:
                | 'https://pica.zhimg.com/v2-1a9bf5312114564fb132692b355b5199_720w.jpg?source=32738c0c'
                | string
                description: '' | string
              },
            ]
            icon: 'https://pic2.zhimg.com/v2-bf0eec3c31c8e866c468f60eb296696c_l.png?source=32738c0c' | string
            night_icon: 'https://pic4.zhimg.com/v2-c724649168d8f9d36d7c3d13140a2594_l.png?source=32738c0c' | string
          },
          {
            type: 'identity' | string
            detail_type: 'identity_people' | string
            title: '已认证的个人' | string
            description: '科技盐究员' | string
            url: 'https://www.zhihu.com/account/verification/intro' | string
            sources: []
            icon: 'https://pic1.zhimg.com/v2-235258cecb8a0f184c4d38483cd6f6b6_l.png?source=32738c0c' | string
            night_icon: 'https://pic1.zhimg.com/v2-45e870b8f0982bcd7537ea4627afbd00_l.png?source=32738c0c' | string
          },
        ]
        icon: 'https://pic3.zhimg.com/v2-7a1a13d7531f29551f79278e9391b8ee_l.png?source=32738c0c' | string
        night_icon: 'https://pic1.zhimg.com/v2-af71f641951fd5f8b4a7d305288693df_l.png?source=32738c0c' | string
      }
      actived_at: 1 | number
    }
    thumbnail: '' | string
    is_collapsed: boolean
    is_copyable: boolean
    is_visible: boolean
    is_normal: boolean
    voteup_count: 2092 | number
    comment_count: 594 | number
    thanks_count: 155 | number
    is_mine: boolean
    comment_permission: 'all' | string
    reshipment_settings: 'allowed' | string
    content:
    | '\u003cp data-pid="l4q7UpjT"\u003e首先要明白，乌克兰也没那么弱。很多人不知道的是，美国甚至未曾入侵过一个像乌克兰这个规模的国家。\u003c/p\u003e\u003cp data-pid="0o475x5N"\u003e首先列一下美国自二战后的军事行动。以及被入侵国家当时的人口规模。\u003c/p\u003e\u003ca data-draft-node="block" data-draft-type="link-card" href="https://link.zhihu.com/?target=http%3A//www.yhcqw.com/14/12773.html" class=" wrap external" target="_blank" rel="nofollow noreferrer"\u003e“二战”后美国发动的13场海外战争\u003c/a\u003e\u003ctable data-draft-node="block" data-draft-type="table" data-size="normal"\u003e\u003ctbody\u003e\u003ctr\u003e\u003cth\u003e战争名字\u003c/th\u003e\u003cth\u003e开始年份\u003c/th\u003e\u003cth\u003e被入侵国家\u003c/th\u003e\u003cth\u003e被入侵国当时人口\u003c/th\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e朝鲜战争\u003c/td\u003e\u003ctd\u003e1950\u003c/td\u003e\u003ctd\u003e朝鲜\u003c/td\u003e\u003ctd\u003e约3000万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e入侵黎巴嫩\u003c/td\u003e\u003ctd\u003e1958\u003c/td\u003e\u003ctd\u003e黎巴嫩\u003c/td\u003e\u003ctd\u003e166万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e越南战争\u003c/td\u003e\u003ctd\u003e1961\u003c/td\u003e\u003ctd\u003e越南\u003c/td\u003e\u003ctd\u003e3300万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e入侵格林纳达\u003c/td\u003e\u003ctd\u003e1983\u003c/td\u003e\u003ctd\u003e格林纳达\u003c/td\u003e\u003ctd\u003e9.6万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e空袭利比亚\u003c/td\u003e\u003ctd\u003e1986\u003c/td\u003e\u003ctd\u003e利比亚\u003c/td\u003e\u003ctd\u003e399万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e巴拿马战争\u003c/td\u003e\u003ctd\u003e1989\u003c/td\u003e\u003ctd\u003e巴拿马\u003c/td\u003e\u003ctd\u003e242万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e利比里亚武装撤侨\u003c/td\u003e\u003ctd\u003e1990\u003c/td\u003e\u003ctd\u003e利比里亚\u003c/td\u003e\u003ctd\u003e207万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e海湾战争\u003c/td\u003e\u003ctd\u003e1991\u003c/td\u003e\u003ctd\u003e伊拉克\u003c/td\u003e\u003ctd\u003e1789万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e干涉索马里\u003c/td\u003e\u003ctd\u003e1992\u003c/td\u003e\u003ctd\u003e索马里\u003c/td\u003e\u003ctd\u003e730万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e科索沃战争\u003c/td\u003e\u003ctd\u003e1999\u003c/td\u003e\u003ctd\u003e南斯拉夫联盟\u003c/td\u003e\u003ctd\u003e1235万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e阿富汗战争\u003c/td\u003e\u003ctd\u003e2001\u003c/td\u003e\u003ctd\u003e阿富汗\u003c/td\u003e\u003ctd\u003e2161万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e第二次海湾战争\u003c/td\u003e\u003ctd\u003e2003\u003c/td\u003e\u003ctd\u003e伊拉克\u003c/td\u003e\u003ctd\u003e2564万\u003c/td\u003e\u003c/tr\u003e\u003ctr\u003e\u003ctd\u003e利比亚战争\u003c/td\u003e\u003ctd\u003e2011\u003c/td\u003e\u003ctd\u003e利比亚\u003c/td\u003e\u003ctd\u003e624万\u003c/td\u003e\u003c/tr\u003e\u003c/tbody\u003e\u003c/table\u003e\u003cp data-pid="Ao6T1zhQ"\u003e然后乌克兰呢，可查到的最新数据是2020年乌克兰人口4413万。比历史上美国入侵过的最大的国家越南还多。美国入侵越南时，给美国留下多大的心理阴影应该都明白吧。\u003c/p\u003e\u003cp data-pid="UoFFCIjw"\u003e如上表格里仔细看，没有一个工业国。甚至大半的国家连发展中国家都算不上。相比之下，乌克兰继承了苏联时期相当可观的工业实力和研发实力。\u003c/p\u003e\u003cp data-pid="BMLW6t3R"\u003e这些被入侵的国家里，唯一算有一点点苏联遗产的是南联盟，但跟乌克兰比那是差得太远了。南联盟解体在1999年前GDP为132亿美元。而乌克兰在2020年GDP为1556亿美元，相当于当时南联盟的近12倍。这个规模已经不是通货膨胀可以解释的了。而且即便是南联盟，美国为首的北约也没敢地面入侵，全程只是空袭。\u003c/p\u003e\u003cp class="ztext-empty-paragraph"\u003e\u003cbr/\u003e\u003c/p\u003e\u003cp data-pid="TR9Z1vgk"\u003e所以，当美国面临一个人口比越南还高1/3。经济实力相当于南联盟12倍。拥有大量苏联遗产的工业国。你猜美国又能作出什么样的选择呢。\u003c/p\u003e\u003cp data-pid="IDIW88_8"\u003e最后的彩蛋是伊朗。伊朗当前人口8318万人，GDP为17390亿美元。或者说，人口相当于越南的252%，GDP相当于南联盟的132倍。所以每次与伊朗发生冲突，而伊朗进行军事反击，击中美国的设施时，美国都表现的特别乖巧。\u003c/p\u003e'
    | string
    title: '' | string
    excerpt:
    | '首先要明白，乌克兰也没那么弱。很多人不知道的是，美国甚至未曾入侵过一个像乌克兰这个规模的国家。 首先列一下美国自二战后的军事行动。以及被入侵国家当时的人口规模。 “二战”后美国发动的13场海外战争 战争名字开始年份被入侵国家被入侵国当时人口朝鲜战争1950朝鲜约3000万入侵黎巴嫩1958黎巴嫩166万越南战争1961越南3300万入侵格林纳达1983格林纳达9.6万空袭利比亚1986利比亚399万巴拿马战争1989巴拿马242万利比里亚武装撤…'
    | string
    suggest_edit: {
      reason: '' | string
      status: boolean
      tip: '' | string
      title: '' | string
      unnormal_details: {
        status: '' | string
        description: '' | string
        reason: '' | string
        reason_id: 0 | number
        note: '' | string
      }
      url: '' | string
    }
    thumbnail_info: {
      count: 0 | number
      type: '' | string
      thumbnails: []
    }
    attached_info: 'ogEPCAQQAxiUmY6/CSCC8cElkgIlCgk0OTM0MDYyOTYSCjI1NDgyNzIyNzYYBCIKSU1BR0VfVEVYVA==' | string
    relationship: {
      is_author: boolean
      is_authorized: boolean
      is_nothelp: boolean
      is_thanked: boolean
      voting: 0 | number
    }
    attachment: {
      type: 'ANSWER' | string
      attachment_id: '' | string
    }
    is_deleted: boolean
  }
  created: '2022-06-28T03:49:25+08:00' | string
}

export type Type_Collection_Item = Type_Collection_Item_Answer | Type_Collection_Item_Article | Type_Collection_Item_Pin
export type Type_Collection_Response = {
  paging: {
    is_end: boolean
    is_start: boolean
    next: 'https://www.zhihu.com/api/v4/collections/701083411/items?limit=20\u0026offset=20' | string
    previous: 'https://www.zhihu.com/api/v4/collections/701083411/items?limit=20\u0026offset=0' | string
    totals: 7 | number
  }
  data: Type_Collection_Item[]
}
