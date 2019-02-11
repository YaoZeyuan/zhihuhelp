declare namespace TaskConfig {
    type Record = {
        "type": "author" | "topic" | "collection" | "activity" | "column",
        "id": "account",
        "orderBy": "default" | "createAt" | "voteUpCount",
        "order": "asc" | "desc",
        "comment": string // 备注
    }
}

export default TaskConfig