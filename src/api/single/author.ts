import Base from '~/src/api/single/base'
import TypeAuthor from '~/src/type/zhihu/author'

class Author extends Base {
  /**
   * 获取用户信息
   * @param account 用户账号, hash或主页账号均可
   */
  static async asyncGetAutherInfo(account: string): Promise<TypeAuthor.Record> {
    /**
     * 响应值demo => {"following_count":19,"shared_count":0,"included_text":"","pins_count":2,"is_activity_blocked":false,"is_force_renamed":false,"lite_favorite_content_count":0,"headline":"前私募研究员，公号“商业说”。","participated_live_count":1,"is_bind_sina":false,"location":[{"introduction":"","avatar_url":"https://pic4.zhimg.com/e82bab09c_s.jpg","name":"Kyushu","experience ":"","url":"","excerpt":"","type":"topic","id":""}],"type":"people","following_topic_count":15,"answer_count":65,"is_noti_reset_password":false,"url_token":"asdfkjasdfhwerqwer","articles_count":26,"name":"云松令","gender":0,"is_force_reset_password":false,"is_locked":false,"reactions_count":2,"hosted_live_count":0,"is_followed":false,"is_hanged":false,"user_type":"people","is_unicom_free":false,"is_following":false,"marked_answers_text":"","included_articles_count":0,"education":[{"name":"京都大学","url":"https://api.zhihu.com/topics/19919139","excerpt":"京都大学（英语：Kyoto University，日语平假名：きょうとだいがく），简称京大（きょうだい），是一所本部位于日本京都市左京区的日本顶尖研究型大学，在日本仅次于东京大学的学科齐全、规模宏大的国立综合大学，日本继东京大学之后设立的第二所旧制帝国大学。作为日本国内的最高学府之一，京都大学在全球都享有很高的声望，被誉为“科学家的摇篮”。京都大学创建于1897年，最初名为“京都帝国大学”，二战后，正式更名为“京都…","experience":"","introduction":"京都大学（英语：Kyoto University，日语平假名：きょうとだいがく），简称京大（きょうだい），是一所本部位于日本京都市左京区的日本顶尖研究型大学，在日本仅次于东京大学的学科齐全、规模宏大的国立综合大学，日本继东京大学之后设立的第二所旧制帝国大学。作为日本国内的最高学府之一，京都大学在全球都享有很高的声望，被誉为“科学家的摇篮”。京都大学创建于1897年，最初名为“京都帝国大学”，二战后，正式更名为“京都大学”。迄2017年为止，京都大学已经诞生了9名诺贝尔奖得主、2名菲尔兹奖得主、6名沃尔夫奖得主、4名拉斯克奖得主、4名芥川奖得主、6名京都奖得主、2名日本国际奖得主、日本唯一的达尔文-华莱士奖章得主，以及两位日本首相，其世界500强企业CEO校友数全球第12名，可谓巨擘辈出，其毕业生在科研学术界乃至政界商界普遍拥有举足轻重的地位。京都大学是亚太顶尖大学组织环太平洋大学联盟的成员校，东亚研究型大学协会成员校，日本文部科学省指定的“超级国际化大学计划”A类顶尖校。在2017年发布的QS世界大学排名，京都大学位列全球第36位、日本第2位；在CWUR大学排名，京都大学位列全球第20位、日本第2位；而在ARWU世界大学学术排名中，京都大学位列全球第26位，日本第2位，其在理学领域排名世界第18，生命科学排名世界第20，医学排名世界第49；在数学学科排名世界第17，物理学排名世界第27，化学排名世界第9，可谓是一所名副其实的日本顶尖高等学府。","avatar_url":"https://pic1.zhimg.com/50/a8552d820_s.jpg","meta":{"category":"n_wiki","type":"metapedia","id":1023621155533488129},"type":"topic","id":"19919139"}],"employment":[[{"name":"国立西洋美术馆","url":"https://api.zhihu.com/topics/20341973","excerpt":"","experience":"","introduction":"","avatar_url":"https://pic4.zhimg.com/50/e82bab09c_s.jpg","meta":{"category":"n_wiki","type":"metapedia","id":1023619567959961600},"type":"topic","id":"20341973"},{}]],"id":"6f68e2ecb01d304cd67451f9d647bb2c","favorite_count":2,"voteup_count":2348,"live_count":1,"is_blocking":false,"following_columns_count":13,"is_baned":false,"is_enable_signalment":true,"is_enable_watermark":true,"following_favlists_count":0,"favorited_count":817,"open_ebook_feature":true,"follower_count":399,"badge":[],"infinity":{"is_activated":false,"url":"","show_my_infinity_entrance":false},"description":"前私募研究員，專欄《商业社会》，公号《商业说》","business":{"name":"博物馆","url":"https://api.zhihu.com/topics/19551450","excerpt":"博物馆（museum）是一个为社会及其发展服务的、向公众开放的非营利性常设机构，为研究、教育和欣赏的目的征集、保护、研究、传播并展出人类及人类环境的物质及非物质遗产。——国际博物馆协会对博物馆的定义，2007年（据法文版译出）","introduction":"博物馆（museum）是一个为社会及其发展服务的、向公众开放的非营利性常设机构，为研究、教育和欣赏的目的征集、保护、研究、传播并展出人类及人类环境的物质及非物质遗产。<i>——国际博物馆协会对博物馆的定义，2007年（据法文版译出）</i>","avatar_url":"https://pic1.zhimg.com/50/v2-232eb7493e98bc4d142d6b33b0b38bd8_s.jpg","meta":{"category":"n_wiki","type":"metapedia","id":1023617278507626496},"type":"topic","id":"19551450"},"columns_count":1,"cover_url":"","question_count":22,"url":"https://api.zhihu.com/people/6f68e2ecb01d304cd67451f9d647bb2c","vip_info":{"is_vip":false},"included_answers_count":0,"avatar_url":"http://pic3.zhimg.com/50/38bb8d01012853b47517324149462ff4_s.jpg","following_question_count":136,"thanked_count":209,"is_apply_renamed":false,"independent_articles_count":0}
     */
    const baseUrl = `https://api.zhihu.com/people/${account}`
    const config = {}
    const record: TypeAuthor.Record = await Base.http.get(baseUrl, {
      params: config,
    })
    const info = record
    return info
  }

