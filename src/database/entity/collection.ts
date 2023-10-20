import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Collection {
  @Column()
  collection_id!: string

  @Column()
  raw_json!: string
}
