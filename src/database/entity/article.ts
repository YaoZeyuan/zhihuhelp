import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Article {
  @PrimaryColumn("varchar", { nullable: false })
  article_id!: string

  @Column("varchar", { nullable: false })
  author_url_token!: string

  @Column("varchar", { nullable: false })
  author_id!: string

  @Column("varchar", { nullable: false })
  column_id!: string

  @Column("text", { nullable: false })
  raw_json!: string
}