  /**
   * 获取被封禁的用户信息(利用知乎回答接口)
   * @param account 用户账号, hash或主页账号均可
   */
  static async asyncGetBlockAccountAutherInfo(account: string): Promise<TypeAuthor.Record> {
    /**
     * 响应值demo => {"following_count":19,"shared_count":0,"included_text":"","pins_count":2,"is_activity_blocked":false,"is_force_renamed":false,"lite_favorite_content_count":0,"headline":"前私募研究员，公号“商业说”。","participated_live_count":1,"is_bind_sina":false,"location":[{"introduction":"","avatar_url":"https://pic4.zhimg.com/e82bab09c_s.jpg","name":"Kyushu","experience ":"","url":"","excerpt":"","type":"topic","id":""}],"type":"people","following_topic_count":15,"answer_count":65,"is_noti_reset_password":false,"url_token":"asdfkjasdfhwerqwer","articles_count":26,"name":"云松令","gender":0,"is_force_reset_password":false,"is_locked":false,"reactions_count":2,"hosted_live_count":0,"is_followed":false,"is_hanged":false,"user_type":"people","is_unicom_free":false,"is_following":false,"marked_answers_text":"","included_articles_count":0,"education":[{"name":"京都大学","url":"https://api.zhihu.com/topics/19919139","excerpt":"京都大学（英语：Kyoto University，日语平假名：きょうとだいがく），简称京大（きょうだい），是一所本部位于日本京都市左京区的日本顶尖研究型大学，在日本仅次于东京大学的学科齐全、规模宏大的国立综合大学，日本继东京大学之后设立的第二所旧制帝国大学。作为日本国内的最高学府之一，京都大学在全球都享有很高的声望，被誉为“科学家的摇篮”。京都大学创建于1897年，最初名为“京都帝国大学”，二战后，正式更名为“京都…","experience":"","introduction":"京都大学（英语：Kyoto University，日语平假名：きょうとだいがく），简称京大（きょうだい），是一所本部位于日本京都市左京区的日本顶尖研究型大学，在日本仅次于东京大学的学科齐全、规模宏大的国立综合大学，日本继东京大学之后设立的第二所旧制帝国大学。作为日本国内的最高学府之一，京都大学在全球都享有很高的声望，被誉为“科学家的摇篮”。京都大学创建于1897年，最初名为“京都帝国大学”，二战后，正式更名为“京都大学”。迄2017年为止，京都大学已经诞生了9名诺贝尔奖得主、2名菲尔兹奖得主、6名沃尔夫奖得主、4名拉斯克奖得主、4名芥川奖得主、6名京都奖得主、2名日本国际奖得主、日本唯一的达尔文-华莱士奖章得主，以及两位日本首相，其世界500强企业CEO校友数全球第12名，可谓巨擘辈出，其毕业生在科研学术界乃至政界商界普遍拥有举足轻重的地位。京都大学是亚太顶尖大学组织环太平洋大学联盟的成员校，东亚研究型大学协会成员校，日本文部科学省指定的“超级国际化大学计划”A类顶尖校。在2017年发布的QS世界大学排名，京都大学位列全球第36位、日本第2位；在CWUR大学排名，京都大学位列全球第20位、日本第2位；而在ARWU世界大学学术排名中，京都大学位列全球第26位，日本第2位，其在理学领域排名世界第18，生命科学排名世界第20，医学排名世界第49；在数学学科排名世界第17，物理学排名世界第27，化学排名世界第9，可谓是一所名副其实的日本顶尖高等学府。","avatar_url":"https://pic1.zhimg.com/50/a8552d820_s.jpg","meta":{"category":"n_wiki","type":"metapedia","id":1023621155533488129},"type":"topic","id":"19919139"}],"employment":[[{"name":"国立西洋美术馆","url":"https://api.zhihu.com/topics/20341973","excerpt":"","experience":"","introduction":"","avatar_url":"https://pic4.zhimg.com/50/e82bab09c_s.jpg","meta":{"category":"n_wiki","type":"metapedia","id":1023619567959961600},"type":"topic","id":"20341973"},{}]],"id":"6f68e2ecb01d304cd67451f9d647bb2c","favorite_count":2,"voteup_count":2348,"live_count":1,"is_blocking":false,"following_columns_count":13,"is_baned":false,"is_enable_signalment":true,"is_enable_watermark":true,"following_favlists_count":0,"favorited_count":817,"open_ebook_feature":true,"follower_count":399,"badge":[],"infinity":{"is_activated":false,"url":"","show_my_infinity_entrance":false},"description":"前私募研究員，專欄《商业社会》，公号《商业说》","business":{"name":"博物馆","url":"https://api.zhihu.com/topics/19551450","excerpt":"博物馆（museum）是一个为社会及其发展服务的、向公众开放的非营利性常设机构，为研究、教育和欣赏的目的征集、保护、研究、传播并展出人类及人类环境的物质及非物质遗产。——国际博物馆协会对博物馆的定义，2007年（据法文版译出）","introduction":"博物馆（museum）是一个为社会及其发展服务的、向公众开放的非营利性常设机构，为研究、教育和欣赏的目的征集、保护、研究、传播并展出人类及人类环境的物质及非物质遗产。<i>——国际博物馆协会对博物馆的定义，2007年（据法文版译出）</i>","avatar_url":"https://pic1.zhimg.com/50/v2-232eb7493e98bc4d142d6b33b0b38bd8_s.jpg","meta":{"category":"n_wiki","type":"metapedia","id":1023617278507626496},"type":"topic","id":"19551450"},"columns_count":1,"cover_url":"","question_count":22,"url":"https://api.zhihu.com/people/6f68e2ecb01d304cd67451f9d647bb2c","vip_info":{"is_vip":false},"included_answers_count":0,"avatar_url":"http://pic3.zhimg.com/50/38bb8d01012853b47517324149462ff4_s.jpg","following_question_count":136,"thanked_count":209,"is_apply_renamed":false,"independent_articles_count":0}
     */
    const baseUrl = `https://www.zhihu.com/api/v4/members/${account}/answers`
    const config = {
      include:
        'data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,collapsed_by,suggest_edit,comment_count,can_comment,content,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,question,excerpt,is_labeled,label_info,relationship.is_authorized,voting,is_author,is_thanked,is_nothelp;data[*].author.badge[?(type=best_answerer)].topics',
      offset: 0,
      limit: 10,
      sort_by: Base.CONST_SORT_BY_CREATED,
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })

