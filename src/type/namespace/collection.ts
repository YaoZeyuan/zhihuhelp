declare namespace Collection {
  type Info = {
    collection: {
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
      url: 'https://api.zhihu.com/collections/32755791' | string
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
  }
  type AnswerExcerpt = {
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
    collect_time: 1549815845 | number
    updated_time: 1548892577 | number
    comment_count: 29 | number
    created_time: 1548854227 | number
    voteup_count: 435 | number
    type: 'answer' | string
    id: 585876967 | number
    thanks_count: 55 | number
  }
}

export default Collection
