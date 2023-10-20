import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Collection {
  @Column("varchar", { nullable: false })
  collection_id!: string

  @Column("text", { nullable: false })
  raw_json!: string
}
