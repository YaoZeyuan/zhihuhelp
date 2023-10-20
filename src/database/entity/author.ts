import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Author {
  @PrimaryColumn("varchar", { nullable: false })
  id!: string

  @Column("varchar", { nullable: false })
  url_token!: string

  @Column("text", { nullable: false })
  raw_json!: string
}
