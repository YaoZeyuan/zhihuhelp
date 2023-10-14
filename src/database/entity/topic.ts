import { Column, Entity } from "typeorm"

@Entity()
export class Topic {
  @Column()
  topic_id!: string

  @Column()
  raw_json!: string
}

