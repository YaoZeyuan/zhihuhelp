import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Answer {
  @PrimaryColumn("varchar", { nullable: false })
  answer_id!: string

  @Column("varchar", { nullable: false })
  question_id!: string

  @Column("varchar", { nullable: false })
  author_url_token!: string

  @Column("varchar", { nullable: false })
  author_id!: string

  @Column("text", { nullable: false })
  raw_json!: string
}
