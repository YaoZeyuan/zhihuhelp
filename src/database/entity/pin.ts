import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class AuthorAskQuestion {
  @Column()
  pin_id!: string

  @Column()
  author_url_token!: string

  @Column()
  author_id!: string

  @Column()
  raw_json!: string
}

