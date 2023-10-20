import { Column, Entity } from "typeorm"

@Entity()
export class Topic {
  @Column("varchar", { nullable: false })
  topic_id!: string

  @Column("text", { nullable: false })
  raw_json!: string
}

