import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class AuthorAskQuestion {
  @Column()
  collection_id!: string

  @Column()
  raw_json!: string
}
