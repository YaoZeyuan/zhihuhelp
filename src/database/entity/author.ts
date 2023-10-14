import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class AuthorAskQuestion {
  @Column()
  id!: string

  @Column()
  url_token!: string

  @Column()
  raw_json!: string
}
