declare namespace TaskConfig {
    type AuthorCollectionType = "author-question" | "author-answer" | "author-pin" | "author-agree" | "author-watch-question" | "author-activity"
    type ItemCollectionType = "topic" | "collection" | "column" | "article" | "question" | "answer" | "pin"
    type OrderBy = "default" | "createAt" | "updateAt" | "voteUpCount" | "commentCount"
    type ImageQuilty = "default" | "none" | "raw" | "hd"
    type Record = {
        "type": ItemCollectionType | AuthorCollectionType,
        "id": string | number,
        "orderBy": OrderBy,
        "order": "asc" | "desc",
        "imageQuilty": ImageQuilty, // 图片质量
        "coverImage": string, // 封面图, 默认为王闹海
        "comment": string // 备注
    }

    // 自定义抓取
    type Customer = {
        "type": "customer",
        "config_list": Array<Record>,
        "imageQuilty": ImageQuilty, // 图片质量
        "coverImage": string, // 封面图, 默认为王闹海
        "title": string, // 书名
        "comment": string // 备注
    }
}

export default TaskConfig