    let templateInfo = {
      id: '3d198a56310c02c4a83efb9f4a4c027e',
      url_token: 'zhihuadmin',
      name: '已注销账号',
      use_default_avatar: false,
      avatar_url: 'https://pic4.zhimg.com/v2-85b5868ae1ee114c5818d29201aef708_l.jpg',
      avatar_url_template: 'https://pic1.zhimg.com/v2-85b5868ae1ee114c5818d29201aef708.jpg',
      is_org: false,
      type: 'people',
      url: 'https://api.zhihu.com/people/3d198a56310c02c4a83efb9f4a4c027e',
      user_type: 'people',
      headline: '账号已注销',
      is_active: true,
      description: '',
      gender: 1,
      is_advertiser: false,
      vip_info: {
        is_vip: true,
        rename_days: '60',
        widget: {
          url: 'https://pic3.zhimg.com/v2-a35d7cf28be4ead527c2a885c6d0e950_r.png',
          night_mode_url: 'https://pic2.zhimg.com/v2-17cb94795955fc3bd5fef85afde188f6_r.png',
        },
        vip_icon: {
          url: 'https://pic1.zhimg.com/v2-4812630bc27d642f7cafcd6cdeca3d7a_r.png',
          night_mode_url: 'https://pic4.zhimg.com/v2-c9686ff064ea3579730756ac6c289978_r.png',
        },
      },
      badge: [{ type: 'identity', description: '知乎 官方帐号' }],
      all_verify_apply: { apply_status: 1, applys: [], show_entrance: true },
      account_status: [],
      is_following: false,
      is_followed: false,
      is_blocking: false,
      is_activity_blocked: false,
      is_baned: false,
      is_locked: false,
      is_force_renamed: false,
      is_apply_renamed: false,
      is_hanged: false,
      is_force_reset_password: false,
      is_noti_reset_password: false,
      follower_count: 365068,
      following_count: 27,
      answer_count: 77,
      question_count: 11,
      articles_count: 253,
      independent_articles_count: 0,
      columns_count: 4,
      zvideo_count: 0,
      favorite_count: 0,
      favorited_count: 35022,
      lite_favorite_content_count: 0,
      pins_count: 153,
      reactions_count: 29155,
      shared_count: 20,
      voteup_count: 215638,
      thanked_count: 16042,
      live_count: 0,
      hosted_live_count: 0,
      participated_live_count: 0,
      included_answers_count: 2,
      included_articles_count: 4,
      included_text: '编辑推荐、知乎圆桌和知乎日报',
      marked_answers_text: '编辑推荐、知乎圆桌和知乎日报',
      following_columns_count: 0,
      following_topic_count: 8,
      following_question_count: 122,
      following_favlists_count: 0,
      recognized_count: 33,
      business: { id: '', type: 'topic', url: '', name: '', avatar_url: '' },
      location: [],
      employment: [],
      education: [],
      cover_url: 'https://pic3.zhimg.com/v2-00d7b58eb48b001a359c889ca8cd6119_r.jpg',
      cover_url_template: 'https://pic3.zhimg.com/v2-00d7b58eb48b001a359c889ca8cd6119.jpg',
      juror: { is_juror: false, vote_count: 0, review_count: 0, review_liked_count: 0 },
      is_bind_sina: false,
      renamed_fullname: '',
      is_bind_phone: true,
      is_realname: true,
      is_unicom_free: false,
      is_enable_watermark: false,
      is_enable_double_click_voteup: true,
      is_enable_unfriendly_message: false,
      is_enable_signalment: true,
      open_ebook_feature: true,
      is_subscribing: false,
      infinity: {
        is_activated: true,
        url: 'https://www.zhihu.com/zhi/people/821832649168535552/conversation?utm_campaign=zhi_three\u0026utm_source=zhihuapp\u0026utm_medium=button',
        show_my_infinity_entrance: true,
      },
      mcn_user_info: {
        status: 1,
        showcase_permission: 0,
        jingdong_param:
          'f0d58735c7e6461c0d4f21f4d831c64c4eddd4b037416b22682aab2082b5c5a9fc99b9f2d27e64df1a1db29a4d367c8a',
        jingdong_app_param:
          '840dad069ca5ccebffda8b7fb3da6070e3513c808265b2be362a20a5ca6bfa4e14df6c255e4dbce9e9b71988f00de0fa3145579fc1b46f44d64b3bab375c521b68a359d796c09fc8e2e3ad8e5aa6b2bd151a32292d7d738119e8d72c93536e143d2a0c459566e5085d0041c9c73e18ed6af7028ca95211f40a6460859f085661f8283ec09a0d808301151b05c6d93631fc99b9f2d27e64df1a1db29a4d367c8a',
        available_source: ['jingdong', 'taobao', 'zhihu', 'pinduoduo'],
        bind_info: [
          { pid: '', source: 'jingdong' },
          { pid: '', source: 'taobao' },
        ],
      },
      creator_info: { is_allow_enter: true },
      self_recommend: 'TA 在「算法」话题下收到超多赞同哦，赶紧关注一下！',
    }

