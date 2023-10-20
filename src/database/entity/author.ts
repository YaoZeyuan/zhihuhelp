import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Author {
  @Column("varchar", { nullable: false })
  id!: string

  @Column("varchar", { nullable: false })
  url_token!: string

  @Column("text", { nullable: false })
  raw_json!: string
}
