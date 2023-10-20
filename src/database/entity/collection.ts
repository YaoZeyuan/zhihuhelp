import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Collection {
  @PrimaryColumn("varchar", { nullable: false })
  collection_id!: string

  @Column("text", { nullable: false })
  raw_json!: string
}
