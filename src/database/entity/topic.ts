import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Topic {
  @PrimaryColumn("varchar", { nullable: false })
  topic_id!: string

  @Column("text", { nullable: false })
  raw_json!: string
}