    // 利用模板伪造一份用户信息
    let rawAnswerUserInfo = record?.data?.[0]?.author ?? {}

    let answerUserInfo: TypeAuthor.Record = {
      ...templateInfo,
      ...rawAnswerUserInfo,
    }

    // 只提供核心数据
    answerUserInfo.answer_count = record?.paging?.totals ?? 0

    return answerUserInfo
  }

  /**
   * 获取用户回答列表
   * @param url_token
   * @param offset
   * @param limit
   * @param sortBy
   */
  static async asyncGetAutherAnswerList(
    url_token: string,
    offset: number = 0,
    limit: number = 20,
    sortBy: string = Base.CONST_SORT_BY_CREATED,
  ): Promise<TypeAuthor.Answer[]> {
    const baseUrl = `https://www.zhihu.com/api/v4/members/${url_token}/answers`
    const config = {
      include:
        'data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,collapsed_by,suggest_edit,comment_count,can_comment,content,voteup_count,reshipment_settings,comment_permission,mark_infos,created_time,updated_time,review_info,question,excerpt,is_labeled,label_info,relationship.is_authorized,voting,is_author,is_thanked,is_nothelp;data[*].author.badge[?(type=best_answerer)].topics',
      offset: offset,
      limit: limit,
      sort_by: sortBy,
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const answerList = record?.data ?? []
    return answerList
  }

  /**
   * 获取用户提问列表
   * @param url_token
   * @param offset
   * @param limit
   */
  static async asyncGetAutherQuestionList(
    url_token: string,
    offset: number = 0,
    limit: number = 20,
  ): Promise<TypeAuthor.Question[]> {
    const baseUrl = `https://www.zhihu.com/api/v4/members/${url_token}/questions`
    const config = {
      offset: offset,
      limit: limit,
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const questionList = record?.data ?? []
    return questionList
  }

  /**
   * 获取用户想法列表
   * @param url_token
   * @param offset
   * @param limit
   */
  static async asyncGetAutherPinList(
    url_token: string,
    offset: number = 0,
    limit: number = 20,
  ): Promise<TypeAuthor.Pin[]> {
    const baseUrl = `https://www.zhihu.com/api/v4/members/${url_token}/pins`
    const config = {
      offset: offset,
      limit: limit,
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const pinList = record?.data ?? []
    return pinList
  }

  /**
   * 获取用户文章列表
   * @param url_token
   * @param offset
   * @param limit
   */
  static async asyncGetAutherArticleList(
    url_token: string,
    offset: number = 0,
    limit: number = 20,
  ): Promise<TypeAuthor.Article[]> {
    const baseUrl = `https://www.zhihu.com/api/v4/members/${url_token}/articles`
    const config = {
      offset: offset,
      limit: limit,
    }
    const record = await Base.http.get(baseUrl, {
      params: config,
    })
    const articleList = record?.data ?? []
    return articleList
  }
}
export default Author
