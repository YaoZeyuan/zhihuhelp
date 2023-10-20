import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Pin {
  @PrimaryColumn("varchar", { nullable: false })
  pin_id!: string

  @Column("varchar", { nullable: false })
  author_url_token!: string

  @Column("varchar", { nullable: false })
  author_id!: string

  @Column("text", { nullable: false })
  raw_json!: string
}

