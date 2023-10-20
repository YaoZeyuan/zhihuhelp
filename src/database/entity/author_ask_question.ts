import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class AuthorAskQuestion {
  @Column("varchar", { nullable: false })
  question_id!: string

  @Column("varchar", { nullable: false })
  author_url_token!: string

  @Column("varchar", { nullable: false })
  author_id!: string

  @Column("text", { nullable: false })
  raw_json!: string
}
